import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { CurrentUser, type CurrentUserData } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BookingsService } from './bookings.service';
import { AuditService } from '../audit/audit.service';

const CreateBookingBodySchema = z.object({
  offerId: z.string().min(1),
  offerData: z.unknown(),
  currency: z.string().min(3).max(3),
  amount: z.string().min(1)
});

const ListBookingsQuerySchema = z.object({
  agencyId: z.string().min(1).optional()
});

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly auditService: AuditService
  ) {}

  @Post()
  @Roles('agent')
  async create(@Req() req: Request, @CurrentUser() user: CurrentUserData, @Body() body: unknown) {
    const parsed = CreateBookingBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Invalid booking input');
    }

    const booking = await this.bookingsService.createForAgent(user, parsed.data);
    await this.auditService.log({
      action: 'booking.create',
      resource: 'booking',
      resourceId: booking.id,
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId,
      metadata: { offerId: parsed.data.offerId, amount: parsed.data.amount, currency: parsed.data.currency }
    });
    return booking;
  }

  @Get()
  @Roles('agent', 'admin')
  async list(@CurrentUser() user: CurrentUserData, @Query() query: unknown) {
    const parsed = ListBookingsQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException('Invalid query');
    }

    return this.bookingsService.listForUser(user, parsed.data);
  }

  @Get(':id')
  @Roles('agent', 'admin')
  async getById(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.bookingsService.getByIdForUser(user, id);
  }
}
