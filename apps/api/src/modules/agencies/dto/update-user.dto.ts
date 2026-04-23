import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'agency-uuid' })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({ example: 'agent', enum: ['agent', 'admin'] })
  @IsOptional()
  @IsIn(['agent', 'admin'])
  role?: 'agent' | 'admin';
}
