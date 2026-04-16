import { Injectable } from '@nestjs/common';
import type { CurrentUserData } from '../auth/current-user.decorator';
import type {
  FlightOffer,
  FlightQuoteRequest,
  FlightQuoteResponse,
  FlightSearchRequest,
  FlightSearchResponse
} from './flights.types';

function normalizeIata(value: string): string {
  return value.trim().toUpperCase();
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function addHoursIso(dateIso: string, hours: number): string {
  const date = new Date(`${dateIso}T00:00:00.000Z`);
  date.setUTCHours(date.getUTCHours() + hours);
  return date.toISOString();
}

function stableOfferId(input: { agencyId: string | null; origin: string; destination: string; departureDate: string; index: number }): string {
  const agencyPart = input.agencyId ?? 'no_agency';
  return [agencyPart, input.origin, input.destination, input.departureDate, String(input.index)].join('_');
}

@Injectable()
export class FlightsService {
  async search(user: CurrentUserData, input: FlightSearchRequest): Promise<FlightSearchResponse> {
    const origin = normalizeIata(input.origin);
    const destination = normalizeIata(input.destination);

    const offers: FlightOffer[] = [0, 1, 2].map((i) => {
      const id = stableOfferId({
        agencyId: user.agencyId,
        origin,
        destination,
        departureDate: input.departureDate,
        index: i
      });

      const dep = addHoursIso(input.departureDate, 8 + i * 2);
      const arr = addHoursIso(input.departureDate, 12 + i * 2);

      const base = 120 + i * 35;
      const pax = Math.max(1, input.adults);
      const total = base * pax;

      return {
        id,
        segments: [
          {
            from: origin,
            to: destination,
            departureTime: dep,
            arrivalTime: arr,
            marketingCarrier: 'AT',
            flightNumber: `AT${pad2(10 + i)}`
          }
        ],
        totalPrice: {
          currency: 'USD',
          amount: total.toFixed(2)
        }
      };
    });

    return { offers };
  }

  async quote(user: CurrentUserData, input: FlightQuoteRequest): Promise<FlightQuoteResponse> {
    const parts = input.offerId.split('_');
    const agencyPart = parts[0] ?? 'no_agency';

    const expectedAgencyPart = user.agencyId ?? 'no_agency';
    if (agencyPart !== expectedAgencyPart) {
      throw new Error('Offer not found');
    }

    const origin = parts[1] ?? 'UNK';
    const destination = parts[2] ?? 'UNK';
    const departureDate = parts[3] ?? '1970-01-01';
    const index = Number(parts[4] ?? '0');

    const search = await this.search(user, {
      origin,
      destination,
      departureDate,
      adults: 1
    });

    const offer = search.offers.find((o) => o.id === input.offerId) ?? {
      id: input.offerId,
      segments: [],
      totalPrice: { currency: 'USD', amount: '0.00' }
    };

    const fee = Math.max(0, index) * 2;
    const amount = (Number(offer.totalPrice.amount) + fee).toFixed(2);

    return {
      offer: {
        ...offer,
        totalPrice: {
          currency: offer.totalPrice.currency,
          amount
        }
      }
    };
  }
}
