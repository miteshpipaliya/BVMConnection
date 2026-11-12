# Architecture

- Next.js App Router renders the public home and uses server-side Supabase session reads for feed retrieval.
- Browser Supabase client is used only for authenticated actions. Auth sessions are stored in secure Supabase SSR cookies.
- `/api/register` is the trust boundary for registration validation and the approved email domain allowlist. Supabase Auth sends verification email.
- PostgreSQL is the source of truth. The migration defines UUID keys, constraints, indexes and row-level security.
- Public-facing fields live in `profiles`; auth email/credentials remain in Supabase Auth. Enrollment verification is intentionally not inferred from email ownership.

The initial RLS migration is a starting point and requires an independent policy review. Admin tables have RLS enabled and no member policies; a hardened server-side admin authorization layer has not been built. Do not provision admin roles from a client.
