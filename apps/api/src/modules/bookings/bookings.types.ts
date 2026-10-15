export type BookingStatus = 'draft' | 'payment' | 'confirmed' | 'cancelled';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface MoneyAmount {
  currency: string;
  amount: string;
}

export interface Passenger {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'O';
  passportNumber: string;
  passportExpiry: string;
  passportIssuingCountry: string;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  offerId: string;
  offerData: JsonValue;
  totalPrice: MoneyAmount;
  passengers?: Passenger[];
  duffelOrderId?: string;
  duffelPnr?: string;
  duffelTicketNumbers?: string[];
  agencyId: string;
  agencyName?: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}
