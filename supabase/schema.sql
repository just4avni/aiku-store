-- AIKU STORE — production schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles(id,email,full_name)
  VALUES(NEW.id,NEW.email,NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK(role IN('admin','superadmin')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, slug text NOT NULL UNIQUE,
  description text, icon text DEFAULT 'box', sort_order int DEFAULT 0, is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE, description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL, thumbnail_url text, thumbnail_path text,
  version text NOT NULL DEFAULT '1.0.0', access_type text NOT NULL DEFAULT 'public' CHECK(access_type IN('public','vip','vvip')),
  direct_download_url text, is_active boolean NOT NULL DEFAULT true, is_featured boolean DEFAULT false,
  download_count bigint NOT NULL DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active,deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_access ON products(access_type);

CREATE TABLE IF NOT EXISTS product_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  file_name text NOT NULL, file_path text NOT NULL, file_size bigint, file_type text, storage_bucket text NOT NULL DEFAULT 'products',
  sort_order int DEFAULT 0, is_primary boolean DEFAULT true, created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_files_product ON product_files(product_id);

CREATE TABLE IF NOT EXISTS vip_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  key_hash text NOT NULL UNIQUE, key_prefix text NOT NULL, label text, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_vip_keys_product ON vip_keys(product_id);

CREATE TABLE IF NOT EXISTS vvip_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  email text NOT NULL, key_hash text NOT NULL UNIQUE, key_prefix text NOT NULL, label text,
  is_active boolean NOT NULL DEFAULT true, bound_ip inet, bound_at timestamptz, session_expires_at timestamptz,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_vvip_grants_product ON vvip_grants(product_id);
CREATE INDEX IF NOT EXISTS idx_vvip_grants_email ON vvip_grants(lower(email));

CREATE TABLE IF NOT EXISTS vvip_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), grant_id uuid NOT NULL REFERENCES vvip_grants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE, email text NOT NULL, ip inet NOT NULL,
  token_hash text NOT NULL UNIQUE, created_at timestamptz DEFAULT now(), expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vvip_sessions_lookup ON vvip_sessions(product_id,token_hash);

CREATE TABLE IF NOT EXISTS download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  file_id uuid REFERENCES product_files(id) ON DELETE SET NULL, email text, access_type text NOT NULL,
  downloaded_at timestamptz DEFAULT now(), ip inet, user_agent text
);
CREATE INDEX IF NOT EXISTS idx_download_logs_product ON download_logs(product_id);

CREATE TABLE IF NOT EXISTS security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_type text NOT NULL, severity text NOT NULL DEFAULT 'info',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, email text, details jsonb DEFAULT '{}', ip inet,
  user_agent text, created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text UNIQUE NOT NULL, value text, json_value jsonb,
  updated_at timestamptz DEFAULT now(), updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
INSERT INTO site_settings(key,value) VALUES('store_name','Aiku Store'),('telegram_username','@ebpff') ON CONFLICT(key) DO NOTHING;

-- Compatibility upgrades for an older Aiku schema.
ALTER TABLE products ADD COLUMN IF NOT EXISTS direct_download_url text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS thumbnail_path text;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_access_type_check;
UPDATE products SET access_type='vip' WHERE access_type IN('account','premium');
UPDATE products SET access_type='public' WHERE access_type IS NULL OR access_type NOT IN('public','vip','vvip');
ALTER TABLE products ADD CONSTRAINT products_access_type_check CHECK(access_type IN('public','vip','vvip'));
CREATE UNIQUE INDEX IF NOT EXISTS admin_roles_one_role_per_user ON admin_roles(user_id);
ALTER TABLE product_files ADD COLUMN IF NOT EXISTS storage_bucket text DEFAULT 'products';

CREATE OR REPLACE FUNCTION public.increment_download_count(p_product_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE products SET download_count=download_count+1, updated_at=now() WHERE id=p_product_id;
$$;

-- Storage buckets. Uploaded product files remain private; thumbnails are public.
INSERT INTO storage.buckets(id,name,public,file_size_limit) VALUES
 ('product-thumbnails','product-thumbnails',true,10485760),
 ('products','products',false,524288000)
ON CONFLICT(id) DO UPDATE SET public=EXCLUDED.public,file_size_limit=EXCLUDED.file_size_limit;

-- RLS. Public storefront can only read active non-deleted catalog data.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE vvip_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vvip_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_public_read ON products;
CREATE POLICY products_public_read ON products FOR SELECT USING(is_active=true AND deleted_at IS NULL);
DROP POLICY IF EXISTS categories_public_read ON categories;
CREATE POLICY categories_public_read ON categories FOR SELECT USING(is_visible=true);
DROP POLICY IF EXISTS product_files_public_read ON product_files;
CREATE POLICY product_files_public_read ON product_files FOR SELECT USING(EXISTS(SELECT 1 FROM products p WHERE p.id=product_id AND p.is_active=true AND p.deleted_at IS NULL));
DROP POLICY IF EXISTS profiles_self ON profiles;
CREATE POLICY profiles_self ON profiles FOR SELECT USING(auth.uid()=id);
DROP POLICY IF EXISTS admin_roles_self ON admin_roles;
CREATE POLICY admin_roles_self ON admin_roles FOR SELECT USING(auth.uid()=user_id);

DROP POLICY IF EXISTS storage_thumbnails_public_read ON storage.objects;
CREATE POLICY storage_thumbnails_public_read ON storage.objects FOR SELECT USING(bucket_id='product-thumbnails');

-- Admin writes are performed by the server using the service role. No service-role key is exposed to the browser.
