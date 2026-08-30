export type AccessType = 'public' | 'vip' | 'vvip';
export interface Category { id:string; name:string; slug:string; description:string|null; icon:string; sort_order:number; is_visible:boolean; }
export interface Product { id:string; name:string; slug:string; description:string|null; category_id:string|null; category?:Category; thumbnail_url:string|null; thumbnail_path:string|null; version:string; access_type:AccessType; direct_download_url:string|null; is_active:boolean; is_featured:boolean; download_count:number; created_at:string; updated_at:string; deleted_at:string|null; }
export interface ProductFile { id:string; product_id:string; file_name:string; file_path:string; file_size:number|null; file_type:string|null; storage_bucket:string; is_primary:boolean; created_at:string; }
