export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export type AccessType = 'public' | 'account' | 'premium' | 'vvip';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  category?: Category;
  thumbnail_url: string | null;
  version: string;
  file_size: number | null;
  requirements: string | null;
  installation_instructions: string | null;
  changelog: string | null;
  price: number;
  access_type: AccessType;
  is_featured: boolean;
  is_active: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductFile {
  id: string;
  product_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  storage_bucket: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Entitlement {
  id: string;
  user_id: string | null;
  email: string | null;
  product_id: string;
  product?: Product;
  access_type: string;
  granted_at: string;
  expires_at: string | null;
  source: string;
  metadata: Record<string, unknown>;
}

export interface VVIPKey {
  id: string;
  key_hash: string;
  key_prefix: string;
  status: 'active' | 'redeemed' | 'expired' | 'revoked';
  product_id: string;
  product?: Product;
  label: string | null;
  max_attempts: number;
  attempt_count: number;
  created_at: string;
  expires_at: string | null;
  redeemed_at: string | null;
  redeemed_by: string | null;
  redeemed_email: string | null;
  created_by: string | null;
}

export interface Redemption {
  id: string;
  vvip_key_id: string;
  user_id: string | null;
  email: string;
  product_id: string;
  product?: Product;
  redeemed_at: string;
  ip_hash: string | null;
  user_agent: string | null;
  success: boolean;
}

export interface DownloadLog {
  id: string;
  product_id: string;
  user_id: string | null;
  email: string | null;
  access_type: string;
  file_id: string | null;
  downloaded_at: string;
  ip_hash: string | null;
  user_agent: string | null;
}

export interface SecurityLog {
  id: string;
  event_type: string;
  severity: 'info' | 'warning' | 'critical';
  user_id: string | null;
  email: string | null;
  details: Record<string, unknown>;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  json_value: Record<string, unknown> | null;
  updated_at: string;
  updated_by: string | null;
}

export interface AdminRole {
  id: string;
  user_id: string;
  role: 'admin' | 'superadmin';
  created_at: string;
}

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_name: string | null;
  access_type: AccessType;
  thumbnail_url: string | null;
}
