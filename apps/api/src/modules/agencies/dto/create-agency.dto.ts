import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateAgencyDto {
  @ApiProperty({ example: 'Sky Travel Agency' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  markupPercentage?: number;
}
