'use client';

import { useState } from 'react';
import { PassengerForm } from '../../bookings/new/passenger-form';
import { PaymentForm } from '../../bookings/new/payment-form';
import { SeatSelection } from './seat-selection';
import { Button } from '@/components/ui/button';
import { type FlightOffer } from '@/lib/api/api-client';
import { Badge } from '@/components/ui/badge';
import { Clock, Plane, Receipt, ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function fmtDuration(dur?: string) {
  if (!dur) return null;
  const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return dur;
  return `${m[1] ?? '0'}h ${m[2] ?? '0'}m`;
}

interface BookingWizardProps {
  offer: FlightOffer;
  adults: number;
  bookAction: (offerId: string, passengers: any[]) => Promise<any>;
  onCancel: () => void;
}

export function BookingWizard({ offer, adults, bookAction, onCancel }: BookingWizardProps) {
  const [step, setStep] = useState<'details' | 'confirm' | 'payment' | 'seats'>('details');
  const [passengers, setPassengers] = useState<any[]>([]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const first = offer.segments[0];
  const last = offer.segments[offer.segments.length - 1];
  const duration = fmtDuration(first?.duration);

  const handlePassengerSubmit = (data: { passengers: any[] }) => {
    setPassengers(data.passengers);
    setStep('confirm');
    window.scrollTo(0, 0);
  };

  const handleCreateBooking = async () => {
    setLoading(true);
    try {
      const result = await bookAction(offer.id, passengers);
      setBookingId(result.id);
      setStep('seats');
      window.scrollTo(0, 0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatsSelected = (seats: Record<number, string>) => {
    setSelectedSeats(seats);
    setStep('payment');
    window.scrollTo(0, 0);
  };

  const handlePaymentSubmit = async (paymentData: any) => {
    setLoading(true);
    try {
      // In a real app, this would call processBookingPayment via a server action
      // For now, we simulate success as F2 is about mocking/integrating payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Payment successful and booking confirmed!');
      router.push('/bookings');
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!first || !last) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Complete Your Booking</h2>
          <p className="text-muted-foreground">
            Step {step === 'details' ? '1' : step === 'confirm' ? '2' : '3'} of 3
          </p>
        </div>
      </div>

      <Card className="bg-muted/50 border-none">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Plane className="h-4 w-4 text-primary" />
                <span className="font-semibold">{first.from} → {last.to}</span>
                <Badge variant="outline">{offer.segments.length === 1 ? 'Non-stop' : `${offer.segments.length - 1} stop(s)`}</Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {fmtTime(first.departureTime)} - {fmtTime(last.arrivalTime)}
                </span>
                {duration && <span>· {duration}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Price ({adults} Passenger{adults !== 1 ? 's' : ''})</div>
              <div className="text-xl font-bold text-primary">
                {offer.totalPrice.currency} {offer.totalPrice.amount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {step === 'details' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold px-1">
            <Receipt className="h-5 w-5 text-primary" />
            Passenger Information
          </div>
          <PassengerForm 
            initialCount={adults} 
            onSubmit={handlePassengerSubmit}
            isLoading={loading}
          />
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Passenger Details</h3>
            <div className="grid gap-4">
              {passengers.map((p, i) => (
                <Card key={i}>
                  <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Full Name</div>
                      <div className="font-medium">{p.firstName} {p.lastName}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Passport</div>
                      <div className="font-medium">{p.passportNumber} ({p.passportIssuingCountry})</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Email</div>
                      <div className="font-medium">{p.email}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Phone</div>
                      <div className="font-medium">{p.phone}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Date of Birth</div>
                      <div className="font-medium">{p.dateOfBirth}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Gender</div>
                      <div className="font-medium">{p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setStep('details')}>
              Edit Details
            </Button>
            <Button className="w-full sm:w-auto ml-auto" onClick={handleCreateBooking} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Booking...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 'seats' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">Select Your Seats</h3>
            <p className="text-muted-foreground">Choose your preferred seats for the flight.</p>
          </div>
          <SeatSelection
            passengers={passengers}
            onComplete={handleSeatsSelected}
            onBack={() => setStep('confirm')}
          />
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">Secure Payment</h3>
            <p className="text-muted-foreground">Complete payment to finalize your booking.</p>
          </div>
          <PaymentForm 
            amount={offer.totalPrice.amount}
            currency={offer.totalPrice.currency}
            onSubmit={handlePaymentSubmit}
            isLoading={loading}
          />
          <div className="flex justify-center">
            <Button variant="ghost" onClick={() => setStep('confirm')} disabled={loading}>
              Back to Review
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
