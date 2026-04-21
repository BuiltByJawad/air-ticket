import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Roles } from '../../auth/roles.decorator';
import { CurrentUser, type CurrentUserData } from '../../auth/current-user.decorator';
import { AgenciesService } from '../agencies.service';
import { AuditService } from '../../audit/audit.service';
import { CreateAgencyDto } from '../dto/create-agency.dto';
import { UpdateAgencyDto } from '../dto/update-agency.dto';
import { AgencyResponseDto } from '../dto/agency.response';
import { AgencyPagedQueryDto } from '../dto/agency-paged-query.dto';

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
  async listPaged(@Query() query: AgencyPagedQueryDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    return this.agenciesService.listAllPaged({ limit, offset, search: query.search });
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

  @Patch(':id')
  @ApiOperation({ summary: 'Update an agency' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agency updated', type: AgencyResponseDto })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async update(@Req() req: Request, @CurrentUser() user: CurrentUserData, @Param('id') id: string, @Body() body: UpdateAgencyDto) {
    const result = await this.agenciesService.update(id, body);
    await this.auditService.log({
      action: 'admin.update_agency',
      resource: 'agency',
      resourceId: id,
      agencyId: id,
      userId: user.sub,
      requestId: req.requestId,
      metadata: { name: body.name }
    });
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an agency' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Agency deleted', type: AgencyResponseDto })
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  async remove(@Req() req: Request, @CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    const result = await this.agenciesService.delete(id);
    await this.auditService.log({
      action: 'admin.delete_agency',
      resource: 'agency',
      resourceId: id,
      agencyId: id,
      userId: user.sub,
      requestId: req.requestId
    });
    return result;
  }
}
