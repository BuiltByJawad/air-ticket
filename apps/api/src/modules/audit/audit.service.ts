import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogInput {
  action: string;
  resource: string;
  resourceId?: string;
  agencyId?: string | null;
  userId?: string | null;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          agencyId: input.agencyId,
          userId: input.userId,
          requestId: input.requestId,
          metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined
        }
      });
    } catch (error) {
      this.logger.error({
        event: 'audit_log_failed',
        action: input.action,
        resource: input.resource,
        error: error instanceof Error ? error.message : 'unknown'
      });
    }
  }

  async listLogs(query: {
    action?: string;
    resource?: string;
    agencyId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: unknown[]; total: number; limit: number; offset: number }> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const where: Record<string, unknown> = {};
    if (query.action) where.action = query.action;
    if (query.resource) where.resource = query.resource;
    if (query.agencyId) where.agencyId = query.agencyId;
    if (query.userId) where.userId = query.userId;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return { items, total, limit, offset };
  }
}
