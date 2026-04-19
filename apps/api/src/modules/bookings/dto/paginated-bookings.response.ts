import { ApiProperty } from '@nestjs/swagger';
import { BookingResponseDto } from './booking.response';

class PaginationMetaDto {
  @ApiProperty({ example: 123 })
  total: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}

export class PaginatedBookingsResponseDto {
  @ApiProperty({ type: [BookingResponseDto] })
  items: BookingResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
