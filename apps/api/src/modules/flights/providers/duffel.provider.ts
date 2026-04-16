import { Injectable, Logger } from '@nestjs/common';
import type { IFlightProvider, FlightOffer, FlightSegment } from '../flights.types';
import { loadEnv } from '../../../config/env';

const DUFFEL_API = 'https://api.duffel.com';

@Injectable()
export class DuffelProvider implements IFlightProvider {
  private readonly token: string | null = null;
  private readonly logger = new Logger(DuffelProvider.name);

  constructor() {
    const env = loadEnv();
    if (!env.DUFFEL_ACCESS_TOKEN) {
      this.logger.warn('Duffel access token not configured — provider will throw on use');
      return;
    }
    this.token = env.DUFFEL_ACCESS_TOKEN;
    this.logger.log('Duffel provider initialized');
  }

  async search(input: { origin: string; destination: string; departureDate: string; adults: number; limit?: number; after?: string }): Promise<{ offers: FlightOffer[]; nextCursor?: string }> {
    this.ensureToken();

    try {
      const body: Record<string, unknown> = {
        data: {
          cabin_class: 'economy',
          slices: [
            {
              departure_date: input.departureDate,
              destination: input.destination.toUpperCase(),
              origin: input.origin.toUpperCase()
            }
          ],
          passengers: Array.from({ length: input.adults }, () => ({ type: 'adult' as const }))
        }
      };

      if (input.limit) {
        body.data = { ...((body.data as Record<string, unknown>) ?? {}), max_offers: input.limit };
      }

      let path = '/air/offer_requests';
      if (input.after) {
        path = `/air/offers?after=${encodeURIComponent(input.after)}&limit=${input.limit ?? 10}`;
      }

      const res = await this.request<DuffelOfferRequestResponse>('POST', path, input.after ? undefined : body);

      if (!res.data?.offers || res.data.offers.length === 0) {
        return { offers: [] };
      }

      const offers = res.data.offers.map((offer) => this.normalizeOffer(offer));
      const nextCursor = res.data.after ?? undefined;

      return { offers, nextCursor };
    } catch (error) {
      this.logger.error(`Duffel search failed: ${this.extractError(error)}`);
      throw error;
    }
  }

  async quote(offerId: string): Promise<FlightOffer> {
    this.ensureToken();

    try {
      const res = await this.request<DuffelOfferResponse>('GET', `/air/offers/${offerId}`);

      if (!res.data) {
        throw new Error('Offer not found');
      }

      return this.normalizeOffer(res.data);
    } catch (error) {
      this.logger.error(`Duffel quote failed: ${this.extractError(error)}`);
      throw error;
    }
  }

  private normalizeOffer(offer: DuffelOffer): FlightOffer {
    const segments: FlightSegment[] = offer.slices.flatMap((slice) =>
      slice.segments.map((seg) => ({
        from: seg.departing_airport.iata_code,
        to: seg.arriving_airport.iata_code,
        departureTime: seg.departing_at,
        arrivalTime: seg.arriving_at,
        marketingCarrier: seg.marketing_carrier.iata_code,
        flightNumber: `${seg.marketing_carrier.iata_code}${seg.operating_carrier_flight_number}`,
        duration: seg.duration,
        aircraft: seg.aircraft?.code
      }))
    );

    return {
      id: offer.id,
      segments,
      totalPrice: {
        currency: offer.total_currency,
        amount: offer.total_amount
      },
      source: 'duffel',
      validUntil: offer.expires_at
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${DUFFEL_API}${path}`;
    const init: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
        'Duffel-Version': 'v2'
      }
    };

    if (body) {
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Duffel API ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  private ensureToken(): void {
    if (!this.token) {
      throw new Error('Duffel access token not configured. Set DUFFEL_ACCESS_TOKEN.');
    }
  }

  private extractError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}

interface DuffelOfferRequestResponse {
  data: {
    offers: DuffelOffer[];
    after?: string;
  };
}

interface DuffelOfferResponse {
  data: DuffelOffer;
}

interface DuffelOffer {
  id: string;
  slices: Array<{
    segments: Array<{
      departing_airport: { iata_code: string };
      arriving_airport: { iata_code: string };
      departing_at: string;
      arriving_at: string;
      duration: string;
      marketing_carrier: { iata_code: string };
      operating_carrier_flight_number: string;
      aircraft?: { code: string };
    }>;
  }>;
  total_currency: string;
  total_amount: string;
  expires_at?: string;
}
