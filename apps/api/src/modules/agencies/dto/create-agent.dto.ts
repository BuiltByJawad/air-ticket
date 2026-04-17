import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({ example: 'agency-1' })
  @IsString()
  @MinLength(1)
  agencyId: string;

  @ApiProperty({ example: 'new@agency.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePass123' })
  @IsString()
  @MinLength(8)
  password: string;
}
