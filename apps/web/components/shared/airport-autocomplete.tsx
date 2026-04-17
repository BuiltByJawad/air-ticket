'use client';

import { useState, useRef, useEffect } from 'react';
import { PlaneTakeoff, PlaneLanding, X } from 'lucide-react';
import { searchAirports, type Airport } from '@/lib/data/airports';
import { cn } from '@/lib/utils';

interface AirportAutocompleteProps {
  id: string;
  name: string;
  label: string;
  icon: 'from' | 'to';
  value: string;
  onChange: (iata: string) => void;
  error?: string;
  placeholder?: string;
}

export function AirportAutocomplete({
  id,
  name,
  label,
  icon,
  value,
  onChange,
  error,
  placeholder = 'Search city or airport'
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Airport | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value → selected airport display
  useEffect(() => {
    if (value && (!selected || selected.iata !== value)) {
      const found = searchAirports(value, 1)[0] ?? null;
      setSelected(found);
      setQuery(found ? `${found.city} (${found.iata})` : value);
    } else if (!value) {
      setSelected(null);
      setQuery('');
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(text: string) {
    setQuery(text);
    if (text.length >= 1) {
      const matches = searchAirports(text, 8);
      setResults(matches);
      setOpen(matches.length > 0);
    } else {
      setResults([]);
      setOpen(false);
    }
    // Clear IATA if user clears/edits the text
    if (selected && !text.startsWith(selected.city)) {
      onChange('');
      setSelected(null);
    }
  }

  function selectAirport(airport: Airport) {
    setSelected(airport);
    setQuery(`${airport.city} (${airport.iata})`);
    onChange(airport.iata);
    setOpen(false);
  }

  function clearSelection() {
    setSelected(null);
    setQuery('');
    onChange('');
    setOpen(false);
  }

  const IconComponent = icon === 'from' ? PlaneTakeoff : PlaneLanding;

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="text-sm font-medium flex items-center gap-0.5 mb-1.5">
        {label}
        <span className="text-destructive">*</span>
      </label>
      <div className="relative">
        <IconComponent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (query.length >= 1 && results.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 pr-8 text-sm ring-offset-background',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            error && 'border-destructive'
          )}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <input type="hidden" name={name} value={value} />
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-64 overflow-y-auto">
          {results.map((airport) => (
            <button
              key={airport.iata}
              type="button"
              onClick={() => selectAirport(airport)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors',
                'border-b border-border last:border-b-0'
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-xs">
                {airport.iata}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{airport.city}, {airport.country}</p>
                <p className="text-xs text-muted-foreground truncate">{airport.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
