import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PaginatedResult } from '../app/pagination.types';

export interface Agency {
  id: string;
  name: string;
  createdAt: Date;
}

@Injectable()
export class AgenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { name: string }): Promise<Agency> {
    const created = await this.prisma.agency.create({
      data: {
        name: input.name
      }
    });

    return {
      id: created.id,
      name: created.name,
      createdAt: created.createdAt
    };
  }

  async findById(id: string): Promise<Agency | null> {
    const agency = await this.prisma.agency.findUnique({
      where: { id }
    });

    if (!agency) {
      return null;
    }

    return {
      id: agency.id,
      name: agency.name,
      createdAt: agency.createdAt
    };
  }

  async getDetail(id: string): Promise<{
    id: string;
    name: string;
    createdAt: Date;
    agents: { id: string; email: string; name: string | null; createdAt: Date }[];
    bookingsCount: number;
    confirmedRevenue: string;
    revenueCurrency: string;
  } | null> {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: {
        users: {
          where: { role: 'agent' },
          select: { id: true, email: true, name: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!agency) return null;

    const [bookingsCount, confirmedBookings] = await Promise.all([
      this.prisma.booking.count({ where: { agencyId: id } }),
      this.prisma.booking.findMany({
        where: { agencyId: id, status: 'confirmed' },
        select: { currency: true, amount: true }
      })
    ]);

    const revenueByCurrency = new Map<string, number>();
    for (const b of confirmedBookings) {
      const amount = parseFloat(b.amount) || 0;
      revenueByCurrency.set(b.currency, (revenueByCurrency.get(b.currency) ?? 0) + amount);
    }

    let primaryCurrency = 'USD';
    let maxRevenue = 0;
    for (const [currency, rev] of revenueByCurrency) {
      if (rev > maxRevenue) {
        maxRevenue = rev;
        primaryCurrency = currency;
      }
    }

    return {
      id: agency.id,
      name: agency.name,
      createdAt: agency.createdAt,
      agents: agency.users,
      bookingsCount,
      confirmedRevenue: (revenueByCurrency.get(primaryCurrency) ?? 0).toFixed(2),
      revenueCurrency: primaryCurrency
    };
  }

  async listAll(): Promise<Agency[]> {
    const rows = await this.prisma.agency.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return rows.map((a) => ({ id: a.id, name: a.name, createdAt: a.createdAt }));
  }

  async listAllPaged(input: { limit: number; offset: number; search?: string }): Promise<PaginatedResult<Agency>> {
    const where = input.search
      ? { name: { contains: input.search, mode: 'insensitive' as const } }
      : {};

    const [total, rows] = await Promise.all([
      this.prisma.agency.count({ where }),
      this.prisma.agency.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: input.offset,
        take: input.limit
      })
    ]);

    return {
      items: rows.map((a) => ({ id: a.id, name: a.name, createdAt: a.createdAt })),
      meta: { total, limit: input.limit, offset: input.offset }
    };
  }

  async update(id: string, input: { name?: string }): Promise<Agency> {
    const existing = await this.prisma.agency.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Agency not found');
    }

    const updated = await this.prisma.agency.update({
      where: { id },
      data: { ...input }
    });

    return { id: updated.id, name: updated.name, createdAt: updated.createdAt };
  }

  async delete(id: string): Promise<Agency> {
    const existing = await this.prisma.agency.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Agency not found');
    }

    const deleted = await this.prisma.agency.delete({ where: { id } });
    return { id: deleted.id, name: deleted.name, createdAt: deleted.createdAt };
  }
}
