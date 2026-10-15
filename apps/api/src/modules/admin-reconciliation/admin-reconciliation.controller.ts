import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type CurrentUserData } from '../auth/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { AdminReconciliationService } from './admin-reconciliation.service';

@ApiTags('Admin - Reconciliation')
@ApiBearerAuth()
@Controller('admin/reconciliation')
@Roles('admin')
export class AdminReconciliationController {
  constructor(
    private readonly reconciliationService: AdminReconciliationService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get reconciliation summary' })
  async summary(
    @Query('agencyId') agencyId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ) {
    return this.reconciliationService.summary({ agencyId, fromDate, toDate });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export reconciliation as CSV' })
  async exportCsv(
    @Req() req: Request,
    @CurrentUser() user: CurrentUserData,
    @Query('agencyId') agencyId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ) {
    const csv = await this.reconciliationService.exportCsv({ agencyId, fromDate, toDate });
    await this.auditService.log({
      action: 'reconciliation.export_csv',
      resource: 'reconciliation',
      agencyId: user.agencyId,
      userId: user.sub,
      requestId: req.requestId,
      metadata: { agencyId, fromDate, toDate }
    });
    req.res?.setHeader('Content-Type', 'text/csv');
    req.res?.setHeader('Content-Disposition', `attachment; filename=reconciliation-${new Date().toISOString().slice(0, 10)}.csv`);
    return csv;
  }
}

