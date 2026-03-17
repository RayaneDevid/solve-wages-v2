import { t } from '@/i18n';
import { POLE_LABELS } from '@/lib/constants';
import type { Pole } from '@/types';

interface PoleSummary {
  pole: Pole;
  total: number;
  count: number;
}

interface PayrollSummaryProps {
  poleSummaries: PoleSummary[];
}

export default function PayrollSummary({ poleSummaries }: PayrollSummaryProps) {
  const tr = t();
  const grandTotal = poleSummaries.reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
        {tr.payroll.summary.byPole}
      </h3>
      <div className="flex flex-col gap-2">
        {poleSummaries.map((ps) => (
          <div key={ps.pole} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-primary">
                {POLE_LABELS[ps.pole]}
              </span>
              <span className="text-xs text-text-tertiary">
                {ps.count} staffs
              </span>
            </div>
            <span className="text-sm font-medium text-accent">
              {ps.total.toLocaleString('fr-FR')} {tr.common.credits}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-border-secondary pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">{tr.payroll.summary.grandTotal}</span>
          <span className="text-lg font-bold text-accent">
            {grandTotal.toLocaleString('fr-FR')} {tr.common.credits}
          </span>
        </div>
      </div>
    </div>
  );
}
