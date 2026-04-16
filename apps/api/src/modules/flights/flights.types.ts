export interface FlightSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  adults: number;
}

export interface FlightSegment {
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  marketingCarrier: string;
  flightNumber: string;
  duration?: string;
  aircraft?: string;
}

export interface MoneyAmount {
  currency: string;
  amount: string;
}

export interface FlightOffer {
  id: string;
  segments: FlightSegment[];
  totalPrice: MoneyAmount;
  source?: 'duffel' | 'stub';
  validUntil?: string;
}

export interface FlightSearchResponse {
  offers: FlightOffer[];
}

export interface FlightQuoteRequest {
  offerId: string;
}

export interface FlightQuoteResponse {
  offer: FlightOffer;
}

export interface IFlightProvider {
  search(input: FlightSearchRequest): Promise<FlightOffer[]>;
  quote(offerId: string): Promise<FlightOffer>;
}
