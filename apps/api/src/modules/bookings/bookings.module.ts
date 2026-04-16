import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  providers: [BookingsService],
  controllers: [BookingsController]
})
export class BookingsModule {}
