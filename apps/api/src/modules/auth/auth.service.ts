import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UsersService, type UserRole } from '../users/users.service';
import { AgenciesService } from '../agencies/agencies.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CurrentUserData } from './current-user.decorator';

export interface AuthTokenResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    agencyId: string | null;
  };
}

export interface ProfileResponse {
  user: {
    sub: string;
    email: string;
    role: 'agent' | 'admin';
    agencyId: string | null;
    name: string | null;
    phone: string | null;
    agency: { id: string; name: string } | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly agenciesService: AgenciesService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async register(input: { email: string; password: string; name?: string; phone?: string; agencyName: string }): Promise<AuthTokenResponse> {
    const agency = await this.agenciesService.create({ name: input.agencyName });

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.usersService.create({
      email: input.email,
      passwordHash,
      role: 'agent',
      name: input.name,
      phone: input.phone,
      agencyId: agency.id
    });

    return this.issueToken({ userId: user.id, email: user.email, role: user.role, agencyId: user.agencyId });
  }

  async login(input: { email: string; password: string }): Promise<AuthTokenResponse> {
    const user = await this.usersService.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueToken({ userId: user.id, email: user.email, role: user.role, agencyId: user.agencyId });
  }

  async updateProfile(jwtUser: CurrentUserData, input: { name?: string; phone?: string; currentPassword?: string; password?: string }): Promise<ProfileResponse> {
    const data: { name?: string; phone?: string; passwordHash?: string } = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.password) {
      if (!input.currentPassword) {
        throw new UnauthorizedException('Current password is required to set a new password');
      }
      const user = await this.prisma.user.findUnique({ where: { id: jwtUser.sub } });
      if (!user) throw new UnauthorizedException('User not found');
      const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!ok) throw new UnauthorizedException('Current password is incorrect');
      data.passwordHash = await bcrypt.hash(input.password, 12);
    }

    if (Object.keys(data).length > 0) {
      await this.prisma.user.update({ where: { id: jwtUser.sub }, data });
    }

    return this.getProfile(jwtUser);
  }

  async getProfile(jwtUser: CurrentUserData): Promise<ProfileResponse> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: jwtUser.sub },
      include: { agency: { select: { id: true, name: true } } }
    });

    return {
      user: {
        sub: jwtUser.sub,
        email: jwtUser.email,
        role: jwtUser.role,
        agencyId: jwtUser.agencyId,
        name: dbUser?.name ?? null,
        phone: dbUser?.phone ?? null,
        agency: dbUser?.agency ?? null
      }
    };
  }

  private async issueToken(input: { userId: string; email: string; role: UserRole; agencyId: string | null }): Promise<AuthTokenResponse> {
    const accessToken = await this.jwtService.signAsync({
      sub: input.userId,
      email: input.email,
      role: input.role,
      agencyId: input.agencyId
    });

    return {
      accessToken,
      user: {
        id: input.userId,
        email: input.email,
        role: input.role,
        agencyId: input.agencyId
      }
    };
  }
}
