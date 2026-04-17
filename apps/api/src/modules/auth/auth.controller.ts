import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, type CurrentUserData } from './current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { AgenciesService } from '../agencies/agencies.service';

interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  agencyName: string;
}

interface LoginBody {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
    private readonly agenciesService: AgenciesService
  ) {}

  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async register(@Req() req: Request, @Body() body: RegisterBody) {
    const result = await this.authService.register(body);
    await this.auditService.log({
      action: 'auth.register',
      resource: 'user',
      resourceId: result.user.id,
      requestId: req.requestId,
      metadata: { email: body.email }
    });
    return result;
  }

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async login(@Req() req: Request, @Body() body: LoginBody) {
    const result = await this.authService.login(body);
    await this.auditService.log({
      action: 'auth.login',
      resource: 'user',
      resourceId: result.user.id,
      userId: result.user.id,
      agencyId: result.user.agencyId,
      requestId: req.requestId,
      metadata: { email: body.email }
    });
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: CurrentUserData) {
    const dbUser = await this.usersService.findByEmail(user.email);
    let agency: { id: string; name: string } | null = null;
    if (dbUser?.agencyId) {
      const a = await this.agenciesService.findById(dbUser.agencyId);
      if (a) agency = { id: a.id, name: a.name };
    }
    return {
      user: {
        sub: user.sub,
        email: user.email,
        role: user.role,
        agencyId: user.agencyId,
        name: dbUser?.name ?? null,
        phone: dbUser?.phone ?? null,
        agency
      }
    };
  }
}
