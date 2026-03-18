'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'}/api/admin/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          if (!response.ok) {
            setError('Login failed. Verify the admin email and password hash configuration.');
            return;
          }
          router.push('/admin');
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Email</label>
        <input className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-sky-400" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
      </div>
      <div>
        <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-slate-400">Password</label>
        <input className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none focus:border-sky-400" value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
      </div>
      {error ? <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">{error}</div> : null}
      <button className="w-full rounded-2xl bg-sky-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-sky-300 disabled:opacity-60" type="submit" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
