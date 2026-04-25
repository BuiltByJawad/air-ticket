'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DatePickerProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  minDate?: string;
  className?: string;
  error?: boolean;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function DatePicker({
  id,
  name,
  value,
  defaultValue,
  onChange,
  minDate,
  className,
  error
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ?? defaultValue ?? '');
  const [viewYear, setViewYear] = useState(() => {
    const d = value ?? defaultValue;
    if (d) return new Date(d).getFullYear();
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value ?? defaultValue;
    if (d) return new Date(d).getMonth();
    return new Date().getMonth();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        e.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const today = new Date();
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  const minISO = minDate ?? todayISO;

  function selectDay(day: number) {
    const iso = toISO(viewYear, viewMonth, day);
    if (iso < minISO) return;
    setSelectedDate(iso);
    onChange?.(iso);
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const displayValue = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          'hover:bg-accent hover:text-accent-foreground',
          error && 'border-destructive',
          !selectedDate && 'text-muted-foreground'
        )}
      >
        <Calendar className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>{displayValue || 'Select date'}</span>
      </button>
      <input type="hidden" name={name} value={selectedDate} />

      {open && (
        <div role="dialog" aria-label="Choose a date" className="absolute z-50 mt-1 w-[calc(100vw-2rem)] max-w-72 rounded-lg border bg-popover p-3 shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth} type="button" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth} type="button" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-xs mb-1">
            {DAYS.map((d) => (
              <div key={d} className="py-1 font-medium text-muted-foreground">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-sm">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const iso = toISO(viewYear, viewMonth, day);
              const isDisabled = iso < minISO;
              const isSelected = iso === selectedDate;
              const isToday = iso === todayISO;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(day)}
                  aria-label={`${MONTHS[viewMonth]} ${day}, ${viewYear}`}
                  className={cn(
                    'h-8 w-8 rounded-md text-sm transition-colors mx-auto',
                    'hover:bg-accent hover:text-accent-foreground',
                    'disabled:text-muted-foreground/40 disabled:hover:bg-transparent disabled:cursor-not-allowed',
                    isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                    !isSelected && isToday && 'border border-primary/50',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
