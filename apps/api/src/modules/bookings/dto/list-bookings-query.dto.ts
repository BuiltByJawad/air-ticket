import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class ListBookingsQueryDto {
  @ApiPropertyOptional({ example: 'agency-1' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  agencyId?: string;

  @ApiPropertyOptional({ example: 'draft', enum: ['draft', 'confirmed', 'cancelled'] })
  @IsOptional()
  @IsIn(['draft', 'confirmed', 'cancelled'])
  status?: 'draft' | 'confirmed' | 'cancelled';

  @ApiPropertyOptional({ example: 'offer-123' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  search?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
