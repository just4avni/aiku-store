import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/config';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } });
  const s = createServerClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) { return req.cookies.get(name)?.value; },
      set(name: string, value: string, options: CookieOptions) { req.cookies.set({ name, value, ...options }); res = NextResponse.next({ request: { headers: req.headers } }); res.cookies.set({ name, value, ...options }); },
      remove(name: string, options: CookieOptions) { req.cookies.set({ name, value: '', ...options }); res.cookies.set({ name, value: '', ...options }); },
    },
  });
  const { data: { user } } = await s.auth.getUser();
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login?next=/admin', req.url));
    const { data: a } = await s.from('admin_roles').select('role').eq('user_id', user.id).maybeSingle();
    if (!a) return NextResponse.redirect(new URL('/', req.url));
  }
  return res;
}
export const config = { matcher: ['/admin/:path*'] };
