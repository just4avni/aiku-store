import {NextResponse} from 'next/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {requireAdmin} from '@/lib/server-auth';
export const runtime='nodejs';
export async function POST(req:Request,{params}:{params:{id:string}}){
 const auth=await requireAdmin();if('error' in auth)return auth.error;
 try{const b=await req.json();const kind=b.kind==='thumbnail'?'thumbnail':'file';const filename=String(b.filename||'').replace(/[^a-zA-Z0-9._-]/g,'-');if(!filename)return NextResponse.json({error:'Filename required'},{status:400});
 const db=createAdminClient();const product=await db.from('products').select('id').eq('id',params.id).single();if(product.error)return NextResponse.json({error:'Product not found'},{status:404});
 const bucket=kind==='thumbnail'?'product-thumbnails':'products';const path=kind==='thumbnail'?`thumbnails/${params.id}-${crypto.randomUUID()}-${filename}`:`files/${params.id}/${crypto.randomUUID()}-${filename}`;
 const {data,error}=await db.storage.from(bucket).createSignedUploadUrl(path);if(error||!data)return NextResponse.json({error:error?.message||'Could not create upload URL'},{status:500});
 return NextResponse.json({bucket,path,token:data.token});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Upload URL failed'},{status:400})}
}
