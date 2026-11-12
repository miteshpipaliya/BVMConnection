# Architecture

- Next.js App Router owns the public routes. `/` redirects to `/home` and social destinations use a shared shell with real URL navigation.
- `SocialShell` provides responsive navigation and a single `DemoProvider` for shared social data.
- `src/lib/demo-store.tsx` contains typed mock entities and browser-local persistence. `src/lib/demo-logic.ts` contains reusable feed selection and post interaction logic.
- Demo social content is separate from Supabase Auth and is not represented as database-persisted content.
- Supabase browser/server clients remain for the existing sign-in and registration flow. Sessions use Supabase SSR cookies.
- `/api/register` validates registration and the approved email domain allowlist on the server. Supabase Auth sends verification email.
- The SQL migration remains schema groundwork for a future backend connection; the current social demo does not read or mutate those social tables.

The initial RLS migration still needs independent review. Admin tables have RLS enabled and no member policies; a hardened server-side admin authorization layer has not been built. Do not provision admin roles from a client.
