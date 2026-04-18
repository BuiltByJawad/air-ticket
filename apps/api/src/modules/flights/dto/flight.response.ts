import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class FlightSegmentDto {
  @ApiPropertyOptional({ example: 'EK' })
  operatingCarrier?: string;

  @ApiPropertyOptional({ example: '500' })
  flightNumber?: string;

  @ApiPropertyOptional({ example: 'DAC' })
  origin?: string;

  @ApiPropertyOptional({ example: 'DXB' })
  destination?: string;

  @ApiPropertyOptional({ example: '2025-06-15T10:00:00Z' })
  departingAt?: string;

  @ApiPropertyOptional({ example: '2025-06-15T13:00:00Z' })
  arrivingAt?: string;
}

class FlightOfferDto {
  @ApiProperty({ example: 'off_0001' })
  id: string;

  @ApiPropertyOptional({ type: [FlightSegmentDto] })
  slices?: FlightSegmentDto[];

  @ApiPropertyOptional({ example: 'USD' })
  currency?: string;

  @ApiPropertyOptional({ example: '500.00' })
  amount?: string;
}

export class FlightSearchResponseDto {
  @ApiProperty({ type: [FlightOfferDto] })
  offers: FlightOfferDto[];

  @ApiPropertyOptional({ example: 'cursor_abc123' })
  nextCursor?: string;
}

export class FlightQuoteResponseDto {
  @ApiProperty()
  offer: FlightOfferDto;
}

export class AirportSuggestionDto {
  @ApiProperty({ example: 'DAC' })
  iata: string;

  @ApiProperty({ example: 'Hazrat Shahjalal International' })
  name: string;

  @ApiProperty({ example: 'Dhaka' })
  city: string;

  @ApiProperty({ example: 'BD' })
  country: string;
}
