// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { DatePicker } from './date-picker';

describe('DatePicker', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders with placeholder text when no value', () => {
    render(<DatePicker id="test-date" name="testDate" />);
    expect(screen.getByText('Select date')).toBeInTheDocument();
  });

  it('renders formatted date when value provided', () => {
    render(<DatePicker id="test-date" name="testDate" value="2025-06-15" />);
    expect(screen.getByText(/Jun/)).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('renders hidden input with name and value', () => {
    render(<DatePicker id="test-date" name="departureDate" value="2025-06-15" />);
    const hidden = document.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden).toBeTruthy();
    expect(hidden.name).toBe('departureDate');
    expect(hidden.value).toBe('2025-06-15');
  });

  it('renders button with correct id', () => {
    render(<DatePicker id="my-date" name="date" />);
    const btn = screen.getByRole('button', { name: /select date/i });
    expect(btn).toHaveAttribute('id', 'my-date');
  });

  it('applies error border when error prop is true', () => {
    render(<DatePicker id="err-date" name="date" error />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('border-destructive');
  });

  it('opens calendar popup on click', () => {
    render(<DatePicker id="cal-date" name="date" />);
    const btn = screen.getByRole('button');
    expect(screen.queryByText('Su')).not.toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.getByText('Su')).toBeInTheDocument();
  });

  it('renders month navigation buttons with aria-labels', () => {
    render(<DatePicker id="nav-date" name="date" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
    expect(screen.getByLabelText('Next month')).toBeInTheDocument();
  });
});
