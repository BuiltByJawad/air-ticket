import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class QuoteFlightDto {
  @ApiProperty({ example: 'off_0001' })
  @IsString()
  @MinLength(1)
  offerId: string;
}
