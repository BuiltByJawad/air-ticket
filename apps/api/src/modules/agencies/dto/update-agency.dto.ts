import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateAgencyDto {
  @ApiPropertyOptional({ example: 'Sky Travel Agency' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 5.0, description: 'Markup percentage to add to flight prices' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  markupPercentage?: number;
}
