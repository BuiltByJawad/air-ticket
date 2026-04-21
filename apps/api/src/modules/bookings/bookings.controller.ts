import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser, type CurrentUserData } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { BookingsService } from './bookings.service';
import { AuditService } from '../audit/audit.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';
import { ExportBookingsQueryDto } from './dto/export-bookings-query.dto';
import { BookingResponseDto } from './dto/booking.response';
import { PaginatedBookingsResponseDto } from './dto/paginated-bookings.response';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly auditService: AuditService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('agent')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Booking created', type: BookingResponseDto })
  async create(@Req() req: Request, @CurrentUser() user: CurrentUserData, @Body() body: CreateBookingDto) {
    const booking = await this.bookingsService.createForAgent(user, body);
    await this.auditService.log({
      action: 'booking.create',
      resource: 'booking',
      resourceId: booking.id,
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId,
      metadata: { offerId: body.offerId, amount: body.amount, currency: body.currency }
    });
    return booking;
  }

  @Get()
  @Roles('agent', 'admin')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @ApiOperation({ summary: 'List bookings' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bookings listed', type: [BookingResponseDto] })
  async list(@CurrentUser() user: CurrentUserData, @Query() query: ListBookingsQueryDto) {
    return this.bookingsService.listForUser(user, query);
  }

  @Get('paged')
  @Roles('agent', 'admin')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @ApiOperation({ summary: 'List bookings (paged)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Bookings listed', type: PaginatedBookingsResponseDto })
  async listPaged(@CurrentUser() user: CurrentUserData, @Query() query: ListBookingsQueryDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    return this.bookingsService.listPagedForUser(user, {
      agencyId: query.agencyId,
      status: query.status,
      limit,
      offset
    });
  }

  @Get('export/csv')
  @Roles('agent', 'admin')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({ summary: 'Export bookings as CSV with date range filtering' })
  async exportCsv(@CurrentUser() user: CurrentUserData, @Query() query: ExportBookingsQueryDto, @Req() req: Request) {
    const csv = await this.bookingsService.exportCsv(user, {
      agencyId: query.agencyId,
      status: query.status,
      fromDate: query.fromDate,
      toDate: query.toDate
    });

    await this.auditService.log({
      action: 'booking.export_csv',
      resource: 'booking',
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId,
      metadata: { status: query.status, fromDate: query.fromDate, toDate: query.toDate }
    });

    req.res?.setHeader('Content-Type', 'text/csv');
    req.res?.setHeader('Content-Disposition', `attachment; filename=bookings-${new Date().toISOString().slice(0, 10)}.csv`);
    return csv;
  }

  @Get(':id')
  @Roles('agent', 'admin')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Booking retrieved', type: BookingResponseDto })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async getById(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.bookingsService.getByIdForUser(user, id);
  }

  @Patch(':id/confirm')
  @Roles('agent', 'admin')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Confirm a draft booking' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Booking confirmed', type: BookingResponseDto })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async confirm(@Req() req: Request, @CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    const booking = await this.bookingsService.confirmForAgent(user, id);
    await this.auditService.log({
      action: 'booking.confirm',
      resource: 'booking',
      resourceId: booking.id,
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId,
      metadata: { offerId: booking.offerId }
    });
    return booking;
  }

  @Patch(':id/cancel')
  @Roles('agent', 'admin')
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Booking cancelled', type: BookingResponseDto })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async cancel(@Req() req: Request, @CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    const booking = await this.bookingsService.cancelForAgent(user, id);
    await this.auditService.log({
      action: 'booking.cancel',
      resource: 'booking',
      resourceId: booking.id,
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId,
      metadata: { offerId: booking.offerId }
    });
    return booking;
  }
}
