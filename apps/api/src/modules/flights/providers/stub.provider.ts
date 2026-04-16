import { Injectable } from '@nestjs/common';
import type { IFlightProvider, FlightOffer } from '../flights.types';

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

@Injectable()
export class StubProvider implements IFlightProvider {
  async search(input: { origin: string; destination: string; departureDate: string; adults: number }): Promise<FlightOffer[]> {
    const origin = normalizeIata(input.origin);
    const destination = normalizeIata(input.destination);

    return [0, 1, 2].map((i) => {
      const dep = addHoursIso(input.departureDate, 8 + i * 2);
      const arr = addHoursIso(input.departureDate, 12 + i * 2);

      const base = 120 + i * 35;
      const pax = Math.max(1, input.adults);
      const total = base * pax;

      return {
        id: `stub_${origin}_${destination}_${input.departureDate}_${i}`,
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
        },
        source: 'stub' as const
      };
    });
  }

  async quote(offerId: string): Promise<FlightOffer> {
    const parts = offerId.split('_');
    const origin = parts[1] ?? 'UNK';
    const destination = parts[2] ?? 'UNK';
    const departureDate = parts[3] ?? '1970-01-01';
    const index = Number(parts[4] ?? '0');

    const offers = await this.search({ origin, destination, departureDate, adults: 1 });
    const offer = offers.find((o) => o.id === offerId) ?? {
      id: offerId,
      segments: [],
      totalPrice: { currency: 'USD', amount: '0.00' },
      source: 'stub' as const
    };

    const fee = Math.max(0, index) * 2;
    const amount = (Number(offer.totalPrice.amount) + fee).toFixed(2);

    return {
      ...offer,
      totalPrice: {
        currency: offer.totalPrice.currency,
        amount
      }
    };
  }
}
