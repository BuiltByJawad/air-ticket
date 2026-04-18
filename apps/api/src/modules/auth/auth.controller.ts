import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser, type CurrentUserData } from './current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { Public } from './public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokenResponseDto } from './dto/auth-token.response';
import { ProfileResponseDto } from './dto/profile.response';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Register a new agency and agent user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered', type: AuthTokenResponseDto })
  async register(@Req() req: Request, @Body() body: RegisterDto) {
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

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful', type: AuthTokenResponseDto })
  async login(@Req() req: Request, @Body() body: LoginDto) {
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

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile retrieved', type: ProfileResponseDto })
  async me(@CurrentUser() user: CurrentUserData) {
    return this.authService.getProfile(user);
  }
}
