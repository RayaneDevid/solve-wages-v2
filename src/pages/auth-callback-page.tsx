import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { fetchMe } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { t } from '@/i18n';
import Spinner from '@/components/ui/spinner';

export default function AuthCallbackPage() {
  const tr = t();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError(tr.auth.accessDenied);
          return;
        }

        const user = await fetchMe();
        setUser(user);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : tr.auth.accessDenied;

        const axiosError = err as { response?: { data?: { error?: string } } };
        const serverMessage = axiosError.response?.data?.error;

        setError(serverMessage || message);
      }
    }

    handleCallback();
  }, [navigate, setUser, tr]);

  if (error) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-primary">
        <div className="orb orb-orange" />
        <div className="orb orb-amber" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-[0_0_20px_rgba(245,146,10,0.25)] transition-colors duration-150 hover:brightness-[1.1]"
          >
            {tr.common.back}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-primary">
      <div className="orb orb-orange" />
      <div className="orb orb-amber" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-text-secondary">{tr.common.loading}</p>
      </div>
    </div>
  );
}
