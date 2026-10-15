export interface CreatePaymentIntentInput {
  bookingId: string;
  currency: string;
  amount: string;
}

export interface CreatePaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentConfirmation {
  bookingId: string;
  paymentIntentId: string;
  status: 'succeeded' | 'canceled' | 'requires_payment_method';
}
