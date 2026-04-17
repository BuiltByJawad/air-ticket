import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsJSON, MinLength, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'off_0001' })
  @IsString()
  @MinLength(1)
  offerId: string;

  @ApiProperty({ example: { segments: [] } })
  @IsJSON()
  offerData: Record<string, unknown>;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency: string;

  @ApiProperty({ example: '500.00' })
  @IsString()
  @MinLength(1)
  amount: string;
}
