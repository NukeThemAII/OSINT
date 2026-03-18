'use client';

import { useRouter } from 'next/navigation';

export function AdminLogoutButton() {
  const router = useRouter();

  return (
    <button
      className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
      onClick={async () => {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'}/api/admin/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
        router.push('/admin/login');
        router.refresh();
      }}
      type="button"
    >
      Sign out
    </button>
  );
}
