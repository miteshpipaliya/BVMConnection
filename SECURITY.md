# Security notes

- Never commit `.env.local`; only publishable Supabase URL/key may use `NEXT_PUBLIC_`.
- Domain restrictions are validated server-side against `APPROVED_EMAIL_DOMAINS`.
- Supabase Auth performs password storage and verification. Confirm email OTP/link expiry and rate limits in Auth settings.
- PostgreSQL RLS is enabled for all tables in the initial migration. Treat policies as unreviewed until they pass adversarial tests against multiple accounts.
- Public feed access requires authentication. Post text has bounded length. React escapes text output.
- Baseline security headers are configured in `next.config.js`; a strict CSP, upload pipeline, and application-level rate limiting are not yet implemented.
- No service role key is used in application code.

Before launch: test cross-account access, block edge cases, policy recursion, message membership, admin elevation, storage, account deletion, request throttles and email enumeration behavior. Configure backup and restore drills.
