import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AuthUserDto {
  @ApiProperty({ example: 'user-1' })
  id: string;

  @ApiProperty({ example: 'agent@test.com' })
  email: string;

  @ApiProperty({ example: 'agent' })
  role: string;

  @ApiPropertyOptional({ example: 'agency-1', nullable: true })
  agencyId: string | null;
}

export class AuthTokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  accessToken: string;

  @ApiProperty()
  user: AuthUserDto;
}
