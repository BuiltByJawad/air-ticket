import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  DUFFEL_ACCESS_TOKEN: z.string().optional()
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  return EnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    DUFFEL_ACCESS_TOKEN: process.env.DUFFEL_ACCESS_TOKEN
  });
}

export function isProduction(env: Env): boolean {
  return env.NODE_ENV === 'production';
}
