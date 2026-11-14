# Day 1 audit: known risks and blockers

## Day 2 development database verification

- Work is on `codex/day-2-database-foundation`, based on the verified GitHub `main` commit. The linked Supabase target is `BVMConnection-Dev` (`zbawecmnpintxxjaznrm`); the similarly named production project `BVMConnection` (`yvrjhgmwfbjjaqkwbqow`) was not modified.
- The dev project was empty before this work. Three ordered migrations are now applied there: `20261112185923_foundation_initial`, `20261112185928_secure_media_social_foundation`, and `20261112190458_harden_private_rls_helpers`. They create 22 public tables; RLS is enabled on all 22. No existing data or migration history was present to rewrite.
- Added transactional pgTAP RLS tests. All 13 assertions passed against the development DB using three synthetic authenticated student IDs, `authenticated`/`anon` roles, and JWT subject claims. The test transaction rolls back. The hosted `supabase test db --remote` runner itself could not start because Docker/Podman is unavailable; the same SQL suite was run directly using the linked CLI database connection and returned all 13 `ok` results.
- The `SECURITY DEFINER` helpers use an empty `search_path`, live in the non-exposed `private` schema, and have no `PUBLIC` or `anon` execute grants. Admin tables have no client table grants and explicit deny policies. The dev project did not contain `public.rls_auto_enable()` before or after the migrations. The prior Day 1 observation about a similarly named function was on the separate production project; that project was not accessed or changed in Day 2.
- The development database security advisor now reports no findings. Database lint reports no schema errors. Remaining performance advisor findings are documented: 18 unindexed foreign keys, 22 auth-function per-row RLS evaluation warnings, 6 currently unused indexes on the empty/new schema, and 2 tables with multiple permissive policies. These are performance advisories, not known authorization bypasses.
- `npm ci`, lint, typecheck, unit tests, production build, and `npm audit --audit-level=high` passed. The dependency audit reports six moderate findings in transitive ESLint/TypeScript tooling and zero high/critical findings. Full Git-history secret scan with Gitleaks 8.30.1 found no leaks. A raw scan of the generated `.next` build output had six false positives in Next.js cache/manifests; these are build artifacts, not tracked source. Source changes and migrations contain no credentials.
- GitHub Actions run 11 passed all three jobs (`quality`, `database`, and `secret-scan`). An active main-branch ruleset was verified: it requires PRs, prevents deletion and force-pushes, and requires linear history. Its required-status-check list is empty and it requires zero approvals, so requiring the three passing checks and at least one independent approval remains a repository-owner action. The integration exposes ruleset reads but no ruleset-write operation; the legacy protection endpoint returns 403. Collaborator grants also remain unverified. Those gaps prevent claiming the repository-security portion of Day 2 complete.

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
