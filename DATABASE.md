# Database notes

Apply `supabase/migrations/0001_initial.sql` only to an isolated development Supabase project after reviewing it. It creates profiles, posts/interactions, relationships, messaging, blogs, notifications, reporting, preferences, consent, and admin audit tables, with initial RLS policies.

The incremental migration `20261112140010_secure_media_social_foundation.sql` adds post media metadata, stories and story views, narrows likes/comments reads to visible posts, prevents direct follows of private profiles, and constrains the block-check function. Media binaries remain outside Postgres. The migration is prepared but has not been applied because no project connection/credentials are configured here. Storage policies and the private R2 adapter, admin review RPCs, message-request workflows, notification fanout and safe account deletion are not implemented. Review every policy before production use; test against separate member and admin identities.
