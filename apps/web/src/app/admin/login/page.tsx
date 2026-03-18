import { AdminLoginForm } from '../../../components/admin-login-form';
import { Panel } from '../../../components/panel';

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-8">
      <div className="w-full max-w-lg">
        <Panel title="Admin Access" eyebrow="Internal Auth">
          <p className="mb-6 text-sm leading-7 text-slate-300">
            Use the configured admin email and Argon2 password hash to access ingestion health and analytics.
          </p>
          <AdminLoginForm />
        </Panel>
      </div>
    </main>
  );
}
