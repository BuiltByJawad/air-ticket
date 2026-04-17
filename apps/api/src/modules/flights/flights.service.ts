import { Injectable, Logger } from '@nestjs/common';
import type { CurrentUserData } from '../auth/current-user.decorator';
import type {
  FlightQuoteRequest,
  FlightQuoteResponse,
  FlightSearchRequest,
  FlightSearchResponse,
  IFlightProvider
} from './flights.types';
import { DuffelProvider, type DuffelAirportSuggestion } from './providers/duffel.provider';
import { StubProvider } from './providers/stub.provider';

export interface AirportSuggestion {
  iata: string;
  name: string;
  city: string;
  country: string;
}

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

  async suggestAirports(query: string): Promise<AirportSuggestion[]> {
    if (!query || query.length < 1) return [];

    try {
      const results = await this.duffelProvider.suggestAirports(query);
      if (results.length > 0) return results;
    } catch (error) {
      this.logger.warn(`Duffel places suggest failed, using static fallback: ${String(error)}`);
    }

    return this.staticFallback(query);
  }

  private staticFallback(query: string): AirportSuggestion[] {
    const q = query.toLowerCase();
    const staticAirports: AirportSuggestion[] = [
      { iata: 'DAC', name: 'Hazrat Shahjalal International', city: 'Dhaka', country: 'BD' },
      { iata: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'AE' },
      { iata: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'AE' },
      { iata: 'JED', name: 'King Abdulaziz International', city: 'Jeddah', country: 'SA' },
      { iata: 'RUH', name: 'King Khalid International', city: 'Riyadh', country: 'SA' },
      { iata: 'LHR', name: 'Heathrow', city: 'London', country: 'GB' },
      { iata: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'US' },
      { iata: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'US' },
      { iata: 'SIN', name: 'Changi', city: 'Singapore', country: 'SG' },
      { iata: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'TH' },
      { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'TR' },
      { iata: 'DOH', name: 'Hamad International', city: 'Doha', country: 'QA' },
      { iata: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'IN' },
      { iata: 'BOM', name: 'Chhatrapati Shivaji International', city: 'Mumbai', country: 'IN' },
      { iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR' },
      { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'DE' },
      { iata: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'NL' },
      { iata: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'HK' },
      { iata: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'JP' },
      { iata: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'KR' },
      { iata: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'AU' },
      { iata: 'CGP', name: 'Shah Amanat International', city: 'Chittagong', country: 'BD' },
      { iata: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'MY' },
      { iata: 'MCT', name: 'Muscat International', city: 'Muscat', country: 'OM' },
      { iata: 'KHI', name: 'Jinnah International', city: 'Karachi', country: 'PK' },
      { iata: 'CMB', name: 'Bandaranaike International', city: 'Colombo', country: 'LK' },
      { iata: 'KTM', name: 'Tribhuvan International', city: 'Kathmandu', country: 'NP' },
      { iata: 'MLE', name: 'Velana International', city: 'Male', country: 'MV' },
      { iata: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'EG' },
      { iata: 'ADD', name: 'Bole International', city: 'Addis Ababa', country: 'ET' },
    ];

    return staticAirports
      .filter((a) =>
        a.iata.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }
}
