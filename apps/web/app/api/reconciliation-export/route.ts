import { NextRequest, NextResponse } from 'next/server';
import { getSessionToken } from '@/lib/auth/session';
import { loadWebEnv } from '@/lib/config/env';

export async function GET(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const env = loadWebEnv();
  const url = new URL('/admin/reconciliation/export', env.API_BASE_URL);
  const agencyId = request.nextUrl.searchParams.get('agencyId');
  const fromDate = request.nextUrl.searchParams.get('fromDate');
  const toDate = request.nextUrl.searchParams.get('toDate');
  if (agencyId) url.searchParams.set('agencyId', agencyId);
  if (fromDate) url.searchParams.set('fromDate', fromDate);
  if (toDate) url.searchParams.set('toDate', toDate);

  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  if (!response.ok) {
    return NextResponse.json({ message: 'Failed to export reconciliation CSV' }, { status: response.status });
  }

  const csv = await response.text();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reconciliation-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
