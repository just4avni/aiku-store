-- Aiku Store v2 — Complete Database Schema
-- Run this in Supabase SQL Editor to initialize the project

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ADMIN ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT DEFAULT 'box',
    sort_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    thumbnail_url TEXT,
    version TEXT DEFAULT '1.0.0',
    file_size BIGINT,
    requirements TEXT,
    installation_instructions TEXT,
    changelog TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    access_type TEXT NOT NULL DEFAULT 'public' CHECK (access_type IN ('public', 'account', 'premium', 'vvip')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_access_type ON products(access_type);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_active ON products(is_active, deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_slug ON products(slug);

-- ============================================================
-- PRODUCT FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    storage_bucket TEXT DEFAULT 'products',
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_files_product ON product_files(product_id);

-- ============================================================
-- ENTITLEMENTS (User Access Grants)
-- ============================================================
CREATE TABLE IF NOT EXISTS entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    source TEXT DEFAULT 'manual', -- 'purchase', 'vvip', 'manual', 'promotion'
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_entitlements_user ON entitlements(user_id);
CREATE INDEX idx_entitlements_product ON entitlements(product_id);
CREATE INDEX idx_entitlements_email ON entitlements(email);

-- ============================================================
-- VVIP KEYS
-- ============================================================
CREATE TABLE IF NOT EXISTS vvip_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'revoked')),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    label TEXT,
    max_attempts INTEGER DEFAULT 5,
    attempt_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    redeemed_at TIMESTAMPTZ,
    redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    redeemed_email TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_vvip_keys_hash ON vvip_keys(key_hash);
CREATE INDEX idx_vvip_keys_status ON vvip_keys(status);
CREATE INDEX idx_vvip_keys_product ON vvip_keys(product_id);

-- ============================================================
-- REDEMPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vvip_key_id UUID NOT NULL REFERENCES vvip_keys(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_hash TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_redemptions_key ON redemptions(vvip_key_id);
CREATE INDEX idx_redemptions_user ON redemptions(user_id);
CREATE INDEX idx_redemptions_email ON redemptions(email);

-- ============================================================
-- DOWNLOAD LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS download_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    access_type TEXT NOT NULL,
    file_id UUID REFERENCES product_files(id) ON DELETE SET NULL,
    downloaded_at TIMESTAMPTZ DEFAULT NOW(),
    ip_hash TEXT,
    user_agent TEXT,
    signed_url_expires_at TIMESTAMPTZ
);

CREATE INDEX idx_download_logs_product ON download_logs(product_id);
CREATE INDEX idx_download_logs_user ON download_logs(user_id);
CREATE INDEX idx_download_logs_date ON download_logs(downloaded_at);

-- ============================================================
-- SECURITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT,
    details JSONB DEFAULT '{}',
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_logs_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);
CREATE INDEX idx_security_logs_created ON security_logs(created_at);

-- ============================================================
-- SITE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    json_value JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Insert default settings
INSERT INTO site_settings (key, value) VALUES
    ('store_name', 'Aiku Store'),
    ('store_description', 'Premium digital assets marketplace'),
    ('telegram_username', '@ebpff'),
    ('maintenance_mode', 'false'),
    ('default_download_expiry_minutes', '15'),
    ('vvip_key_prefix', 'AIKU-VVIP')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admin Roles
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin roles viewable by admins" 
    ON admin_roles FOR SELECT 
    USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()));

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" 
    ON categories FOR SELECT USING (true);

CREATE POLICY "Only admins can manage categories" 
    ON categories FOR ALL 
    USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()));

-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are viewable by everyone" 
    ON products FOR SELECT 
    USING (is_active = TRUE AND deleted_at IS NULL);

CREATE POLICY "Only admins can manage products" 
    ON products FOR ALL 
    USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()));

-- Product Files
ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product files viewable by everyone" 
    ON product_files FOR SELECT USING (true);

CREATE POLICY "Only admins can manage product files" 
    ON product_files FOR ALL 
    USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()));

-- Entitlements
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlements" 
    ON entitlements FOR SELECT 
    USING (auth.uid() = user_id OR auth.uid() IS NULL AND email = current_setting('app.current_email', true));

CREATE POLICY "Only admins can manage entitlements" 
    ON entitlements FOR ALL 
    USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()));

-- VVIP Keys
ALTER TABLE vvip_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view VVIP keys" 
    ON vvip_keys FOR SELECT 
    USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()));

CREATE POLICY "Only admins can manage VVIP keys" 
    ON vvip_keys FOR ALL 
    USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()));

-- Redemptions
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions" 
    ON redemptions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage redemptions" 
    ON redemptions FOR ALL 
    USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()));

-- Download Logs
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own download logs" 
    ON download_logs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage download logs" 
    ON download_logs FOR ALL 
    USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()));

-- Security Logs
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security logs" 
    ON security_logs FOR SELECT 
    USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()));

CREATE POLICY "Only admins can manage security logs" 
    ON security_logs FOR ALL 
    USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()));

-- Site Settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by everyone" 
    ON site_settings FOR SELECT USING (true);

CREATE POLICY "Only admins can manage settings" 
    ON site_settings FOR ALL 
    USING (EXISTS (SELECT 1 FROM admin_roles ar WHERE ar.user_id = auth.uid()));

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic VVIP redemption
CREATE OR REPLACE FUNCTION public.redeem_vvip_key(
    p_key_hash TEXT,
    p_email TEXT,
    p_user_id UUID DEFAULT NULL,
    p_ip_hash TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    product_id UUID,
    product_name TEXT,
    product_slug TEXT
) AS $$
DECLARE
    v_key_record RECORD;
    v_product_record RECORD;
BEGIN
    -- Lock the key row for update
    SELECT * INTO v_key_record
    FROM vvip_keys
    WHERE key_hash = p_key_hash
    FOR UPDATE;

    -- Validate key exists
    IF v_key_record IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Invalid key. Please check and try again.', NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- Check if already redeemed
    IF v_key_record.status = 'redeemed' THEN
        RETURN QUERY SELECT FALSE, 'This key has already been redeemed.', NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- Check if revoked
    IF v_key_record.status = 'revoked' THEN
        RETURN QUERY SELECT FALSE, 'This key has been revoked.', NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- Check expiration
    IF v_key_record.expires_at IS NOT NULL AND v_key_record.expires_at < NOW() THEN
        UPDATE vvip_keys SET status = 'expired' WHERE id = v_key_record.id;
        RETURN QUERY SELECT FALSE, 'This key has expired.', NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- Check max attempts
    IF v_key_record.attempt_count >= v_key_record.max_attempts THEN
        RETURN QUERY SELECT FALSE, 'Too many failed attempts. Key is locked.', NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- Get product info
    SELECT * INTO v_product_record
    FROM products
    WHERE id = v_key_record.product_id;

    IF v_product_record IS NULL OR v_product_record.deleted_at IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, 'Product not found.', NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    -- Mark key as redeemed
    UPDATE vvip_keys SET
        status = 'redeemed',
        redeemed_at = NOW(),
        redeemed_by = p_user_id,
        redeemed_email = p_email,
        attempt_count = attempt_count + 1
    WHERE id = v_key_record.id;

    -- Create entitlement
    INSERT INTO entitlements (user_id, email, product_id, access_type, source, metadata)
    VALUES (p_user_id, p_email, v_key_record.product_id, 'vvip', 'vvip', 
        jsonb_build_object('vvip_key_id', v_key_record.id));

    -- Log redemption
    INSERT INTO redemptions (vvip_key_id, user_id, email, product_id, ip_hash, user_agent, success)
    VALUES (v_key_record.id, p_user_id, p_email, v_key_record.product_id, p_ip_hash, p_user_agent, TRUE);

    -- Log security event
    INSERT INTO security_logs (event_type, severity, user_id, email, details, ip_hash, user_agent)
    VALUES ('vvip_redeemed', 'info', p_user_id, p_email, 
        jsonb_build_object('product_id', v_key_record.product_id, 'key_id', v_key_record.id),
        p_ip_hash, p_user_agent);

    RETURN QUERY SELECT TRUE, 'Key redeemed successfully!', v_product_record.id, v_product_record.name, v_product_record.slug;
END;
$$ LANGUAGE plpgsql;

-- Increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE products SET download_count = download_count + 1 WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log security event helper
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_severity TEXT,
    p_user_id UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_ip_hash TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO security_logs (event_type, severity, user_id, email, details, ip_hash, user_agent)
    VALUES (p_event_type, p_severity, p_user_id, p_email, p_details, p_ip_hash, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DEMO DATA
-- ============================================================

-- Insert demo categories
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
    ('Gaming', 'gaming', 'Game mods, assets, and utilities', 'gamepad-2', 1),
    ('Tools', 'tools', 'Productivity and development tools', 'wrench', 2),
    ('Resources', 'resources', 'Digital resources and libraries', 'library', 3),
    ('Templates', 'templates', 'Design and code templates', 'layout', 4),
    ('Presets', 'presets', 'Configuration presets and profiles', 'sliders', 5),
    ('Software', 'software', 'Applications and utilities', 'cpu', 6),
    ('Mods', 'mods', 'Game modifications and enhancements', 'puzzle', 7)
ON CONFLICT (slug) DO NOTHING;

-- Insert demo products (file paths are placeholders — upload real files via admin)
INSERT INTO products (name, slug, short_description, description, category_id, version, price, access_type, is_featured, is_active, requirements) VALUES
    ('Pro Gaming Toolkit', 'pro-gaming-toolkit', 'Essential utilities for competitive gaming', 'A comprehensive collection of gaming utilities designed for competitive players. Includes performance optimizers, custom HUDs, and advanced configuration tools.', (SELECT id FROM categories WHERE slug = 'gaming'), '2.1.0', 0, 'public', TRUE, TRUE, 'Windows 10/11, 8GB RAM'),
    ('DevStack Pro', 'devstack-pro', 'Complete development environment setup', 'Pre-configured development stack with Docker containers, CI/CD pipelines, and production-ready templates. Save hours of setup time.', (SELECT id FROM categories WHERE slug = 'tools'), '3.0.0', 29.99, 'premium', TRUE, TRUE, 'Docker, Node.js 18+'),
    ('Cinematic LUT Pack', 'cinematic-lut-pack', 'Professional color grading presets', '50+ cinematic LUTs for video editors and photographers. Compatible with Premiere Pro, DaVinci Resolve, and Final Cut Pro.', (SELECT id FROM categories WHERE slug = 'presets'), '1.5.0', 0, 'account', TRUE, TRUE, 'Any video editor supporting .cube files'),
    ('Ultimate Mod Collection', 'ultimate-mod-collection', 'Exclusive game modification bundle', 'Curated collection of premium game modifications. Includes visual enhancements, gameplay tweaks, and custom content packs.', (SELECT id FROM categories WHERE slug = 'mods'), '4.2.0', 0, 'vvip', TRUE, TRUE, 'Varies by mod — see documentation'),
    ('UI Component Library', 'ui-component-library', 'Modern React component system', 'Production-ready React components with TypeScript, Tailwind CSS, and full accessibility support. Includes 50+ components with documentation.', (SELECT id FROM categories WHERE slug = 'templates'), '1.0.0', 0, 'public', TRUE, TRUE, 'React 18+, Tailwind CSS 3+'),
    ('Asset Vault Pro', 'asset-vault-pro', 'Premium digital asset collection', 'Over 10,000 high-quality digital assets including textures, 3D models, sound effects, and vector graphics. Organized and tagged for easy discovery.', (SELECT id FROM categories WHERE slug = 'resources'), '2.0.0', 49.99, 'premium', TRUE, TRUE, 'Any design software')
ON CONFLICT (slug) DO NOTHING;

-- Update product thumbnails to use placeholder (admin should upload real images)
UPDATE products SET thumbnail_url = '/api/placeholder/400/320' WHERE thumbnail_url IS NULL;
