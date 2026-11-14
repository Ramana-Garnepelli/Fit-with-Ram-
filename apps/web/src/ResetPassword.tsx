import { useState } from 'react';
import { Dumbbell } from 'lucide-react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export default function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    if (password !== confirmation) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const response = await fetch(`${API}/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, new_password: password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? 'Reset link is invalid or expired.');
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to reset password'); }
    finally { setBusy(false); }
  }

  return <main className="portal-shell"><section className="login-card"><a className="brand" href="/"><span className="brand-mark"><Dumbbell size={18}/></span><span>FITWITH<span className="accent">RAM</span></span></a><span className="eyebrow">ACCOUNT SECURITY</span><h1>{done?'Password updated.':'Choose a new password.'}</h1>{done?<><p>You can now sign in with your new password.</p><a className="button-primary" href="/app">Go to sign in</a></>:<form className="trainer-form" onSubmit={submit}>{!token&&<div className="portal-error">Reset token is missing. Request a new password reset link.</div>}<label>New password<input type="password" required minLength={12} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirm new password<input type="password" required minLength={12} autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>{error&&<div className="portal-error">{error}</div>}<button className="button-primary" disabled={busy||!token}>{busy?'Updating…':'Reset password'}</button><small>Use at least 12 characters. Reset links expire after 30 minutes.</small></form>}</section></main>;
}
