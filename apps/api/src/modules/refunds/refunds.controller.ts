import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type CurrentUserData } from '../auth/current-user.decorator';
import { RefundsService } from './refunds.service';
import { AuditService } from '../audit/audit.service';
import type { Request } from 'express';

@ApiTags('Refunds')
@ApiBearerAuth()
@Controller('refunds')
export class RefundsController {
  constructor(
    private readonly refundsService: RefundsService,
    private readonly auditService: AuditService
  ) {}

  @Post()
  @Roles('agent')
  @ApiOperation({ summary: 'Create a refund request' })
  async create(
    @Req() req: Request,
    @CurrentUser() user: CurrentUserData,
    @Body() body: { bookingId: string; reason: string; refundAmount: string; currency: string }
  ) {
    const result = await this.refundsService.createRequest(user, body);

    await this.auditService.log({
      action: 'refund.request_created',
      resource: 'refund',
      resourceId: result.id,
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId
    });

    return result;
  }

  @Get()
  @Roles('agent', 'admin')
  @ApiOperation({ summary: 'List refund requests' })
  async list(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: string,
    @Query('agencyId') agencyId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.refundsService.listRequests(user, {
      status,
      agencyId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined
    });
  }

  @Patch(':id/approve')
  @Roles('admin')
  @ApiOperation({ summary: 'Approve a refund request' })
  @ApiParam({ name: 'id' })
  async approve(
    @Req() req: Request,
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body?: { note?: string }
  ) {
    const result = await this.refundsService.approveRequest(user, id, body?.note);

    await this.auditService.log({
      action: 'refund.approved',
      resource: 'refund',
      resourceId: id,
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId
    });

    return result;
  }

  @Patch(':id/reject')
  @Roles('admin')
  @ApiOperation({ summary: 'Reject a refund request' })
  @ApiParam({ name: 'id' })
  async reject(
    @Req() req: Request,
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body?: { note?: string }
  ) {
    const result = await this.refundsService.rejectRequest(user, id, body?.note);

    await this.auditService.log({
      action: 'refund.rejected',
      resource: 'refund',
      resourceId: id,
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId
    });

    return result;
  }

  @Patch(':id/process')
  @Roles('admin')
  @ApiOperation({ summary: 'Mark a refund as processed' })
  @ApiParam({ name: 'id' })
  async process(
    @Req() req: Request,
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string
  ) {
    const result = await this.refundsService.markProcessed(user, id);

    await this.auditService.log({
      action: 'refund.processed',
      resource: 'refund',
      resourceId: id,
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId
    });

    return result;
  }
}
