'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { searchFlights, type FlightOffer } from '@/lib/api/api-client';
import { Loader2, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Plane } from 'lucide-react';

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

function OfferSourceBadge({ source }: { source?: 'duffel' | 'stub' }) {
  if (source === 'duffel') return <Badge variant="success">Duffel</Badge>;
  return <Badge variant="secondary">Demo</Badge>;
}

function OfferCard({ offer, bookAction }: { offer: FlightOffer; bookAction: (formData: FormData) => void }) {
  const first = offer.segments[0];
  const last = offer.segments[offer.segments.length - 1];
  const stops = Math.max(0, offer.segments.length - 1);
  const duration = fmtDuration(first?.duration);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">
                {first?.from ?? '--'}  {last?.to ?? '--'}
              </p>
              <OfferSourceBadge source={offer.source} />
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {first?.departureTime ? fmtTime(first.departureTime) : '--'} - {last?.arrivalTime ? fmtTime(last.arrivalTime) : '--'}
              </span>
              {duration ? (
                <span className="flex items-center gap-1">
                  <Plane className="h-3 w-3" />
                  {duration}
                </span>
              ) : null}
              <span>{stops === 0 ? 'Non-stop' : `${stops} stop${stops !== 1 ? 's' : ''}`}</span>
              <span className="font-medium text-foreground">
                {offer.totalPrice.currency} {offer.totalPrice.amount}
              </span>
            </div>
          </div>

          <form action={bookAction} className="shrink-0">
            <input type="hidden" name="offerId" value={offer.id} />
            <Button type="submit">Book Now</Button>
          </form>
        </div>

        {offer.segments.length > 0 && (
          <div className="mt-4 space-y-2 rounded-md border bg-muted/30 p-3">
            {offer.segments.map((seg, idx) => (
              <div key={`${offer.id}-${idx}`} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <span className="font-medium">{seg.marketingCarrier}{seg.flightNumber.replace(seg.marketingCarrier, '')}</span>
                  <span className="text-muted-foreground">  {seg.from}  {seg.to}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {fmtTime(seg.departureTime)} - {fmtTime(seg.arrivalTime)}
                  {seg.duration ? `  ${fmtDuration(seg.duration)}` : ''}
                  {seg.aircraft ? `  ${seg.aircraft}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface LoadMoreOffersProps {
  initialOffers: FlightOffer[];
  initialCursor?: string;
  searchInput: { origin: string; destination: string; departureDate: string; adults: number };
  bookAction: (formData: FormData) => void;
}

export function LoadMoreOffers({ initialOffers, initialCursor, searchInput, bookAction }: LoadMoreOffersProps) {
  const [offers, setOffers] = useState<FlightOffer[]>(initialOffers);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);

    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('session_token='))
        ?.split('=')[1];

      if (!token) return;

      const res = await searchFlights(token, {
        ...searchInput,
        limit: 10,
        after: cursor
      });

      setOffers((prev) => [...prev, ...res.offers]);
      setCursor(res.nextCursor);
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        {offers.length} flight{offers.length !== 1 ? 's' : ''} found
      </h2>
      <div className="grid gap-4">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} bookAction={bookAction} />
        ))}
      </div>

      {cursor && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" /> Load More
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
