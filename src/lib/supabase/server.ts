import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export function createClient() {
  const c = cookies();
  return createServerClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) { return c.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { try { c.set({ name, value, ...options }); } catch {} },
        remove(name: string, options: CookieOptions) { try { c.set({ name, value: '', ...options }); } catch {} },
      },
    }
  );
}
