import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'user-1' })
  id: string;

  @ApiProperty({ example: 'agent@test.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Test Agent', nullable: true })
  name: string | null;

  @ApiPropertyOptional({ example: '+8801712345678', nullable: true })
  phone: string | null;

  @ApiProperty({ example: 'agent', enum: ['agent', 'admin'] })
  role: 'agent' | 'admin';

  @ApiPropertyOptional({ example: 'agency-1', nullable: true })
  agencyId: string | null;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;
}
