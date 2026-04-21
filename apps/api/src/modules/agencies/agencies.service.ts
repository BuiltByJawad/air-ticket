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
