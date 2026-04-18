import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgencyResponseDto {
  @ApiProperty({ example: 'agency-1' })
  id: string;

  @ApiProperty({ example: 'Test Agency' })
  name: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;
}
