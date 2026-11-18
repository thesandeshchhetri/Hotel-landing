# Thamel Heritage Hotel

A hotel website and reservation application built with React, TypeScript, Vite and Supabase.

## Features

- Hotel home, about, rooms, room details and team pages
- Room availability lookup for date ranges
- Reservation form with email OTP verification
- Booking confirmation page
- Admin area for rooms, bookings, team members and hotel information

## Tech stack

- React 18, TypeScript and Vite
- Tailwind CSS and Lucide icons
- Supabase PostgreSQL, Row Level Security and Edge Functions
- EmailJS client integration (legacy) and Resend Edge Function integration

## Local development

Requirements: Node.js 20+ and npm.

```bash
npm ci
cp .env.example .env
npm run dev
```

Set these frontend environment variables in `.env`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_EMAILJS_PUBLIC_KEY=
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
```

Only the Supabase anon/publishable key belongs in the browser. **Never put the Supabase service-role key or Resend API key in a VITE_ variable.**

## Supabase setup

1. Create a Supabase project and configure its URL and anon key in `.env`.
2. Apply the SQL migrations in `supabase/migrations` in filename order (or use the Supabase CLI).
3. Deploy the `send-otp` and `verify-otp` Edge Functions.
4. Configure the `RESEND_API_KEY` secret for the `send-otp` function and verify the sender domain with Resend.
5. Configure the site's allowed redirect URLs and authentication settings in Supabase.

### Provision an administrator

Admin login uses Supabase Auth. The user must exist in Supabase Auth and must have the trusted `app_metadata.role = admin` claim. Create the user through the Supabase Dashboard or a trusted server-side admin process, then assign the role through the Supabase Dashboard or a protected server-side operation.

For a one-time manual setup, an authorized project owner can use the Supabase SQL editor:

```sql
UPDATE auth.users
SET raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE email = 'your-admin-email@example.com';
```

Replace the email with the actual administrator account. Do not expose the service-role key or let users set their own app metadata.

The migration `20261118000100_admin_role_policies.sql` adds authenticated admin-role policies for the management tables. Existing projects must apply this migration before using the admin CRUD screens.

## Scripts

```bash
npm run dev       # Start Vite development server
npm run typecheck # Run TypeScript checks
npm run lint      # Run ESLint
npm run build     # Create production build
npm run preview   # Preview production build
```

## Important production checklist

This repository is an active starter project, not yet a production-certified booking platform.

- Review every Supabase RLS policy before accepting real customer data.
- The current initial migration contains a public booking SELECT policy. It exposes booking rows and must be replaced with a private confirmation flow before production.
- Review the OTP flow for server-side generation, rate limiting, attempt limits, expiry, and safe responses. Do not return OTP values to browsers or log them.
- The legacy EmailJS fallback reports success when email is not configured; configure a real mail provider and remove development fallbacks before launch.
- Validate booking prices, room inventory and date availability on the server; do not trust totals or status values supplied by the browser.
- Add payment processing only through a verified server-side payment workflow.

## Continuous integration

GitHub Actions runs the TypeScript check, lint and production build for pushes and pull requests targeting `main`.
