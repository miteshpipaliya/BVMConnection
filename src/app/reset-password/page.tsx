'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Checking your recovery link…');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function establishRecoverySession() {
      const client = createClient();
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (active) { setError(true); setMessage('This reset link is invalid or has expired. Request another one.'); }
          return;
        }
      }
      const { data } = await client.auth.getUser();
      if (!active) return;
      if (data.user) { setReady(true); setMessage('Choose a new password with at least 12 characters.'); }
      else { setError(true); setMessage('This reset link is invalid or has expired. Request another one.'); }
    }
    establishRecoverySession().catch(() => { if (active) { setError(true); setMessage('Unable to verify this link. Request another one.'); } });
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(false);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    if (updateError) { setError(true); setMessage('The password could not be updated. Please try again.'); setBusy(false); return; }
    await createClient().auth.signOut();
    setReady(false); setMessage('Your password was updated. Log in with the new password.'); setBusy(false);
  }

  return <main className="auth-page"><Link className="brand" href="/login"><span className="brand-mark">b</span><span>BVM<span className="brand-lite">Connection</span></span></Link><div className="auth-card"><span className="eyebrow purple">PASSWORD RECOVERY</span><h1>Set a new password.</h1><p className={error ? 'form-error' : ''} role="status">{message}</p>{ready && <form onSubmit={submit} className="auth-form"><label>New password<input type="password" minLength={12} maxLength={128} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="primary-button full" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button></form>}<p className="auth-foot"><Link href="/forgot-password">Request another reset link</Link></p></div></main>;
}
