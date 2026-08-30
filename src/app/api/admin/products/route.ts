import {NextResponse} from 'next/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {requireAdmin} from '@/lib/server-auth';
import {slugify} from '@/lib/utils';
export const runtime='nodejs';
export async function GET(){
  const auth=await requireAdmin(); if('error' in auth)return auth.error;
  const db=createAdminClient();
  const {data,error}=await db.from('products').select('*,category:categories(id,name,slug)').order('created_at',{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({products:data||[]});
}
export async function POST(req:Request){
  const auth=await requireAdmin(); if('error' in auth)return auth.error;
  try{
    const b=await req.json(); const name=String(b.name||'').trim(); if(!name)throw new Error('File name is required');
    const type=['public','vip','vvip'].includes(b.access_type)?b.access_type:'public'; const direct=String(b.direct_download_url||'').trim(); if(direct){const u=new URL(direct);if(!['http:','https:'].includes(u.protocol))throw new Error('Download URL must use http or https')}
    let slug=slugify(String(b.slug||name));
    const db=createAdminClient();
    const existing=await db.from('products').select('id').eq('slug',slug).maybeSingle(); if(existing.data)slug=`${slug}-${crypto.randomUUID().slice(0,6)}`;
    const {data:p,error}=await db.from('products').insert({name,slug,description:String(b.description||''),category_id:b.category_id||null,version:String(b.version||'1.0.0'),access_type:type,direct_download_url:direct||null,is_featured:Boolean(b.is_featured),is_active:true}).select('id,slug').single();
    if(error)throw new Error(error.message);
    await db.from('security_logs').insert({event_type:'product_created',severity:'info',user_id:auth.user.id,email:auth.user.email,details:{product_id:p.id,access_type:type}});
    return NextResponse.json({product:p});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Invalid request'},{status:400})}
}
