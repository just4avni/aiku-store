import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const admin = createAdminClient();
  const { data: product } = await admin.from('products').select('id,name,access_type,is_active,deleted_at').eq('slug', params.slug).maybeSingle();
  if (!product || !product.is_active || product.deleted_at) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (product.access_type !== 'public' && !user) return NextResponse.json({ error: 'Please sign in to download this product.' }, { status: 401 });
  if (product.access_type === 'vvip' || product.access_type === 'premium') {
    const { data: entitlement } = await admin.from('entitlements').select('id,expires_at').eq('product_id', product.id).or(`user_id.eq.${user?.id || '00000000-0000-0000-0000-000000000000'},email.eq.${user?.email || ''}`).limit(1).maybeSingle();
    if (!entitlement || (entitlement.expires_at && new Date(entitlement.expires_at) < new Date())) return NextResponse.json({ error: 'You do not have access to this download.' }, { status: 403 });
  }
  const { data: file } = await admin.from('product_files').select('id,file_path,storage_bucket,file_name').eq('product_id', product.id).eq('is_primary', true).maybeSingle();
  if (!file) return NextResponse.json({ error: 'Download file has not been uploaded yet.' }, { status: 404 });
  const expires = 60 * 15;
  const { data: signed, error } = await admin.storage.from(file.storage_bucket).createSignedUrl(file.file_path, expires);
  if (error || !signed?.signedUrl) return NextResponse.json({ error: 'Could not create download link.' }, { status: 500 });
  await admin.rpc('increment_download_count', { p_product_id: product.id });
  await admin.from('download_logs').insert({ product_id: product.id, user_id: user?.id || null, email: user?.email || null, access_type: product.access_type, file_id: file.id, signed_url_expires_at: new Date(Date.now() + expires * 1000).toISOString() });
  return NextResponse.redirect(signed.signedUrl);
}
