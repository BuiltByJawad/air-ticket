import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { FlightsModule } from '../flights/flights.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [FlightsModule, PricingModule],
  providers: [BookingsService],
  controllers: [BookingsController]
})
export class BookingsModule {}
