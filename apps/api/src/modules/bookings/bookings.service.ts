import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserData } from '../auth/current-user.decorator';
import type { PaginatedResult } from '../app/pagination.types';
import type { Booking, JsonValue, Passenger } from './bookings.types';
import { DuffelProvider } from '../flights/providers/duffel.provider';
import { PricingService } from '../pricing/pricing.service';
import PDFDocument from 'pdfkit';

function toBooking(dto: {
  id: string;
  status: 'draft' | 'payment' | 'confirmed' | 'cancelled';
  offerId: string;
  offerData: Prisma.JsonValue;
  currency: string;
  amount: string;
  passengers?: Prisma.JsonValue | null;
  duffelOrderId?: string | null;
  duffelPnr?: string | null;
  duffelTicketNumbers?: string[];
  agencyId: string;
  agencyName?: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}): Booking {
  return {
    id: dto.id,
    status: dto.status,
    offerId: dto.offerId,
    offerData: dto.offerData as JsonValue,
    totalPrice: {
      currency: dto.currency,
      amount: dto.amount
    },
    passengers: Array.isArray(dto.passengers) ? (dto.passengers as unknown as Booking['passengers']) : undefined,
    duffelOrderId: typeof dto.duffelOrderId === 'string' ? dto.duffelOrderId : undefined,
    duffelPnr: typeof dto.duffelPnr === 'string' ? dto.duffelPnr : undefined,
    duffelTicketNumbers: Array.isArray(dto.duffelTicketNumbers) ? dto.duffelTicketNumbers : undefined,
    agencyId: dto.agencyId,
    agencyName: dto.agencyName,
    createdByUserId: dto.createdByUserId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt
  };
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly duffel: DuffelProvider,
    private readonly pricing: PricingService
  ) {}

  async listPagedForUser(
    user: CurrentUserData,
    input: {
      agencyId?: string;
      status?: 'draft' | 'confirmed' | 'cancelled';
      search?: string;
      fromDate?: string;
      toDate?: string;
      limit: number;
      offset: number;
    }
  ): Promise<PaginatedResult<Booking>> {
    const limit = input.limit;
    const offset = input.offset;

    const createdAtFilter: Prisma.DateTimeFilter = {
      ...(input.fromDate ? { gte: new Date(input.fromDate) } : {}),
      ...(input.toDate ? { lte: new Date(input.toDate) } : {})
    };
    const dateFilter: Prisma.BookingWhereInput =
      Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {};

    const searchFilter: Prisma.BookingWhereInput = input.search
      ? { offerId: { contains: input.search, mode: 'insensitive' } }
      : {};

    if (user.role === 'agent') {
      if (!user.agencyId) {
        throw new BadRequestException('User has no agency');
      }

      const where: Prisma.BookingWhereInput = {
        agencyId: user.agencyId,
        ...(input.status ? { status: input.status } : {}),
        ...dateFilter,
        ...searchFilter
      };

      const [total, rows] = await Promise.all([
        this.prisma.booking.count({ where }),
        this.prisma.booking.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        })
      ]);

      return {
        items: rows.map(toBooking),
        meta: { total, limit, offset }
      };
    }

    const where: Prisma.BookingWhereInput = {
      ...(input.agencyId ? { agencyId: input.agencyId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...dateFilter,
      ...searchFilter
    };

    const [total, rows] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          agency: { select: { name: true } }
        }
      })
    ]);

    return {
      items: rows.map((r) => toBooking({ ...r, agencyName: r.agency?.name })),
      meta: { total, limit, offset }
    };
  }

  async createForAgent(
    user: CurrentUserData,
    input: { offerId: string; offerData?: unknown; currency: string; amount: string; passengers: any[] }
  ): Promise<Booking> {
    if (user.role !== 'agent') {
      throw new BadRequestException('Only agents can create bookings');
    }
    if (!user.agencyId) {
      throw new BadRequestException('User has no agency');
    }
    if (input.offerData === null || input.offerData === undefined) {
      throw new BadRequestException('offerData is required');
    }

    // Apply markup rules to determine the final price
    const offerData = input.offerData as Record<string, unknown> | null;
    const segments = Array.isArray((offerData as any)?.segments)
      ? ((offerData as any).segments as Array<{ from: string; to: string; marketingCarrier: string }>)
      : [];
    const firstSeg = segments[0];
    const lastSeg = segments[segments.length - 1];

    let finalAmount = input.amount;
    let pricingMeta: Record<string, unknown> = {};

    try {
      const pricingResult = await this.pricing.calculatePrice({
        agencyId: user.agencyId,
        baseAmount: input.amount,
        currency: input.currency,
        airline: firstSeg?.marketingCarrier ?? '',
        origin: firstSeg?.from ?? '',
        destination: lastSeg?.to ?? '',
        cabinClass: 'economy'
      });
      finalAmount = pricingResult.totalAmount;
      pricingMeta = {
        baseAmount: pricingResult.baseAmount,
        markupPct: pricingResult.markupPct,
        markupAmount: pricingResult.markupAmount,
        commissionPct: pricingResult.commissionPct,
        commissionAmount: pricingResult.commissionAmount,
        appliedMarkupRuleId: pricingResult.appliedMarkupRuleId,
        appliedCommissionRuleId: pricingResult.appliedCommissionRuleId
      };
    } catch (error) {
      this.logger.warn(`Pricing calculation failed for booking creation, using base amount: ${error instanceof Error ? error.message : String(error)}`);
    }

    const created = await this.prisma.booking.create({
      data: {
        status: 'draft',
        offerId: input.offerId,
        offerData: input.offerData as Prisma.InputJsonValue,
        currency: input.currency,
        amount: finalAmount,
        passengers: input.passengers as Prisma.InputJsonValue,
        metadata: pricingMeta as Prisma.InputJsonValue,
        agencyId: user.agencyId,
        createdByUserId: user.sub
      }
    });

    return toBooking(created);
  }

  async listForUser(
    user: CurrentUserData,
    input: {
      agencyId?: string;
      status?: 'draft' | 'confirmed' | 'cancelled';
      limit?: number;
      offset?: number;
    }
  ): Promise<Booking[]> {
    if (user.role === 'agent') {
      if (!user.agencyId) {
        throw new BadRequestException('User has no agency');
      }

      const where: Prisma.BookingWhereInput = {
        agencyId: user.agencyId,
        ...(input.status ? { status: input.status } : {})
      };

      const rows = await this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...(input.offset !== undefined ? { skip: input.offset } : {}),
        ...(input.limit !== undefined ? { take: input.limit } : {})
      });

      return rows.map(toBooking);
    }

    const where: Prisma.BookingWhereInput = {
      ...(input.agencyId ? { agencyId: input.agencyId } : {}),
      ...(input.status ? { status: input.status } : {})
    };

    const rows = await this.prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(input.offset !== undefined ? { skip: input.offset } : {}),
      ...(input.limit !== undefined ? { take: input.limit } : {})
    });

    return rows.map(toBooking);
  }

  async confirmForAgent(user: CurrentUserData, id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (user.role === 'agent' && (!user.agencyId || booking.agencyId !== user.agencyId)) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.status !== 'draft') {
      throw new BadRequestException('Only draft bookings can be confirmed');
    }

    // Create Duffel order to get real booking references
    let duffelOrderId: string | null = null;
    let duffelPnr: string | null = null;
    let duffelTicketNumbers: string[] = [];

    try {
      const passengers = Array.isArray(booking.passengers)
        ? (booking.passengers as unknown as Passenger[]).map((p: Passenger, i: number) => ({
            type: 'adult' as const,
            title: p.gender === 'F' ? 'ms' : 'mr',
            givenName: p.firstName,
            familyName: p.lastName,
            email: p.email,
            phone: p.phone,
            bornOn: p.dateOfBirth,
            gender: p.gender === 'M' ? 'male' : p.gender === 'F' ? 'female' : undefined
          }))
        : [];

      const orderResult = await this.duffel.createOrder({
        offerId: booking.offerId,
        passengers,
        idempotencyKey: `booking-${id}`
      });

      duffelOrderId = orderResult.orderId;
      duffelPnr = orderResult.pnr;
      duffelTicketNumbers = orderResult.ticketNumbers;
    } catch (error) {
      this.logger.error(`Duffel order creation failed for booking ${id}: ${error instanceof Error ? error.message : String(error)}`);
      // Continue confirmation even if Duffel fails — references can be backfilled
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: 'confirmed',
        ...(duffelOrderId ? { duffelOrderId } : {}),
        ...(duffelPnr ? { duffelPnr } : {}),
        ...(duffelTicketNumbers.length > 0 ? { duffelTicketNumbers } : {})
      }
    });
    return toBooking(updated);
  }

  async cancelForAgent(user: CurrentUserData, id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (user.role === 'agent' && (!user.agencyId || booking.agencyId !== user.agencyId)) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.status === 'cancelled') {
      throw new BadRequestException('Booking is already cancelled');
    }

    let penaltyAmount = 0;
    if (booking.status === 'confirmed') {
      // Logic for cancellation penalty (e.g., 10% of the amount)
      penaltyAmount = parseFloat(booking.amount) * 0.1;
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        metadata: {
          ...(booking.metadata as any || {}),
          cancellationPenalty: penaltyAmount.toFixed(2),
          cancelledAt: new Date().toISOString(),
          cancelledBy: user.sub
        }
      }
    });
    return toBooking(updated);
  }

  async refundForAdmin(user: CurrentUserData, id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed bookings can be refunded');
    }

    // Logic for refund processing (e.g., full refund minus 5% service fee)
    const refundAmount = parseFloat(booking.amount) * 0.95;

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        metadata: {
          ...(booking.metadata as any || {}),
          refundAmount: refundAmount.toFixed(2),
          refundedAt: new Date().toISOString(),
          refundedBy: user.sub
        }
      }
    });
    return toBooking(updated);
  }

  async getByIdForUser(user: CurrentUserData, id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (user.role === 'agent') {
      if (!user.agencyId || booking.agencyId !== user.agencyId) {
        throw new NotFoundException('Booking not found');
      }
    }

    return toBooking(booking);
  }

  async exportCsv(
    user: CurrentUserData,
    input: {
      agencyId?: string;
      status?: string;
      search?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<string> {
    const where: Prisma.BookingWhereInput = {};

    if (user.role === 'agent') {
      if (!user.agencyId) {
        throw new BadRequestException('User has no agency');
      }
      where.agencyId = user.agencyId;
    } else if (input.agencyId) {
      where.agencyId = input.agencyId;
    }

    if (input.status) {
      where.status = input.status as Prisma.BookingWhereInput['status'];
    }

    if (input.search) {
      where.offerId = { contains: input.search, mode: 'insensitive' };
    }

    const createdAtFilter: Prisma.DateTimeFilter = {
      ...(input.fromDate ? { gte: new Date(input.fromDate) } : {}),
      ...(input.toDate ? { lte: new Date(input.toDate) } : {})
    };
    if (Object.keys(createdAtFilter).length > 0) {
      where.createdAt = createdAtFilter;
    }

    const rows = await this.prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        agency: { select: { name: true } },
        createdByUser: { select: { email: true, name: true } }
      }
    });

    const header = 'ID,Status,Offer ID,Currency,Amount,Agency,Agent Email,Created At,Updated At';
    const lines = rows.map((r) => {
      const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
      return [
        esc(r.id),
        r.status,
        esc(r.offerId),
        r.currency,
        r.amount,
        esc(r.agency?.name ?? ''),
        esc(r.createdByUser?.email ?? ''),
        r.createdAt.toISOString(),
        r.updatedAt.toISOString()
      ].join(',');
    });

    return [header, ...lines].join('\n');
  }

  async exportPdf(
    user: CurrentUserData,
    input: {
      agencyId?: string;
      status?: string;
      search?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<Buffer> {
    const where: Prisma.BookingWhereInput = {};

    if (user.role === 'agent') {
      if (!user.agencyId) {
        throw new BadRequestException('User has no agency');
      }
      where.agencyId = user.agencyId;
    } else if (input.agencyId) {
      where.agencyId = input.agencyId;
    }

    if (input.status) {
      where.status = input.status as Prisma.BookingWhereInput['status'];
    }

    if (input.search) {
      where.offerId = { contains: input.search, mode: 'insensitive' };
    }

    const createdAtFilter: Prisma.DateTimeFilter = {
      ...(input.fromDate ? { gte: new Date(input.fromDate) } : {}),
      ...(input.toDate ? { lte: new Date(input.toDate) } : {})
    };
    if (Object.keys(createdAtFilter).length > 0) {
      where.createdAt = createdAtFilter;
    }

    const rows = await this.prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        agency: { select: { name: true } },
        createdByUser: { select: { email: true, name: true } }
      }
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Title
    doc.fontSize(20).text('Bookings Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('gray').text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown(1);

    // Filters applied
    const filters: string[] = [];
    if (input.status) filters.push(`Status: ${input.status}`);
    if (input.fromDate) filters.push(`From: ${new Date(input.fromDate).toLocaleDateString()}`);
    if (input.toDate) filters.push(`To: ${new Date(input.toDate).toLocaleDateString()}`);
    if (filters.length > 0) {
      doc.fontSize(9).fillColor('gray').text(`Filters: ${filters.join(' | ')}`);
      doc.moveDown(0.5);
    }

    doc.fillColor('black');

    // Table header
    const colX = [40, 120, 200, 280, 340, 400];
    const headers = ['ID', 'Status', 'Offer ID', 'Currency', 'Amount', 'Agency'];
    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 80, continued: i < headers.length - 1 }));
    doc.text('');
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.3);

    // Table rows
    doc.font('Helvetica').fontSize(8);
    for (const r of rows) {
      const y = doc.y;
      if (y > 750) {
        doc.addPage();
        doc.fontSize(9).font('Helvetica-Bold');
        headers.forEach((h, i) => doc.text(h, colX[i], doc.y, { width: 80, continued: i < headers.length - 1 }));
        doc.text('');
        doc.moveDown(0.3);
        doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(8);
      }

      const id = r.id.length > 8 ? r.id.slice(0, 8) + '...' : r.id;
      const offerId = r.offerId.length > 12 ? r.offerId.slice(0, 12) + '...' : r.offerId;
      const agency = r.agency?.name ?? '';

      doc.text(id, colX[0], doc.y, { width: 80 });
      doc.text(r.status, colX[1], doc.y, { width: 80 });
      doc.text(offerId, colX[2], doc.y, { width: 80 });
      doc.text(r.currency, colX[3], doc.y, { width: 60 });
      doc.text(r.amount, colX[4], doc.y, { width: 60 });
      doc.text(agency, colX[5], doc.y, { width: 160 });
      doc.moveDown(0.2);
    }

    // Footer
    doc.moveDown(1);
    doc.fontSize(8).fillColor('gray').text(`Total bookings: ${rows.length}`, { align: 'center' });

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks as unknown as Uint8Array[])));
    });
  }

  async generateTicket(user: CurrentUserData, id: string): Promise<Buffer> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (user.role === 'agent' && (!user.agencyId || booking.agencyId !== user.agencyId)) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed bookings have tickets');
    }

    const offerData = booking.offerData as Record<string, unknown> | null;
    const segments = Array.isArray((offerData as any)?.segments)
      ? ((offerData as any).segments as Array<{ from: string; to: string; departureTime: string; arrivalTime: string; marketingCarrier: string; flightNumber: string; duration?: string; aircraft?: string }>)
      : [];
    const passengers = Array.isArray(booking.passengers)
      ? (booking.passengers as unknown as Passenger[])
      : [];

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('E-TICKET / ITINERARY', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('gray').text(`Issued: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.8);

    // Booking references
    doc.fillColor('black').fontSize(12).font('Helvetica-Bold').text('Booking References');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Booking ID: ${booking.id}`);
    if (booking.duffelOrderId) {
      doc.text(`Order ID: ${booking.duffelOrderId}`);
    }
    if (booking.duffelPnr) {
      doc.text(`PNR: ${booking.duffelPnr}`);
    }
    if (booking.duffelTicketNumbers.length > 0) {
      doc.text(`Ticket Number(s): ${booking.duffelTicketNumbers.join(', ')}`);
    }
    doc.text(`Offer ID: ${booking.offerId}`);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.8);

    // Flight segments
    if (segments.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Flight Itinerary');
      doc.moveDown(0.3);

      for (const seg of segments) {
        doc.fontSize(10).font('Helvetica-Bold').text(`${seg.marketingCarrier} ${seg.flightNumber}`);
        doc.font('Helvetica').fontSize(9);
        doc.text(`  ${seg.from} → ${seg.to}`);
        doc.text(`  Departure: ${seg.departureTime}`);
        doc.text(`  Arrival: ${seg.arrivalTime}`);
        if (seg.duration) doc.text(`  Duration: ${seg.duration}`);
        if (seg.aircraft) doc.text(`  Aircraft: ${seg.aircraft}`);
        doc.moveDown(0.4);
      }
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.8);
    }

    // Passengers
    if (passengers.length > 0) {
      doc.fillColor('black').fontSize(12).font('Helvetica-Bold').text('Passengers');
      doc.moveDown(0.3);
      for (const p of passengers) {
        doc.fontSize(10).font('Helvetica').text(`${p.firstName} ${p.lastName}`);
      }
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.8);
    }

    // Price
    doc.fillColor('black').fontSize(12).font('Helvetica-Bold').text('Total Price');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').text(`${booking.currency} ${booking.amount}`);

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks as unknown as Uint8Array[])));
    });
  }

  async generateInvoice(user: CurrentUserData, id: string): Promise<Buffer> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { agency: { select: { name: true } } }
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (user.role === 'agent' && (!user.agencyId || booking.agencyId !== user.agencyId)) {
      throw new NotFoundException('Booking not found');
    }

    const passengers = Array.isArray(booking.passengers)
      ? (booking.passengers as unknown as Passenger[])
      : [];
    const meta = booking.metadata as Record<string, unknown> | null;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor('gray').text(`Invoice Date: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.8);

    // Invoice details
    doc.fillColor('black').fontSize(10).font('Helvetica');
    doc.text(`Invoice No: INV-${booking.id.slice(0, 8)}`);
    doc.text(`Booking ID: ${booking.id}`);
    doc.text(`Agency: ${booking.agency?.name ?? 'N/A'}`);
    if (booking.duffelPnr) {
      doc.text(`PNR: ${booking.duffelPnr}`);
    }
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.8);

    // Passengers
    if (passengers.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Passengers');
      doc.moveDown(0.3);
      for (const p of passengers) {
        doc.fontSize(10).font('Helvetica').text(`${p.firstName} ${p.lastName}`);
      }
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.8);
    }

    // Pricing breakdown
    doc.fillColor('black').fontSize(12).font('Helvetica-Bold').text('Pricing Breakdown');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');

    const baseAmount = typeof meta?.baseAmount === 'string' ? meta.baseAmount : booking.amount;
    const markupPct = typeof meta?.markupPct === 'number' ? meta.markupPct : 0;
    const markupAmount = typeof meta?.markupAmount === 'string' ? meta.markupAmount : '0.00';
    const commissionPct = typeof meta?.commissionPct === 'number' ? meta.commissionPct : 0;
    const commissionAmount = typeof meta?.commissionAmount === 'string' ? meta.commissionAmount : '0.00';

    doc.text(`Base Fare: ${booking.currency} ${baseAmount}`);
    if (markupPct > 0) {
      doc.text(`Markup (${markupPct}%): ${booking.currency} ${markupAmount}`);
    }
    doc.text(`Total Charged: ${booking.currency} ${booking.amount}`);
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('gray').text(`Commission (${commissionPct}%): ${booking.currency} ${commissionAmount} (internal)`);
    doc.fillColor('black');
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.8);

    // Footer
    doc.fontSize(8).fillColor('gray').text('This is a computer-generated invoice.', { align: 'center' });

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks as unknown as Uint8Array[])));
    });
  }
}
