import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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

  async create(input: { email: string; passwordHash: string; role: UserRole; name?: string | null; phone?: string | null; agencyId?: string | null }): Promise<User> {
    const email = input.email.toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email }
    });
    if (existing) {
      throw new Error('User already exists');
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
}
