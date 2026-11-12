# Day 1 audit: known risks and blockers

## Critical and high severity checks

- `npm audit` reports **0 high and 0 critical** findings. It reports six moderate transitive development dependency findings: `@typescript-eslint/*` and nested `minimatch` used by the ESLint configuration. They are documented and the CI gate fails on high or critical findings; Dependabot is enabled for weekly updates.
- Gitleaks 8.30.1 scanned all three commits in the available repository history and the current working tree. It reported no leaks. This does not prove that credentials were never exposed outside this Git history.

## Repository controls not verified

- The connected GitHub identity has `admin` permission on `miteshpipaliya/BVMConnection`; it is also the repository owner. A repository ruleset query returned an empty list. The branch-protection endpoint returned 403 (`Resource not accessible by integration`), so protection on `main` is unknown.
- The available connector could not enumerate collaborators. Least-privilege workflow permissions are implemented in the checked-in CI configuration, but collaborator grants have not been audited.
- Computer Use could not inspect GitHub settings because it could not determine the active browser URL. No GitHub security or branch-protection settings were changed.
- Required next repository settings: protect `main`, require pull requests and the `quality` and `secret-scan` checks, block force pushes and branch deletion, and restrict who can bypass those requirements. Confirm that the owner is the only necessary administrator and reduce stale access.

## Supabase and media

- The connected `BVMConnection` Supabase project is active (`ap-northeast-1`, PostgreSQL 17.11) but reports zero applied migrations and zero tables in the `public` schema. The two checked-in migrations have not been applied. No remote database writes were made in this audit.
- The Supabase security advisor reports that `anon` and `authenticated` can execute `public.rls_auto_enable()`, a `SECURITY DEFINER` event-trigger function. Its definition has a fixed `pg_catalog` search path and enables RLS on new public tables. The project owner should review whether the platform expects this grant before changing it.
- R2 account/access credentials are not configured. Staging examples are safe templates only; staging Supabase, R2 and Vercel environments have not been provisioned.

## Application risks

- The social application remains a local demo. `DemoProvider` contains fictional identities/content, and post, like, comment, bookmark, follow, messaging, notifications and settings interactions do not persist to Supabase. Do not use it for real student data or treat the interactions as production behavior.
- The app's social routes and components remain concentrated in a large `social-pages.tsx`; feature modules, real backend services, authenticated uploads, RLS integration tests, Playwright tests, moderation, account deletion, production error handling and PWA controls are still needed.
- There is only one shared demo data provider, but some story/reel UI state and browser-local settings are still demo-only. This is not equivalent to production persistence.
- Supabase migration SQL has not been linted or exercised against a local Postgres instance because Docker is unavailable. It requires review and tests on a separate development database before application.
