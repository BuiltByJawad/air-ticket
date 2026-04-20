import { Injectable } from '@nestjs/common';
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

  async listAllPaged(input: { limit: number; offset: number }): Promise<PaginatedResult<Agency>> {
    const [total, rows] = await Promise.all([
      this.prisma.agency.count(),
      this.prisma.agency.findMany({
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
}
