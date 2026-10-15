import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Log the web vitals to our structured logger
    logger.info('Web Vitals Metric', {
      metric: body,
      source: 'web-vitals-api'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to process web vitals', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
