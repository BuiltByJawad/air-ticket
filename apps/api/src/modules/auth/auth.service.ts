import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { z } from 'zod';
import { UsersService, type UserRole } from '../users/users.service';
import { AgenciesService } from '../agencies/agencies.service';

const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  agencyName: z.string().min(1)
});

const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export interface AuthTokenResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    agencyId: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly agenciesService: AgenciesService,
    private readonly jwtService: JwtService
  ) {}

  async register(input: { email: string; password: string; name?: string; phone?: string; agencyName: string }): Promise<AuthTokenResponse> {
    const parsed = RegisterInputSchema.parse(input);

    const agency = await this.agenciesService.create({ name: parsed.agencyName });

    const passwordHash = await bcrypt.hash(parsed.password, 12);
    const user = await this.usersService.create({
      email: parsed.email,
      passwordHash,
      role: 'agent',
      name: parsed.name,
      phone: parsed.phone,
      agencyId: agency.id
    });

    return this.issueToken({ userId: user.id, email: user.email, role: user.role, agencyId: user.agencyId });
  }

  async login(input: { email: string; password: string }): Promise<AuthTokenResponse> {
    const parsed = LoginInputSchema.parse(input);

    const user = await this.usersService.findByEmail(parsed.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueToken({ userId: user.id, email: user.email, role: user.role, agencyId: user.agencyId });
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
