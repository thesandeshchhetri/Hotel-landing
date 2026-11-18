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
- Resend Edge Function email delivery

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
3. Deploy the `create-booking` and `verify-otp` Edge Functions. The legacy `send-otp` endpoint is disabled.
4. Configure Edge Function secrets: `RESEND_API_KEY`, `OTP_HASH_SECRET` (a random secret of at least 32 bytes), and optionally `BOOKING_FROM_EMAIL`. Verify the sender domain with Resend before production.
5. Configure the site's allowed redirect URLs and authentication settings in Supabase.
6. Apply the migration `20261118000200_secure_booking_and_otp.sql` before accepting bookings. It removes public booking reads/inserts and clears legacy plaintext OTP values.

Generate an OTP HMAC secret with `openssl rand -hex 32`, then set it as the Supabase Edge Function secret. Do not commit the secret or expose it in a `VITE_*` variable.

Example deployment commands:

```bash
supabase functions deploy create-booking
supabase functions deploy verify-otp
supabase functions deploy send-otp  # deploys the retired 410 response over any old deployed endpoint
supabase secrets set RESEND_API_KEY=your_resend_key OTP_HASH_SECRET=your_random_secret
```

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
- Apply the private-booking migration before launch; verify in Supabase that anonymous users cannot SELECT or INSERT booking rows and only admin-role users can read/manage them.
- The new OTP flow uses server-generated codes, HMAC digests, a 10-minute expiry and a five-attempt lock. Add edge/network-level abuse controls and monitor delivery failures before public launch.
- Configure and verify the Resend sender domain and set a strong `OTP_HASH_SECRET`; without these secrets the booking flow intentionally fails closed.
- Booking price and inventory are calculated server-side under a room-row lock; still test concurrent booking requests against your real inventory before production.
- Add payment processing only through a verified server-side payment workflow.

## Continuous integration

GitHub Actions runs the TypeScript check, lint and production build for pushes and pull requests targeting `main`.
