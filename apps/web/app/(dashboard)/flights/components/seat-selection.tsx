'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, Check } from 'lucide-react';

interface SeatSelectionProps {
  passengers: any[];
  onComplete: (seats: Record<number, string>) => void;
  onBack: () => void;
}

export function SeatSelection({ passengers, onComplete, onBack }: SeatSelectionProps) {
  const [selectedSeats, setSelectedSeats] = useState<Record<number, string>>({});
  const [activePassengerIndex, setActivePassengerIndex] = useState(0);

  // Mock seat map: 10 rows (1-10), 6 seats per row (A-F)
  const rows = Array.from({ length: 10 }, (_, i) => i + 1);
  const seats = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  // Mock occupied seats
  const occupiedSeats = ['1A', '3C', '5E', '8B', '10F'];

  const handleSeatClick = (seatCode: string) => {
    if (occupiedSeats.includes(seatCode)) return;
    
    // If seat is already selected by another passenger, remove it from them
    const newSelectedSeats = { ...selectedSeats };
    Object.keys(newSelectedSeats).forEach((idx) => {
      if (newSelectedSeats[parseInt(idx)] === seatCode) {
        delete newSelectedSeats[parseInt(idx)];
      }
    });

    newSelectedSeats[activePassengerIndex] = seatCode;
    setSelectedSeats(newSelectedSeats);
    
    // Automatically move to next passenger if available
    if (activePassengerIndex < passengers.length - 1) {
      setActivePassengerIndex(activePassengerIndex + 1);
    }
  };

  const allSeatsSelected = Object.keys(selectedSeats).length === passengers.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {passengers.map((p, i) => (
          <Button
            key={i}
            variant={activePassengerIndex === i ? 'default' : 'outline'}
            className="flex items-center gap-2"
            onClick={() => setActivePassengerIndex(i)}
          >
            <User className="h-4 w-4" />
            <span className="max-w-[100px] truncate">{p.firstName}</span>
            {selectedSeats[i] && (
              <span className="ml-1 bg-primary-foreground text-primary rounded px-1 text-[10px]">
                {selectedSeats[i]}
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="flex justify-center overflow-auto py-4">
        <div className="grid gap-2">
          <div className="flex justify-center gap-2 mb-2">
            <div className="w-8" /> {/* Row number spacer */}
            {seats.map((s) => (
              <div key={s} className="w-8 text-center text-xs font-bold text-muted-foreground">
                {s}
              </div>
            ))}
          </div>

          {rows.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <div className="w-8 text-right text-xs font-bold text-muted-foreground mr-2">
                {r}
              </div>
              {seats.map((s) => {
                const seatCode = `${r}${s}`;
                const isOccupied = occupiedSeats.includes(seatCode);
                const isSelectedByCurrent = selectedSeats[activePassengerIndex] === seatCode;
                const isSelectedByOther = Object.entries(selectedSeats).some(
                  ([idx, code]) => parseInt(idx) !== activePassengerIndex && code === seatCode
                );

                return (
                  <button
                    key={s}
                    disabled={isOccupied}
                    onClick={() => handleSeatClick(seatCode)}
                    className={cn(
                      "w-8 h-8 rounded-t-lg border-2 transition-all flex items-center justify-center text-[10px] font-bold",
                      isOccupied && "bg-muted text-muted-foreground border-muted cursor-not-allowed",
                      !isOccupied && !isSelectedByCurrent && !isSelectedByOther && "hover:border-primary border-muted-foreground/30",
                      isSelectedByCurrent && "bg-primary border-primary text-primary-foreground",
                      isSelectedByOther && "bg-secondary border-secondary text-secondary-foreground"
                    )}
                  >
                    {isSelectedByCurrent ? <Check className="h-4 w-4" /> : seatCode}
                  </button>
                );
              })}
              {r === 5 && <div className="h-4" />} {/* Exit row spacer */}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          className="ml-auto" 
          disabled={!allSeatsSelected}
          onClick={() => onComplete(selectedSeats)}
        >
          Confirm Seats & Pay
        </Button>
      </div>
    </div>
  );
}
