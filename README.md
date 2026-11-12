# BVMConnection

BVMConnection is a Next.js 15 and React 19 social networking frontend for the BVM student community.

## Run locally

1. Use Node.js 24 (`nvm use` reads `.nvmrc`).
2. Copy `.env.development.example` to `.env.local`. Leave integration values empty for the explicitly labeled local demo; configure only development credentials when exercising Supabase.
3. Run `npm ci`.
4. Run `npm run dev` and open `http://localhost:3000`.

## Current implementation

- Near-black responsive App Router shell with desktop navigation, mobile bottom navigation and a mobile section menu.
- Routed home, explore, communities, community details, reels, events, messages, conversations, notifications, bookmarks, connections, profiles, settings and post details.
- Shared typed mock state for post creation, feed filters, likes, replies, repost counts, follows, bookmarks, community membership, connection requests, event interest/attendance, messages and read notifications.
- Appropriate demo state persists in `localStorage`; uploaded previews use temporary object URLs that are revoked on cleanup.
- The feed and interactive social features are clearly labeled as local demo data and are not synced to Supabase.
- Supabase Auth registration, sign-in, email verification, SSR session cookies and the existing schema/security documentation are preserved. Firebase is not integrated.
- Protected App Router sections validate Supabase SSR sessions and confirmed email when Supabase is configured. Login supports safe in-app return paths; password recovery and reset pages are included.
- An incremental migration adds post-media and expiring story metadata, audience-aware media/story policies, fixes likes/comments reads to follow post visibility, restricts direct follows of private profiles, and limits the block lookup function.
- Environment docs include Supabase publishable-key naming and server-only R2 placeholders. Full-project ESLint and TypeScript scripts are available.
- GitHub Actions runs lint, strict typecheck, unit tests, `npm audit --audit-level=high`, production build and a full-history Gitleaks scan. Dependabot is configured for npm and Actions updates.

## Boundaries and remaining work

- Demo profiles, posts, conversations and event listings are examples. Do not enter real student data or treat demo actions as delivered, enforced or backend-persisted.
- The current Reels and stories use preview interactions rather than a production media pipeline. Story uploads, realtime chat, push notification delivery, admin moderation, institutional verification, privacy enforcement and rich connection workflows need further implementation.
- Supabase database schema is groundwork. The current demo social UI does not read or write social content in Supabase. Review RLS and configure approved email domains before using auth with real users.
- The connected Supabase BVMConnection project is active but currently has no public tables and no applied migrations. The repository migrations have not been applied or tested against it. The Supabase security advisor reports an exposed execute grant on its `public.rls_auto_enable()` event-trigger helper; review before launching.
- Branch protection could not be verified: GitHub lists no repository rulesets, while the branch-protection endpoint denies this integration access. Repository collaborators were not enumerable through the available connector. See [KNOWN_RISKS.md](KNOWN_RISKS.md).
- Staging credentials and Cloudflare R2 credentials are intentionally blank; `.env.staging.example` is a template only. R2 upload/delivery, real social persistence, message workflows, moderation, PWA, and automated multi-user RLS/E2E coverage remain unimplemented.

## Checks

- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run audit`
- `npm run build`
- Gitleaks 8.30.1 over all 3 commits (`no leaks found`)
