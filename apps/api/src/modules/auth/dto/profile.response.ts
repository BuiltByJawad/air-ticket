import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AgencyDto {
  @ApiProperty({ example: 'agency-1' })
  id: string;

  @ApiProperty({ example: 'Test Agency' })
  name: string;
}

class ProfileUserDto {
  @ApiProperty({ example: 'user-1' })
  sub: string;

  @ApiProperty({ example: 'agent@test.com' })
  email: string;

  @ApiProperty({ example: 'agent' })
  role: 'agent' | 'admin';

  @ApiPropertyOptional({ example: 'agency-1', nullable: true })
  agencyId: string | null;

  @ApiPropertyOptional({ example: 'Test Agent', nullable: true })
  name: string | null;

  @ApiPropertyOptional({ example: '+8801712345678', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ nullable: true })
  agency: AgencyDto | null;
}

export class ProfileResponseDto {
  @ApiProperty()
  user: ProfileUserDto;
}
