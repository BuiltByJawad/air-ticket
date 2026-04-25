// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { ThemeToggle } from './theme-toggle';

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', setTheme: vi.fn(), themes: ['light', 'dark', 'system'] })),
}));

import { useTheme } from 'next-themes';

describe('ThemeToggle', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders enabled button with light theme', async () => {
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({ theme: 'light', setTheme: mockSetTheme, themes: ['light', 'dark', 'system'] });

    await act(async () => {
      render(<ThemeToggle />);
    });

    const btn = screen.getByRole('button', { name: /toggle theme/i });
    expect(btn).not.toBeDisabled();

    fireEvent.click(btn);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('switches to light when theme is dark', async () => {
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({ theme: 'dark', setTheme: mockSetTheme, themes: ['light', 'dark', 'system'] });

    await act(async () => {
      render(<ThemeToggle />);
    });

    const btn = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(btn);
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('has aria-label on button', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });
});
