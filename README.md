# Aiku Store

A premium digital asset marketplace built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Premium Digital Marketplace** — Browse, search, and access high-quality digital assets
- **VVIP One-Time Key System** — Secure atomic redemption with cryptographically generated keys
- **Multi-Level Access Control** — Public, Account, Premium, and VVIP access types
- **Secure Downloads** — Signed URLs with short expiration for protected content
- **Admin Dashboard** — Professional SaaS-style management panel with analytics
- **Responsive Design** — Mobile-first, premium dark UI
- **Row Level Security** — PostgreSQL RLS policies for data protection
- **Audit Logging** — Security event tracking
- **Rate Limiting** — Anti-abuse protections

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth with RLS
- **Storage**: Supabase Storage
- **Deployment**: Vercel-ready

## Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd aiku-store
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → New Query
3. Copy the contents of `supabase/schema.sql`
4. Run the SQL to create all tables, indexes, RLS policies, and functions
5. Go to Storage → New Bucket → Create `products` bucket
6. Set bucket to private

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials from Project Settings → API.

**Important**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Create Admin User

1. Sign up at `/signup`
2. In Supabase SQL Editor, run:
   ```sql
   INSERT INTO admin_roles (user_id, role)
   VALUES ('your-user-id', 'superadmin');
   ```

## Database Schema

### Core Tables

- `profiles` — User profiles linked to auth.users
- `products` — Digital products with metadata
- `categories` — Dynamic product categories
- `product_files` — File references for products
- `entitlements` — User access grants
- `vvip_keys` — Secure one-time redemption keys
- `redemptions` — VVIP redemption records
- `download_logs` — Download tracking
- `security_logs` — Audit trail
- `admin_roles` — Admin permission management
- `site_settings` — Configurable store settings

### Security

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Admin access is server-side verified
- VVIP redemption uses atomic database transactions
- Keys are stored as secure hashes

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel Dashboard
4. Deploy

### Important Notes

- Set `NEXT_PUBLIC_SITE_URL` to your production domain
- Ensure Supabase RLS policies are active
- Verify storage bucket policies restrict direct access
- Enable email confirmation in Supabase Auth if desired

## License

Private — All rights reserved.
