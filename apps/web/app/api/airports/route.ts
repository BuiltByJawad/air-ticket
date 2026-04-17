import { NextRequest, NextResponse } from 'next/server';
import { suggestAirports } from '@/lib/api/api-client';
import { getSessionToken } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json([], { status: 401 });
  }

  const query = request.nextUrl.searchParams.get('q') ?? '';
  if (!query || query.length < 1) {
    return NextResponse.json([]);
  }

  try {
    const results = await suggestAirports(token, query);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
