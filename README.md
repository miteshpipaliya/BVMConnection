# BVMConnection

BVMConnection is a Next.js 15 and React 19 social networking frontend for the BVM student community.

## Run locally

1. Use Node.js 20.9+ and npm.
2. Run `npm ci`.
3. Run `npm run dev` and open `http://localhost:3000`.

## Current implementation

- Near-black responsive App Router shell with desktop navigation, mobile bottom navigation and a mobile section menu.
- Routed home, explore, communities, community details, reels, events, messages, conversations, notifications, bookmarks, connections, profiles, settings and post details.
- Shared typed mock state for post creation, feed filters, likes, replies, repost counts, follows, bookmarks, community membership, connection requests, event interest/attendance, messages and read notifications.
- Appropriate demo state persists in `localStorage`; uploaded previews use temporary object URLs that are revoked on cleanup.
- The feed and interactive social features are clearly labeled as local demo data and are not synced to Supabase.
- Supabase Auth registration, sign-in, email verification, SSR session cookies and the existing schema/security documentation are preserved. Firebase is not integrated.

## Boundaries and remaining work

- Demo profiles, posts, conversations and event listings are examples. Do not enter real student data or treat demo actions as delivered, enforced or backend-persisted.
- The current Reels and stories use preview interactions rather than a production media pipeline. Story uploads, realtime chat, push notification delivery, admin moderation, institutional verification, privacy enforcement and rich connection workflows need further implementation.
- Supabase database schema is groundwork. The current demo social UI does not read or write social content in Supabase. Review RLS and configure approved email domains before using auth with real users.

## Checks

- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
