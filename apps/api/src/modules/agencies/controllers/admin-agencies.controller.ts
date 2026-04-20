import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Roles } from '../../auth/roles.decorator';
import { CurrentUser, type CurrentUserData } from '../../auth/current-user.decorator';
import { AgenciesService } from '../agencies.service';
import { AuditService } from '../../audit/audit.service';
import { CreateAgencyDto } from '../dto/create-agency.dto';
import { AgencyResponseDto } from '../dto/agency.response';
import { PagedQueryDto } from '../../app/dto/paged-query.dto';

@ApiTags('Admin - Agencies')
@ApiBearerAuth()
@Controller('admin/agencies')
@Roles('admin')
export class AdminAgenciesController {
  constructor(
    private readonly agenciesService: AgenciesService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all agencies' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agencies listed', type: [AgencyResponseDto] })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async list() {
    return this.agenciesService.listAll();
  }

  @Get('paged')
  @ApiOperation({ summary: 'List agencies (paged)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agencies listed (paged)' })
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async listPaged(@Query() query: PagedQueryDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    return this.agenciesService.listAllPaged({ limit, offset });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new agency' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Agency created', type: AgencyResponseDto })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async create(@Req() req: Request, @CurrentUser() user: CurrentUserData, @Body() body: CreateAgencyDto) {
    const result = await this.agenciesService.create({ name: body.name });
    await this.auditService.log({
      action: 'admin.create_agency',
      resource: 'agency',
      resourceId: result.id,
      agencyId: result.id,
      userId: user.sub,
      requestId: req.requestId,
      metadata: { name: body.name }
    });
    return result;
  }
}
