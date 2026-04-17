import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class ListBookingsQueryDto {
  @ApiPropertyOptional({ example: 'agency-1' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  agencyId?: string;
}
