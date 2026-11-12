'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const origin = window.location.origin;
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch {
      setError('We could not send a reset link. Check the address and try again.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page"><Link className="brand" href="/login"><span className="brand-mark">b</span><span>BVM<span className="brand-lite">Connection</span></span></Link><div className="auth-card"><span className="eyebrow purple">ACCOUNT RECOVERY</span><h1>{sent ? 'Check your inbox.' : 'Reset your password.'}</h1><p>{sent ? 'If an account matches that address, Supabase will send a secure reset link.' : 'Enter the email address associated with your account.'}</p>{!sent && <form onSubmit={submit} className="auth-form"><label>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button></form>}<p className="auth-foot"><Link href="/login">Return to log in</Link></p></div></main>;
}
