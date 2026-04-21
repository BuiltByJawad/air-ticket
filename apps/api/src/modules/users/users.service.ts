import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AgenciesService } from '../agencies/agencies.service';
import type { PaginatedResult } from '../app/pagination.types';

export type UserRole = 'agent' | 'admin';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
  agencyId: string | null;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  agencyId: string | null;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agenciesService: AgenciesService
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      agencyId: user.agencyId
    };
  }

  async listAll(): Promise<UserPublic[]> {
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true, agencyId: true }
    });
    return rows;
  }

  async listAllPaged(input: { limit: number; offset: number; role?: string; search?: string }): Promise<PaginatedResult<UserPublic>> {
    const where: Record<string, unknown> = {};
    if (input.role) {
      where.role = input.role;
    }
    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } }
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true, agencyId: true },
        skip: input.offset,
        take: input.limit
      })
    ]);

    return {
      items: rows,
      meta: { total, limit: input.limit, offset: input.offset }
    };
  }

  async create(input: { email: string; passwordHash: string; role: UserRole; name?: string | null; phone?: string | null; agencyId?: string | null }): Promise<User> {
    const email = input.email.toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email }
    });
    if (existing) {
      throw new ConflictException('User already exists');
    }

    const created = await this.prisma.user.create({
      data: {
        email,
        passwordHash: input.passwordHash,
        name: input.name ?? null,
        phone: input.phone ?? null,
        role: input.role,
        agencyId: input.agencyId ?? null
      }
    });

    return {
      id: created.id,
      email: created.email,
      passwordHash: created.passwordHash,
      name: created.name,
      phone: created.phone,
      role: created.role,
      createdAt: created.createdAt,
      agencyId: created.agencyId
    };
  }

  async createAgent(input: { agencyId: string; email: string; password: string }): Promise<UserPublic> {
    const agency = await this.agenciesService.findById(input.agencyId);
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.create({
      email: input.email,
      passwordHash,
      role: 'agent',
      agencyId: input.agencyId
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      agencyId: user.agencyId,
      createdAt: user.createdAt
    };
  }

  async update(id: string, input: { name?: string; phone?: string; agencyId?: string | null }): Promise<UserPublic> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { ...input },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true, agencyId: true }
    });

    return updated;
  }

  async delete(id: string): Promise<UserPublic> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true, agencyId: true }
    });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id } });
    return existing;
  }
}
