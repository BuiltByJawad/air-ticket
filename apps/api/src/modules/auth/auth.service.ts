import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
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

  async forgotPassword(email: string): Promise<{ token: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists
      return { token: '' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 12);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordReset.create({
      data: { email, tokenHash, expiresAt }
    });

    // In production, send email with reset link containing the token.
    // For now, return the token directly for testing/development.
    return { token };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resets = await this.prisma.passwordReset.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });

    let matchedReset = null;
    for (const reset of resets) {
      const ok = await bcrypt.compare(token, reset.tokenHash);
      if (ok) {
        matchedReset = reset;
        break;
      }
    }

    if (!matchedReset) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.usersService.findByEmail(matchedReset.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    await this.prisma.passwordReset.update({
      where: { id: matchedReset.id },
      data: { usedAt: new Date() }
    });

    // Invalidate all other pending resets for this email
    await this.prisma.passwordReset.updateMany({
      where: { email: matchedReset.email, usedAt: null },
      data: { usedAt: new Date() }
    });
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
