// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { FormField } from './form-field';

describe('FormField', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders label with htmlFor matching id', () => {
    render(<FormField id="test-field" label="Name" />);
    const label = screen.getByText('Name');
    expect(label).toHaveAttribute('for', 'test-field');
  });

  it('renders default Input with matching id when no children', () => {
    render(<FormField id="test-field" label="Name" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'test-field');
  });

  it('renders children instead of default Input', () => {
    render(
      <FormField id="custom" label="Custom">
        <select id="custom" data-testid="custom-select">
          <option>A</option>
        </select>
      </FormField>
    );
    expect(screen.getByTestId('custom-select')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows required asterisk when required', () => {
    render(<FormField id="req" label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show asterisk when not required', () => {
    render(<FormField id="opt" label="Phone" />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<FormField id="err" label="Field" error="Invalid input" />);
    expect(screen.getByText('Invalid input')).toBeInTheDocument();
  });

  it('applies border-destructive class to default Input when error', () => {
    render(<FormField id="err" label="Field" error="Bad" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-destructive');
  });
});
