import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserData } from '../auth/current-user.decorator';
import type { PaginatedResult } from '../app/pagination.types';
import type { Booking, JsonValue } from './bookings.types';
import PDFDocument from 'pdfkit';

function toBooking(dto: {
  id: string;
  status: 'draft' | 'confirmed' | 'cancelled';
  offerId: string;
  offerData: Prisma.JsonValue;
  currency: string;
  amount: string;
  agencyId: string;
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
    agencyId: dto.agencyId,
    createdByUserId: dto.createdByUserId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt
  };
}

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPagedForUser(
    user: CurrentUserData,
    input: {
      agencyId?: string;
      status?: 'draft' | 'confirmed' | 'cancelled';
      limit: number;
      offset: number;
    }
  ): Promise<PaginatedResult<Booking>> {
    const limit = input.limit;
    const offset = input.offset;

    if (user.role === 'agent') {
      if (!user.agencyId) {
        throw new BadRequestException('User has no agency');
      }

      const where: Prisma.BookingWhereInput = {
        agencyId: user.agencyId,
        ...(input.status ? { status: input.status } : {})
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
      ...(input.status ? { status: input.status } : {})
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

  async createForAgent(
    user: CurrentUserData,
    input: { offerId: string; offerData?: unknown; currency: string; amount: string }
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

    const created = await this.prisma.booking.create({
      data: {
        status: 'draft',
        offerId: input.offerId,
        offerData: input.offerData as Prisma.InputJsonValue,
        currency: input.currency,
        amount: input.amount,
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
    const updated = await this.prisma.booking.update({ where: { id }, data: { status: 'confirmed' } });
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
    const updated = await this.prisma.booking.update({ where: { id }, data: { status: 'cancelled' } });
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

    if (input.fromDate || input.toDate) {
      where.createdAt = {
        ...(input.fromDate ? { gte: new Date(input.fromDate) } : {}),
        ...(input.toDate ? { lte: new Date(input.toDate) } : {})
      };
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

    if (input.fromDate || input.toDate) {
      where.createdAt = {
        ...(input.fromDate ? { gte: new Date(input.fromDate) } : {}),
        ...(input.toDate ? { lte: new Date(input.toDate) } : {})
      };
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
}
