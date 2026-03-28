import { useNavigate } from 'react-router-dom';
import { Role } from '@/types';
import type { User } from '@/types';
import { ROLE_LABELS, PANEL_ACCESS_ROLES } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';
import { t } from '@/i18n';
import Badge from '@/components/ui/badge';

function createFakeUser(role: Role): User {
  return {
    id: crypto.randomUUID(),
    supabase_auth_id: null,
    discord_id: '123456789',
    username: `Dev ${ROLE_LABELS[role]}`,
    avatar_url: null,
    role,
    roles: [role],
    is_active: true,
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export default function DevLoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const tr = t();

  const handleSelectRole = (role: Role) => {
    const fakeUser = createFakeUser(role);
    setUser(fakeUser);
    navigate('/dashboard', { replace: true });
  };

  const panelRoles = Object.values(Role).filter((r) => PANEL_ACCESS_ROLES.includes(r));
  const otherRoles = Object.values(Role).filter((r) => !PANEL_ACCESS_ROLES.includes(r));

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="orb orb-orange" />
      <div className="orb orb-amber" />

      <div className="glass-elevated relative z-10 w-full max-w-md rounded-2xl p-8">
        {/* Dev mode banner */}
        <div className="mb-6 flex items-center justify-center">
          <Badge variant="warning" className="px-3 py-1 text-sm">
            {tr.auth.devMode}
          </Badge>
        </div>

        {/* Logo + title */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <img
            src="/logo.png"
            alt="Solve Paies"
            className="h-12 drop-shadow-[0_0_20px_rgba(245,146,10,0.35)]"
          />
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            {tr.auth.panelTitle}
          </h1>
        </div>

        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          {tr.auth.panelAccess}
        </p>
        <div className="mb-4 flex flex-col gap-1">
          {panelRoles.map((role) => (
            <button
              key={role}
              className="rounded-lg border border-border-secondary px-4 py-2.5 text-left text-sm text-text-primary transition-all duration-200 hover:bg-accent/5 hover:border-accent/20"
              onClick={() => handleSelectRole(role)}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>

        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
          {tr.auth.noPanelAccess}
        </p>
        <div className="flex flex-col gap-1">
          {otherRoles.map((role) => (
            <button
              key={role}
              className="rounded-lg border border-border-secondary px-4 py-2.5 text-left text-sm text-text-secondary transition-all duration-200 hover:bg-white/[0.03] hover:text-text-primary"
              onClick={() => handleSelectRole(role)}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
