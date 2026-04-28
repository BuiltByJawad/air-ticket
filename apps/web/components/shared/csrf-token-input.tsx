'use client';

import { useEffect, useState } from 'react';

let cachedToken: string | null = null;

export async function fetchCsrfToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const res = await fetch('/api/csrf');
  const data = await res.json();
  cachedToken = data.token as string;
  return cachedToken;
}

export function CsrfTokenInput() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    fetchCsrfToken().then(setToken);
  }, []);

  if (!token) return null;
  return <input type="hidden" name="_csrf" value={token} />;
}
