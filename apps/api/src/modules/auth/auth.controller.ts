import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, type CurrentUserData } from './current-user.decorator';
import { AuditService } from '../audit/audit.service';

interface RegisterBody {
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService
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
    return { user };
  }
}
