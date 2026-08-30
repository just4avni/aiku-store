import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/ProductCard';
export const dynamic = 'force-dynamic';
export default async function Store({searchParams}:{searchParams:{category?:string}}){
  const supabase=createClient();
  const categorySlug=searchParams?.category; const [{data:allProducts},{data:categories}]=await Promise.all([
    supabase.from('products').select('*,category:categories(*)').eq('is_active',true).is('deleted_at',null).order('is_featured',{ascending:false}).order('created_at',{ascending:false}),
    supabase.from('categories').select('*').eq('is_visible',true).order('sort_order')
  ]);
  const products=categorySlug ? (allProducts??[]).filter(p=>p.category?.slug===categorySlug) : (allProducts??[]);
  return <main className="min-h-screen bg-aiku-bg px-5 py-10"><div className="mx-auto max-w-7xl"><Link href="/" className="text-aiku-accent">← Aiku Store</Link><div className="mb-8 mt-10"><h1 className="text-4xl font-black">Store</h1><p className="mt-2 text-zinc-500">Browse the catalog.</p></div><div className="mb-8 flex gap-2 overflow-x-auto pb-2">{(categories??[]).map(c=><Link key={c.id} href={`/store?category=${c.slug}`} className="shrink-0 rounded-full border border-white/10 bg-white/[.025] px-4 py-2 text-sm text-zinc-400 hover:border-aiku-accent/30 hover:text-aiku-accent">{c.name}</Link>)}</div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{(products??[]).map(p=><ProductCard key={p.id} product={p}/>)}</div>{!products?.length&&<div className="rounded-2xl border border-white/10 p-10 text-center text-zinc-500">No products available yet.</div>}</div></main>
}
