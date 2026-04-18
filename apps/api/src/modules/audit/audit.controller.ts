import { Controller, Get, Query } from '@nestjs/common';
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
}
