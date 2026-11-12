# Database notes

Apply `supabase/migrations/0001_initial.sql` to a development project. It creates profiles, posts/interactions, relationships, messaging, blogs, notifications, reporting, preferences, consent, and admin audit tables. It enables RLS and adds initial policies.

The frontend currently uses only `profiles` and `posts`. The remaining tables are schema groundwork. Storage policies, admin-only review RPCs, message-request workflows, notification fanout and safe account deletion are not implemented. Review every policy before production use; test against separate member and admin identities.
