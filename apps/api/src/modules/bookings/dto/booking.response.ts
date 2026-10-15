import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MoneyAmountDto {
  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: '500.00' })
  amount: string;
}

export class BookingResponseDto {
  @ApiProperty({ example: 'booking-1' })
  id: string;

  @ApiProperty({ example: 'draft', enum: ['draft', 'payment', 'confirmed', 'cancelled'] })
  status: 'draft' | 'payment' | 'confirmed' | 'cancelled';

  @ApiProperty({ example: 'off_0001' })
  offerId: string;

  @ApiPropertyOptional({ example: { segments: [] } })
  offerData: Record<string, unknown>;

  @ApiProperty()
  totalPrice: MoneyAmountDto;

  @ApiProperty({ example: 'agency-1' })
  agencyId: string;

  @ApiProperty({ example: 'user-1' })
  createdByUserId: string;

  @ApiPropertyOptional({ example: 'ord_0000A1B2C3' })
  duffelOrderId?: string;

  @ApiPropertyOptional({ example: 'PNR123' })
  duffelPnr?: string;

  @ApiPropertyOptional({ example: ['176-1234567890'] })
  duffelTicketNumbers?: string[];

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
