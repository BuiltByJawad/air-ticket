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
}
