import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, type CurrentUserData } from '../auth/current-user.decorator';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { z } from 'zod';

const ListAuditLogsQuerySchema = z.object({
  action: z.string().optional(),
  resource: z.string().optional(),
  agencyId: z.string().optional(),
  userId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  async list(@CurrentUser() user: CurrentUserData, @Query() query: unknown) {
    const parsed = ListAuditLogsQuerySchema.safeParse(query);
    if (!parsed.success) {
      return { items: [], total: 0, limit: 50, offset: 0 };
    }

    const where: Record<string, unknown> = {};
    if (parsed.data.action) where.action = parsed.data.action;
    if (parsed.data.resource) where.resource = parsed.data.resource;
    if (parsed.data.agencyId) where.agencyId = parsed.data.agencyId;
    if (parsed.data.userId) where.userId = parsed.data.userId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parsed.data.limit,
        skip: parsed.data.offset
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return {
      items,
      total,
      limit: parsed.data.limit,
      offset: parsed.data.offset
    };
  }
}
