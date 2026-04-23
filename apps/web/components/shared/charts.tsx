'use client';

interface BarChartProps {
  data: { label: string; value: number; subtitle?: string }[];
  formatValue?: (v: number) => string;
  color?: string;
}

export function BarChart({ data, formatValue, color = 'hsl(var(--primary))' }: BarChartProps) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="space-y-2">
      <svg viewBox="0 0 100 50" className="w-full" preserveAspectRatio="none">
        {data.map((d, i) => {
          const height = (d.value / maxVal) * 40;
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          return (
            <rect
              key={d.label}
              x={x}
              y={48 - height}
              width={w}
              height={height}
              fill={color}
              rx={0.5}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>
      <div className="flex" style={{ gap: 0 }}>
        {data.map((d) => (
          <div
            key={d.label}
            className="flex-1 text-center"
            style={{ minWidth: 0 }}
          >
            <p className="text-xs font-medium truncate">{d.label}</p>
            <p className="text-xs text-muted-foreground">
              {formatValue ? formatValue(d.value) : d.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StatusBarProps {
  items: { label: string; value: number; total: number; color: string }[];
}

export function StatusBar({ items }: StatusBarProps) {
  return (
    <div className="space-y-3">
      {items.map((s) => {
        const pct = s.total > 0 ? Math.round((s.value / s.total) * 100) : 0;
        return (
          <div key={s.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{s.label}</span>
                <span className="text-muted-foreground">{s.value}</span>
              </div>
              <span className="text-xs text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: s.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
