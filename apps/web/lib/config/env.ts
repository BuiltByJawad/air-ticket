import { z } from 'zod';

const envSchema = z.object({
  API_BASE_URL: z.string().url(),
  SESSION_COOKIE_NAME: z.string().min(1).default('air_ticket_session'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type WebEnv = z.infer<typeof envSchema>;

let env: WebEnv;

export function loadWebEnv(): WebEnv {
  if (env) return env;

  const result = envSchema.safeParse({
    API_BASE_URL: process.env.API_BASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMsg = Object.entries(errors)
      .map(([key, val]) => `${key}: ${val?.join(', ')}`)
      .join('; ');
    
    throw new Error(`Environment validation failed: ${errorMsg}`);
  }

  env = result.data;
  return env;
}

// Fail fast at startup if critical env variables are missing
if (process.env.NODE_ENV !== 'test') {
  try {
    loadWebEnv();
  } catch (err) {
    console.error(err instanceof Error ? err.message : 'Unknown environment validation error');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}
