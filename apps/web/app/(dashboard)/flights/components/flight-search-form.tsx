'use client';

import { Search, Users, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { DatePicker } from '@/components/shared/date-picker';
import { AirportAutocomplete } from '@/components/shared/airport-autocomplete';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function FlightSearchFormInner({ token }: { token: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const [origin, setOrigin] = useState(params.get('origin') ?? '');
  const [destination, setDestination] = useState(params.get('destination') ?? '');
  const [departureDate, setDepartureDate] = useState(params.get('departureDate') ?? '');
  const [adults, setAdults] = useState(Number(params.get('adults') || '1'));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  function swapAirports() {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!origin || origin.length !== 3) e.origin = 'Select a departure airport';
    if (!destination || destination.length !== 3) e.destination = 'Select a destination airport';
    if (!departureDate) e.departureDate = 'Select a departure date';
    if (origin && destination && origin.toUpperCase() === destination.toUpperCase()) {
      e.destination = 'Origin and destination must differ';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const q = new URLSearchParams({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      adults: String(adults > 0 ? adults : 1)
    });
    router.push(`/flights?${q.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr]">
        <AirportAutocomplete
          id="origin"
          name="origin"
          label="From"
          icon="from"
          value={origin}
          onChange={(iata) => { setOrigin(iata); if (errors.origin) setErrors((p) => ({ ...p, origin: '' })); }}
          error={errors.origin}
          placeholder="Search city or airport"
          token={token}
        />

        <div className="flex items-end pb-1.5 justify-center">
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={swapAirports}>
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        <AirportAutocomplete
          id="destination"
          name="destination"
          label="To"
          icon="to"
          value={destination}
          onChange={(iata) => { setDestination(iata); if (errors.destination) setErrors((p) => ({ ...p, destination: '' })); }}
          error={errors.destination}
          placeholder="Search city or airport"
          token={token}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        <FormField id="departureDate" label="Departure Date" required error={errors.departureDate}>
          <DatePicker
            id="departureDate"
            name="departureDate"
            value={departureDate}
            onChange={(v) => { setDepartureDate(v); if (errors.departureDate) setErrors((p) => ({ ...p, departureDate: '' })); }}
            minDate={today}
            error={!!errors.departureDate}
          />
        </FormField>

        <FormField id="adults" label="Passengers" required>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="adults"
              name="adults"
              type="number"
              min={1}
              max={9}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="pl-9"
            />
          </div>
        </FormField>

        <div className="flex items-end pb-1.5">
          <Button type="submit" className="w-full sm:w-auto h-10 px-6">
            <Search className="h-4 w-4 mr-2" /> Search Flights
          </Button>
        </div>
      </div>
    </form>
  );
}

export function FlightSearchForm({ token }: { token: string }) {
  return (
    <Suspense fallback={null}>
      <FlightSearchFormInner token={token} />
    </Suspense>
  );
}
