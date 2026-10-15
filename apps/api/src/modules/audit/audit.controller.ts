import { Controller, Get, Param, Query, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsOptional, IsInt, Min, Max, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { Roles } from '../auth/roles.decorator';
import { AuditService } from './audit.service';
import { AuditLogListResponseDto } from './dto/audit-log.response';

class ListAuditLogsQueryDto {
  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  resource?: string;

  @IsString()
  @IsOptional()
  agencyId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  fromDate?: string;

  @IsString()
  @IsOptional()
  toDate?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number = 0;
}

@ApiTags('Admin - Audit Logs')
@ApiBearerAuth()
@Controller('admin/audit-logs')
@Roles('admin')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs listed', type: AuditLogListResponseDto })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async list(@Query() query: ListAuditLogsQueryDto) {
    return this.auditService.listLogs(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit log statistics grouped by action' })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async stats(
    @Query('agencyId') agencyId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ) {
    return this.auditService.getStats({ agencyId, fromDate, toDate });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs as CSV' })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async exportCsv(
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('agencyId') agencyId?: string,
    @Query('userId') userId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Req() req?: any
  ) {
    const csv = await this.auditService.exportCsv({ action, resource, agencyId, userId, fromDate, toDate });
    (req as any).res?.setHeader('Content-Type', 'text/csv');
    (req as any).res?.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    (req as any).res?.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit log by ID' })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async getById(@Param('id') id: string) {
    const log = await this.auditService.getById(id);
    if (!log) {
      throw new NotFoundException('Audit log not found');
    }
    return log;
  }
}
