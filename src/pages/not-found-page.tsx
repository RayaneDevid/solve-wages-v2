import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { t } from '@/i18n';

export default function NotFoundPage() {
  const tr = t();
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="orb orb-orange" />
      <div className="orb orb-amber" />
      <div className="glass-elevated relative z-10 flex w-full max-w-[400px] flex-col items-center gap-5 rounded-2xl p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <FileQuestion className="h-6 w-6 text-accent" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">
            {tr.common.pageNotFound}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            {tr.common.pageNotFoundDescription}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-[0_0_16px_rgba(245,146,10,0.2)] transition-all duration-200 hover:brightness-110"
        >
          <ArrowLeft className="h-4 w-4" />
          {tr.common.backToDashboard}
        </button>
      </div>
    </div>
  );
}
