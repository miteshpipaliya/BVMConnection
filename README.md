# BVMConnection

A Next.js and TypeScript social networking frontend for BVM students. The current home screen includes a responsive campus feed, local mock posts, post creation, likes, bookmarks, search, story previews, campus trends, and community join controls.

## Quick start

1. Use Node.js 20.9+ and npm.
2. Install dependencies with `npm ci`.
3. Run `npm run dev` and open `http://localhost:3000`.

## Current project state

- The main social feed is a client-side demo backed by local mock state; changes reset when the page reloads.
- Login and registration routes from the existing project remain and use the Supabase setup described in `.env.example` and `ARCHITECTURE.md`.
- Firebase is not integrated.
- Several destinations currently show demo panels; messaging, events, reels, moderation, onboarding, and the full student directory still need implementation before launch.
- Do not enter real student data or treat the mock interactions as persistent or enforceable.

## Checks

- `npm run build`
- `npm run lint` (currently scoped to the updated home feed)
- `npx tsc --noEmit`
