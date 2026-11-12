# Database notes

Apply `supabase/migrations/0001_initial.sql` only to an isolated development Supabase project after reviewing it. It creates profiles, posts/interactions, relationships, messaging, blogs, notifications, reporting, preferences, consent, and admin audit tables, with initial RLS policies.

The current social UI uses local mock data and does not read or write these social tables. Supabase is retained for the existing authentication groundwork. Storage policies, admin-only review RPCs, message-request workflows, notification fanout and safe account deletion are not implemented. Review every policy before production use; test against separate member and admin identities.
