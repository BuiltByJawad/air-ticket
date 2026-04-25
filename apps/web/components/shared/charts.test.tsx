import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarChart, StatusBar } from './charts';

describe('BarChart', () => {
  it('renders nothing with empty data', () => {
    const { container } = render(<BarChart data={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders bars for each data item', () => {
    const data = [
      { label: 'Jan', value: 10 },
      { label: 'Feb', value: 20 },
    ];
    render(<BarChart data={data} />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('formats values with formatValue', () => {
    const data = [{ label: 'Total', value: 1500 }];
    render(<BarChart data={data} formatValue={(v) => `$${v}`} />);
    expect(screen.getByText('$1500')).toBeInTheDocument();
  });

  it('renders svg with rect elements', () => {
    const data = [
      { label: 'A', value: 5 },
      { label: 'B', value: 10 },
    ];
    const { container } = render(<BarChart data={data} />);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(2);
  });
});

describe('StatusBar', () => {
  it('renders status items with labels and percentages', () => {
    const items = [
      { label: 'Confirmed', value: 3, total: 10, color: 'green' },
      { label: 'Cancelled', value: 2, total: 10, color: 'red' },
    ];
    render(<StatusBar items={items} />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('handles zero total gracefully', () => {
    const items = [
      { label: 'None', value: 0, total: 0, color: 'gray' },
    ];
    render(<StatusBar items={items} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
