// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, it, expect, vi, beforeEach, type Assertion } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import axe from 'axe-core';
import { FormField } from './form-field';
import { ThemeToggle } from './theme-toggle';
import { BarChart, StatusBar } from './charts';

declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }
}

function toHaveNoViolations(received: axe.AxeResults, _: unknown) {
  const violations = received.violations;
  if (violations.length === 0) {
    return { pass: true, message: () => 'No accessibility violations found' };
  }
  const messages = violations.map((v: axe.Result) =>
    `- ${v.id}: ${v.description}\n  ${v.nodes.map((n: axe.NodeResult) => n.html).join('\n  ')}`
  );
  return {
    pass: false,
    message: () => `Accessibility violations found:\n${messages.join('\n')}`,
  };
}

expect.extend({ toHaveNoViolations });

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', setTheme: vi.fn(), themes: ['light', 'dark', 'system'] })),
}));

async function runAxe(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // Disable color-contrast in jsdom (no real rendering)
      'color-contrast': { enabled: false },
    },
  });
  return results;
}

describe('Accessibility Audit — FormField', () => {
  beforeEach(() => cleanup());

  it('has no axe violations with text input', async () => {
    const { container } = render(
      <FormField id="test-field" label="Test Label">
        <input id="test-field" type="text" />
      </FormField>
    );
    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no axe violations with error message', async () => {
    const { container } = render(
      <FormField id="err-field" label="With Error" error="Required">
        <input id="err-field" type="text" aria-invalid="true" />
      </FormField>
    );
    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility Audit — ThemeToggle', () => {
  beforeEach(() => cleanup());

  it('has no axe violations', async () => {
    const { container } = render(<ThemeToggle />);
    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility Audit — BarChart', () => {
  beforeEach(() => cleanup());

  it('has no axe violations with data', async () => {
    const { container } = render(
      <BarChart data={[{ label: 'Jan', value: 10 }, { label: 'Feb', value: 20 }]} />
    );
    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility Audit — StatusBar', () => {
  beforeEach(() => cleanup());

  it('has no axe violations', async () => {
    const { container } = render(
      <StatusBar items={[{ label: 'Active', value: 5, total: 10, color: 'green' }]} />
    );
    const results = await runAxe(container);
    expect(results).toHaveNoViolations();
  });
});
