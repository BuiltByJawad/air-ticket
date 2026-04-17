import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CurrentUser, type CurrentUserData } from '../../auth/current-user.decorator';
import { AgenciesService } from '../agencies.service';
import { UsersService } from '../../users/users.service';
import { AuditService } from '../../audit/audit.service';

const CreateAgentBodySchema = z.object({
  agencyId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

type CreateAgentBody = z.infer<typeof CreateAgentBodySchema>;

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly agenciesService: AgenciesService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  async list() {
    return this.usersService.listAll();
  }

  @Post('agents')
  async createAgent(@Req() req: Request, @CurrentUser() caller: CurrentUserData, @Body() body: CreateAgentBody) {
    const parsed = CreateAgentBodySchema.parse(body);
    const passwordHash = await bcrypt.hash(parsed.password, 12);

    const agency = await this.agenciesService.findById(parsed.agencyId);
    if (!agency) {
      throw new BadRequestException('Invalid agencyId');
    }

    const user = await this.usersService.create({
      email: parsed.email,
      passwordHash,
      role: 'agent',
      agencyId: parsed.agencyId
    });

    await this.auditService.log({
      action: 'admin.create_agent',
      resource: 'user',
      resourceId: user.id,
      agencyId: parsed.agencyId,
      userId: caller.sub,
      requestId: req.requestId,
      metadata: { email: parsed.email, agencyId: parsed.agencyId }
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId,
      createdAt: user.createdAt
    };
  }
}
