'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock, ShieldCheck, Loader2 } from 'lucide-react';

const paymentSchema = z.object({
  cardNumber: z.string().regex(/^\d{16}$/, 'Card number must be 16 digits'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format must be MM/YY'),
  cvv: z.string().regex(/^\d{3}$/, 'CVV must be 3 digits'),
  cardholderName: z.string().min(1, 'Cardholder name is required'),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  amount: string;
  currency: string;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  isLoading?: boolean;
}

export function PaymentForm({ amount, currency, onSubmit, isLoading }: PaymentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="sr-only focus-within:not-sr-only focus-within:p-4 focus-within:bg-accent focus-within:text-accent-foreground focus-within:rounded-md mb-4">
          <a href="#process-payment-button">Skip to payment button</a>
        </div>
        <div className="mb-6 p-4 bg-muted rounded-lg flex justify-between items-center" role="region" aria-label="Payment summary">
          <span className="text-sm font-medium">Total Amount</span>
          <span className="text-xl font-bold">
            {currency} {amount}
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              {...register('cardholderName')}
              placeholder="JOHN DOE"
              autoComplete="cc-name"
              aria-invalid={!!errors.cardholderName}
              aria-describedby={errors.cardholderName ? 'cardholderName-error' : undefined}
              className={errors.cardholderName ? 'border-destructive' : ''}
            />
            {errors.cardholderName && (
              <p id="cardholderName-error" className="text-xs text-destructive">{errors.cardholderName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="cardNumber"
                {...register('cardNumber')}
                placeholder="0000 0000 0000 0000"
                maxLength={16}
                autoComplete="cc-number"
                inputMode="numeric"
                aria-invalid={!!errors.cardNumber}
                aria-describedby={errors.cardNumber ? 'cardNumber-error' : undefined}
                className={`pl-9 ${errors.cardNumber ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.cardNumber && (
              <p id="cardNumber-error" className="text-xs text-destructive">{errors.cardNumber.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                {...register('expiryDate')}
                placeholder="MM/YY"
                maxLength={5}
                autoComplete="cc-exp"
                aria-invalid={!!errors.expiryDate}
                aria-describedby={errors.expiryDate ? 'expiryDate-error' : undefined}
                className={errors.expiryDate ? 'border-destructive' : ''}
              />
              {errors.expiryDate && (
                <p id="expiryDate-error" className="text-xs text-destructive">{errors.expiryDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="cvv"
                  {...register('cvv')}
                  placeholder="123"
                  maxLength={3}
                  autoComplete="cc-csc"
                  inputMode="numeric"
                  aria-invalid={!!errors.cvv}
                  aria-describedby={errors.cvv ? 'cvv-error' : undefined}
                  className={`pl-9 ${errors.cvv ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.cvv && (
                <p id="cvv-error" className="text-xs text-destructive">{errors.cvv.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <ShieldCheck className="h-4 w-4 text-green-500" aria-hidden="true" />
              Your payment information is encrypted and secure.
            </div>
            <Button id="process-payment-button" type="submit" className="w-full" disabled={isLoading} aria-label={`Pay ${currency} ${amount} now`}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> Processing Payment...
                </>
              ) : (
                `Pay ${currency} ${amount}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
