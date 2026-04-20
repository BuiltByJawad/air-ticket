import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AuditLogEntryDto {
  @ApiProperty({ example: 'log-1' })
  id: string;

  @ApiProperty({ example: 'auth.login' })
  action: string;

  @ApiProperty({ example: 'user' })
  resource: string;

  @ApiPropertyOptional({ example: 'user-1' })
  resourceId?: string;

  @ApiPropertyOptional({ example: 'agency-1' })
  agencyId?: string;

  @ApiPropertyOptional({ example: 'user-1' })
  userId?: string;

  @ApiPropertyOptional({ example: 'req-1' })
  requestId?: string;

  @ApiPropertyOptional({ example: { email: 'agent@test.com' } })
  metadata?: Record<string, unknown>;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;
}

class PaginationMetaDto {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 50 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}

export class AuditLogListResponseDto {
  @ApiProperty({ type: [AuditLogEntryDto] })
  items: AuditLogEntryDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
