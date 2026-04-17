import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
