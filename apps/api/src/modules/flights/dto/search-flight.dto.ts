import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchFlightDto {
  @ApiProperty({ example: 'DAC' })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  origin: string;

  @ApiProperty({ example: 'DXB' })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  destination: string;

  @ApiProperty({ example: '2025-06-15' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  departureDate: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(9)
  @Type(() => Number)
  adults: number;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MinLength(1)
  after?: string;
}
