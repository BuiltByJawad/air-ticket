import { Injectable, Logger } from '@nestjs/common';
import type { CurrentUserData } from '../auth/current-user.decorator';
import type {
  FlightQuoteRequest,
  FlightQuoteResponse,
  FlightSearchRequest,
  FlightSearchResponse,
  IFlightProvider
} from './flights.types';
import { DuffelProvider } from './providers/duffel.provider';
import { StubProvider } from './providers/stub.provider';

@Injectable()
export class FlightsService {
  private readonly logger = new Logger(FlightsService.name);
  private readonly provider: IFlightProvider;

  constructor(
    private readonly duffelProvider: DuffelProvider,
    private readonly stubProvider: StubProvider
  ) {
    this.provider = duffelProvider;
  }

  async search(user: CurrentUserData, input: FlightSearchRequest): Promise<FlightSearchResponse> {
    try {
      const result = await this.provider.search(input);
      if (result.offers.length > 0) {
        return { offers: result.offers, nextCursor: result.nextCursor };
      }
    } catch (error) {
      this.logger.warn(`Primary provider failed, falling back to stub: ${String(error)}`);
    }

    const result = await this.stubProvider.search(input);
    return { offers: result.offers };
  }

  async quote(user: CurrentUserData, input: FlightQuoteRequest): Promise<FlightQuoteResponse> {
    const isDuffelOffer = !input.offerId.startsWith('stub_');

    if (isDuffelOffer) {
      try {
        const offer = await this.provider.quote(input.offerId);
        return { offer };
      } catch (error) {
        this.logger.warn(`Duffel quote failed: ${String(error)}`);
        throw new Error('Offer no longer available');
      }
    }

    const offer = await this.stubProvider.quote(input.offerId);
    return { offer };
  }
}
