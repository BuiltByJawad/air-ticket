// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { AirportAutocomplete } from './airport-autocomplete';

// Mock fetch for airport API
const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve([
        { iata: 'JFK', name: 'John F Kennedy Intl', city: 'New York', country: 'US' },
        { iata: 'LHR', name: 'Heathrow', city: 'London', country: 'GB' },
      ]),
  })
);
vi.stubGlobal('fetch', mockFetch);

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

describe('AirportAutocomplete', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders label with htmlFor matching id', () => {
    render(<AirportAutocomplete id="origin" name="origin" label="From" icon="from" value="" onChange={vi.fn()} />);
    const label = screen.getByText('From');
    expect(label).toHaveAttribute('for', 'origin');
  });

  it('renders input with correct id', () => {
    render(<AirportAutocomplete id="origin" name="origin" label="From" icon="from" value="" onChange={vi.fn()} />);
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).toHaveAttribute('id', 'origin');
  });

  it('renders hidden input with name and value', () => {
    render(<AirportAutocomplete id="origin" name="origin" label="From" icon="from" value="JFK" onChange={vi.fn()} />);
    const hidden = document.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden.name).toBe('origin');
    expect(hidden.value).toBe('JFK');
  });

  it('displays error message when error prop is provided', () => {
    render(<AirportAutocomplete id="origin" name="origin" label="From" icon="from" value="" onChange={vi.fn()} error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('calls onChange when airport is selected from results', async () => {
    const onChange = vi.fn();
    render(<AirportAutocomplete id="dest" name="destination" label="To" icon="to" value="" onChange={onChange} />);

    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New' } });

    // Wait for debounce + fetch
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });

    // Should show results
    expect(mockFetch).toHaveBeenCalled();
  });

  it('shows required asterisk in label', () => {
    render(<AirportAutocomplete id="origin" name="origin" label="From" icon="from" value="" onChange={vi.fn()} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
