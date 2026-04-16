import { Module } from '@nestjs/common';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';

@Module({
  providers: [FlightsService],
  controllers: [FlightsController]
})
export class FlightsModule {}
