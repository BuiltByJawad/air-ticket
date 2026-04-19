import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserData } from '../auth/current-user.decorator';
import type { Booking, JsonValue } from './bookings.types';

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
}
