export interface WebEnv {
  API_BASE_URL: string;
  SESSION_COOKIE_NAME: string;
  NODE_ENV: 'development' | 'test' | 'production';
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function loadWebEnv(): WebEnv {
  const apiBaseUrl = process.env.API_BASE_URL;
  if (!apiBaseUrl || !isValidUrl(apiBaseUrl)) {
    throw new Error('Missing or invalid API_BASE_URL');
  }

  const cookieName = process.env.SESSION_COOKIE_NAME;

  const nodeEnvRaw = process.env.NODE_ENV;
  const nodeEnv: WebEnv['NODE_ENV'] =
    nodeEnvRaw === 'production' || nodeEnvRaw === 'test' || nodeEnvRaw === 'development' ? nodeEnvRaw : 'development';

  return {
    API_BASE_URL: apiBaseUrl,
    SESSION_COOKIE_NAME: cookieName && cookieName.length > 0 ? cookieName : 'air_ticket_session',
    NODE_ENV: nodeEnv
  };
}

// Fail fast at startup if critical env variables are missing
if (process.env.NODE_ENV !== 'test') {
  try {
    loadWebEnv();
  } catch (err) {
    console.error('Environment validation failed:', err instanceof Error ? err.message : err);
  }
}
