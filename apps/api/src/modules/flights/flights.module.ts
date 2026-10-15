import { Module } from '@nestjs/common';
import { FlightsController } from './flights.controller';
import { FlightsService } from './flights.service';
import { DuffelProvider } from './providers/duffel.provider';
import { StubProvider } from './providers/stub.provider';

@Module({
  providers: [FlightsService, DuffelProvider, StubProvider],
  controllers: [FlightsController],
  exports: [DuffelProvider]
})
export class FlightsModule {}
