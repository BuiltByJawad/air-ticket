import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PaginatedResult } from '../app/pagination.types';

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  agencyId?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

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
    search?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResult<AuditLog>> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const where: Record<string, unknown> = {};
    if (query.action) where.action = query.action;
    if (query.resource) where.resource = query.resource;
    if (query.agencyId) where.agencyId = query.agencyId;
    if (query.userId) where.userId = query.userId;

    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { resource: { contains: query.search, mode: 'insensitive' } },
        { resourceId: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    const dateFilter: Record<string, unknown> = {};
    if (query.fromDate) dateFilter.gte = new Date(query.fromDate);
    if (query.toDate) dateFilter.lte = new Date(query.toDate);
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return {
      items: items as AuditLog[],
      meta: { total, limit, offset }
    };
  }

  async getById(id: string): Promise<AuditLog | null> {
    const log = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!log) return null;
    return log as AuditLog;
  }

  async exportCsv(query: {
    action?: string;
    resource?: string;
    agencyId?: string;
    userId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<string> {
    const where: Record<string, unknown> = {};
    if (query.action) where.action = query.action;
    if (query.resource) where.resource = query.resource;
    if (query.agencyId) where.agencyId = query.agencyId;
    if (query.userId) where.userId = query.userId;

    const dateFilter: Record<string, unknown> = {};
    if (query.fromDate) dateFilter.gte = new Date(query.fromDate);
    if (query.toDate) dateFilter.lte = new Date(query.toDate);
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;

    const rows = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10_000
    });

    const header = 'id,action,resource,resourceId,agencyId,userId,requestId,createdAt';
    const lines = rows.map((r) =>
      [r.id, r.action, r.resource, r.resourceId ?? '', r.agencyId ?? '', r.userId ?? '', r.requestId ?? '', r.createdAt.toISOString()]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );

    return [header, ...lines].join('\n');
  }

  async getStats(query: {
    agencyId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<Array<{ action: string; count: number }>> {
    const where: Record<string, unknown> = {};
    if (query.agencyId) where.agencyId = query.agencyId;

    const dateFilter: Record<string, unknown> = {};
    if (query.fromDate) dateFilter.gte = new Date(query.fromDate);
    if (query.toDate) dateFilter.lte = new Date(query.toDate);
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;

    const rows = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } }
    });

    return rows.map((r) => ({ action: r.action, count: r._count.action }));
  }
}
