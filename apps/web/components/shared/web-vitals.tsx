'use client';

import { useEffect } from 'react';

type MetricName = 'FCP' | 'LCP' | 'CLS' | 'FID' | 'INP' | 'TTFB';

interface Metric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

function reportMetric(metric: Metric) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  }

  // Send to analytics endpoint (replace with real analytics integration)
  if (navigator.sendBeacon) {
    const url = '/api/vitals';
    const data = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      path: window.location.pathname,
    });
    navigator.sendBeacon(url, data);
  }
}

export function WebVitals() {
  useEffect(() => {
    import('next/web-vitals' as string).then((mod) => {
      const { onFCP, onLCP, onCLS, onFID, onINP, onTTFB } = mod as Record<string, (cb: (m: Metric) => void) => void>;
      onFCP?.(reportMetric);
      onLCP?.(reportMetric);
      onCLS?.(reportMetric);
      onFID?.(reportMetric);
      onINP?.(reportMetric);
      onTTFB?.(reportMetric);
    }).catch(() => {
      // next/web-vitals not available — skip silently
    });
  }, []);

  return null;
}
