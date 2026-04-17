'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PlaneTakeoff, PlaneLanding, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AirportSuggestion {
  iata: string;
  name: string;
  city: string;
  country: string;
}

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
  const [results, setResults] = useState<AirportSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AirportSuggestion | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync external value → selected airport display
  useEffect(() => {
    if (value && (!selected || selected.iata !== value)) {
      // We only have the IATA code from URL; show it as-is until user searches
      setSelected(null);
      setQuery(value);
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

  const fetchSuggestions = useCallback(async (text: string) => {
    if (!text || text.length < 1) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/airports?q=${encodeURIComponent(text)}`);
      const raw: AirportSuggestion[] = res.ok ? await res.json() : [];
      const seen = new Set<string>();
      const matches = raw.filter((a) => {
        if (seen.has(a.iata)) return false;
        seen.add(a.iata);
        return true;
      });
      setResults(matches);
      setOpen(matches.length > 0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(text: string) {
    setQuery(text);

    // Clear IATA if user edits the text
    if (selected && !text.startsWith(selected.city)) {
      onChange('');
      setSelected(null);
    }

    // Debounce API calls (300ms)
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300);
  }

  function selectAirport(airport: AirportSuggestion) {
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
        {loading && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {!loading && query && (
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
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-xl max-h-64 overflow-y-auto">
          {results.map((airport, idx) => (
            <button
              key={`${airport.iata}-${idx}`}
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
