import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';

export async function GET() {
  const a = await requireAdmin();
  if ('error' in a) return a.error;
  const db = createAdminClient();
  const { data, error } = await db.from('product_files')
    .select('id,product_id,file_name,file_path,file_size,file_type,storage_bucket,is_primary,created_at,product:products(name,slug,direct_download_url)')
    .order('created_at', { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ files: data || [] });
}

export async function DELETE(req: Request) {
  const a = await requireAdmin();
  if ('error' in a) return a.error;
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'File id is required' }, { status: 400 });
    const db = createAdminClient();
    const { data: file, error: findError } = await db.from('product_files')
      .select('id,product_id,file_path,storage_bucket').eq('id', id).maybeSingle();
    if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });
    if (!file) return NextResponse.json({ error: 'Uploaded file not found' }, { status: 404 });
    const bucket = file.storage_bucket || 'products';
    const { error: storageError } = await db.storage.from(bucket).remove([file.file_path]);
    if (storageError) return NextResponse.json({ error: `Storage delete failed: ${storageError.message}` }, { status: 500 });
    const { error: dbError } = await db.from('product_files').delete().eq('id', id);
    if (dbError) return NextResponse.json({ error: `Database delete failed: ${dbError.message}` }, { status: 500 });
    await db.from('security_logs').insert({
      event_type: 'uploaded_file_deleted', severity: 'warning', user_id: a.user.id, email: a.user.email,
      details: { file_id: id, product_id: file.product_id, bucket, path: file.file_path },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Delete failed' }, { status: 400 });
  }
}
