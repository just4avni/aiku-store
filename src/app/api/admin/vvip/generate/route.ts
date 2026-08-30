import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(req: Request) {
  const session = createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: role } = await session.from('admin_roles').select('role').eq('user_id', user.id).maybeSingle();
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const productId = String(body.productId || '');
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 100);
  if (!productId) return NextResponse.json({ error: 'Product is required' }, { status: 400 });
  const admin = createAdminClient();
  const rows = [];
  const plainKeys = [];
  for (let i = 0; i < count; i++) {
    const raw = `AIKU-VVIP-${crypto.randomUUID().replaceAll('-', '').slice(0, 4).toUpperCase()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
    plainKeys.push(raw);
    rows.push({ key_hash: await sha256(raw), key_prefix: raw.slice(0, 14), product_id: productId, created_by: user.id });
  }
  const { error } = await admin.from('vvip_keys').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ keys: plainKeys });
}
