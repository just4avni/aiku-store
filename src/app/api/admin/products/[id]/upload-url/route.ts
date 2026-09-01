import {NextResponse} from 'next/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {requireAdmin} from '@/lib/server-auth';
export const runtime='nodejs';

export async function POST(req:Request,{params}:{params:{id:string}}){
  const auth=await requireAdmin(); if('error' in auth)return auth.error;
  try{
    const b=await req.json();
    const kind=b.kind==='thumbnail'?'thumbnail':'file';
    const filename=String(b.filename||'').trim().replace(/[^a-zA-Z0-9._-]/g,'-');
    if(!filename)return NextResponse.json({error:'Filename is required.'},{status:400});
    const db=createAdminClient();
    const product=await db.from('products').select('id,name').eq('id',params.id).single();
    if(product.error||!product.data)return NextResponse.json({error:'Product not found.'},{status:404});

    const bucket=kind==='thumbnail'?'product-thumbnails':'products';
    const bucketOptions=kind==='thumbnail'
      ? {public:true,fileSizeLimit:10*1024*1024}
      : {public:false,fileSizeLimit:500*1024*1024};
    const existingBucket=await db.storage.getBucket(bucket);
    if(existingBucket.error){
      const created=await db.storage.createBucket(bucket,bucketOptions);
      if(created.error && !/already exists|duplicate/i.test(created.error.message||'')){
        return NextResponse.json({error:`Storage bucket \"${bucket}\" is unavailable. ${created.error.message}`},{status:500});
      }
    }

    const path=kind==='thumbnail'
      ? `thumbnails/${params.id}-${crypto.randomUUID()}-${filename}`
      : `files/${params.id}/${crypto.randomUUID()}-${filename}`;
    const {data,error}=await db.storage.from(bucket).createSignedUploadUrl(path);
    if(error||!data){
      return NextResponse.json({error:`Could not create upload URL for \"${bucket}\". ${error?.message||'Supabase returned no upload token.'}`},{status:500});
    }
    return NextResponse.json({bucket,path,token:data.token});
  }catch(e){
    const message=e instanceof Error?e.message:'Unknown upload setup error';
    return NextResponse.json({error:`Upload setup failed: ${message}`},{status:500});
  }
}
