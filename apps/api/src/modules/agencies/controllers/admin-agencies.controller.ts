import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CurrentUser, type CurrentUserData } from '../../auth/current-user.decorator';
import { AgenciesService } from '../agencies.service';
import { AuditService } from '../../audit/audit.service';

interface CreateAgencyBody {
  name: string;
}

@Controller('admin/agencies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminAgenciesController {
  constructor(
    private readonly agenciesService: AgenciesService,
    private readonly auditService: AuditService
  ) {}

  @Post()
  async create(@Req() req: Request, @CurrentUser() user: CurrentUserData, @Body() body: CreateAgencyBody) {
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
