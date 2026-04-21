import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ExportBookingsQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiProperty({ required: false, description: 'Start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  @Type(() => String)
  fromDate?: string;

  @ApiProperty({ required: false, description: 'End date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  @Type(() => String)
  toDate?: string;
}
