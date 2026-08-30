import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function requireAdmin(){
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {error:NextResponse.json({error:'Unauthorized'},{status:401})};
  const {data:role}=await supabase.from('admin_roles').select('role').eq('user_id',user.id).maybeSingle();
  if(!role) return {error:NextResponse.json({error:'Forbidden'},{status:403})};
  return {user,role:role.role};
}
export function requestIp(req:Request){
  const x=req.headers.get('x-forwarded-for')||req.headers.get('x-real-ip')||'';
  return x.split(',')[0].trim()||'0.0.0.0';
}
export function userAgent(req:Request){return req.headers.get('user-agent')||'unknown';}
export async function sha256(value:string){
  const data=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return Array.from(new Uint8Array(data)).map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function randomKey(prefix='aiku', groups=1){
  const chars='abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes=new Uint8Array(groups*4); crypto.getRandomValues(bytes);
  const chunks=[]; for(let i=0;i<groups;i++){let s='';for(let j=0;j<4;j++)s+=chars[bytes[i*4+j]%chars.length];chunks.push(s)}
  return `${prefix}-${chunks.join('-')}`;
}
