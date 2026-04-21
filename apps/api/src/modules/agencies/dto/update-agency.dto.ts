import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateAgencyDto {
  @ApiPropertyOptional({ example: 'Sky Travel Agency' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
