/**
 * env.ts — Environment variable validation for SkillSwap
 *
 * Import this at the top of src/main.tsx (before anything else).
 * It throws immediately at startup if required variables are missing,
 * so you get a clear error instead of a mysterious runtime failure.
 *
 * Usage:
 *   import { env } from '@/utils/env'
 *   const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  STRIPE_PUBLISHABLE_KEY: string;
}

function validateEnv(): Env {
  const required: Array<[keyof Env, string]> = [
    ['SUPABASE_URL',          'VITE_SUPABASE_URL'],
    ['SUPABASE_ANON_KEY',     'VITE_SUPABASE_ANON_KEY'],
    ['STRIPE_PUBLISHABLE_KEY','VITE_STRIPE_PUBLISHABLE_KEY'],
  ];

  const missing: string[] = [];
  const values: Partial<Record<keyof Env, string>> = {};

  for (const [key, viteKey] of required) {
    const value = import.meta.env[viteKey] as string | undefined;
    if (!value || value.trim() === '') {
      missing.push(viteKey);
    } else {
      values[key] = value.trim();
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[SkillSwap] Missing required environment variables:\n` +
      missing.map(v => `  - ${v}`).join('\n') +
      `\n\nAdd them to your .env.local file (dev) or Vercel environment settings (prod).`
    );
  }

  return values as Env;
}

export const env = validateEnv();
