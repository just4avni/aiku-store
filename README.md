# Aiku Store

Aiku Store is a Next.js + Supabase digital download store with Normal, VIP and VVIP file access.

## Product types

- **Normal** — direct download or securely hosted upload.
- **VIP** — shared access key in `aiku-abc1` format; unlimited downloads while the key is active.
- **VVIP** — admin grants an email a key in `aiku-xxxx-xxxx-xxxx` format. On first validation the key is bound to the visitor IP for the selected expiry (59 minutes by default). Downloads are blocked after expiry or from another IP.

## Setup

1. Create/update the Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Create an admin Auth user and insert its `admin_roles` row, or use the admin setup script from the project package.
4. Add these Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose it to the browser)
5. Deploy the repository on Vercel.

Uploads use Supabase signed upload URLs so the browser sends large files directly to Supabase instead of through the Vercel function payload.
