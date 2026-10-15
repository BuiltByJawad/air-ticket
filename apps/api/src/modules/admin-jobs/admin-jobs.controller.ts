import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { AdminJobsService } from './admin-jobs.service';
import { AuditService } from '../audit/audit.service';
import { CurrentUser, type CurrentUserData } from '../auth/current-user.decorator';
import type { Request } from 'express';

@ApiTags('Admin - Jobs')
@ApiBearerAuth()
@Controller('admin/jobs')
@Roles('admin')
export class AdminJobsController {
  constructor(
    private readonly adminJobsService: AdminJobsService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List async jobs' })
  async list(
    @Query('status') status?: 'pending' | 'processing' | 'completed' | 'failed',
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.adminJobsService.list({
      status,
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get async job by ID' })
  async getById(@Param('id') id: string) {
    return this.adminJobsService.getById(id);
  }

  @Patch(':id/retry')
  @ApiOperation({ summary: 'Retry failed/blocked async job' })
  async retry(@Req() req: Request, @CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    const result = await this.adminJobsService.retry(id);
    await this.auditService.log({
      action: 'job.retry',
      resource: 'async_job',
      resourceId: id,
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId,
      metadata: { status: result.status, type: result.type }
    });
    return result;
  }

  @Patch(':id/trigger')
  @ApiOperation({ summary: 'Trigger async job for immediate dispatcher pickup' })
  async trigger(@Req() req: Request, @CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    const result = await this.adminJobsService.triggerNow(id);
    await this.auditService.log({
      action: 'job.trigger',
      resource: 'async_job',
      resourceId: id,
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId,
      metadata: { status: result.status, type: result.type }
    });
    return result;
  }

  @Patch(':id/clone')
  @ApiOperation({ summary: 'Clone failed job into a fresh pending job' })
  async clone(@Req() req: Request, @CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    const result = await this.adminJobsService.cloneAsNew(id);
    await this.auditService.log({
      action: 'job.clone',
      resource: 'async_job',
      resourceId: id,
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId,
      metadata: { newJobId: result.id, type: result.type }
    });
    return result;
  }

  @Post('schedule/reconciliation-check')
  @ApiOperation({ summary: 'Schedule reconciliation check async job' })
  async scheduleReconciliationCheck(
    @Req() req: Request,
    @CurrentUser() user: CurrentUserData,
    @Body() body: { agencyId?: string; runAfter?: string }
  ) {
    const result = await this.adminJobsService.scheduleReconciliationCheck(body);
    await this.auditService.log({
      action: 'job.schedule.reconciliation_check',
      resource: 'async_job',
      resourceId: result.id,
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId,
      metadata: { type: result.type, runAfter: result.runAfter, agencyId: body?.agencyId ?? null }
    });
    return result;
  }
}
