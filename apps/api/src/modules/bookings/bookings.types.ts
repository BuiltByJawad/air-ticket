export type BookingStatus = 'draft' | 'confirmed' | 'cancelled';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface MoneyAmount {
  currency: string;
  amount: string;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  offerId: string;
  offerData: JsonValue;
  totalPrice: MoneyAmount;
  agencyId: string;
  agencyName?: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}
