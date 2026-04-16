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
}

export interface MoneyAmount {
  currency: string;
  amount: string;
}

export interface FlightOffer {
  id: string;
  segments: FlightSegment[];
  totalPrice: MoneyAmount;
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
