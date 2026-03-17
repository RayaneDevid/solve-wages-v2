import { useAuthStore } from '@/stores/auth.store';
import { t } from '@/i18n';

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const tr = t();

  if (!user) return null;

  const roleLabel = tr.roles[user.role as keyof typeof tr.roles];

  return (
    <header className="relative z-10 flex h-14 items-center justify-end border-b border-border-secondary bg-[rgba(15,12,45,0.3)] backdrop-blur-xl px-8">
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-text-primary">{roleLabel}</p>
        </div>
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.username}
            className="h-8 w-8 rounded-full ring-1 ring-border-secondary"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent ring-1 ring-accent/20">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
