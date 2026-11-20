# CampusConnect — Instagram-inspired student social demo

This is the **frontend-only CampusConnect** migration branch. It is designed to be moved into a **new GitHub repository named CampusConnect** without carrying over the old repository's Git history.

## What's included

- Responsive Instagram-inspired Home, Stories, Search, Reels, Profile, Saved, Messages, Notifications and Community interfaces.
- Demo posts, likes, comments, follower interactions and profile editing.
- Twelve example reels, viewport-based muted autoplay, click-to-unmute, sharing and local reel video preview.
- Create a demo photo post; preview a story from a browser-local file.
- Branch and division based classmate finder using clearly labeled sample profiles.

## Not connected to a database

**No Supabase client, middleware, database routes, migrations, or credentials are required.** Login and registration pages are local demonstration experiences, not real authentication. Data stored in localStorage is not private or protected by server authorization. Do not present demo privacy settings as production enforcement.

## Run

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

## Migration

Create a new GitHub repository named `CampusConnect`, and push a **fresh working tree without the old Git history**. Do not transfer existing Vercel database environment variables to the new Vercel project. Existing Supabase projects should not be deleted or altered. Permanently delete the old `BVMConnection` repository **only after** the new GitHub repository and deployment have been verified.
