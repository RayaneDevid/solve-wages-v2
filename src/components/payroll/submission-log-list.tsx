import { t } from '@/i18n';
import { formatDate } from '@/lib/utils';
import type { PayrollSubmissionLog, PayrollSubmissionLogChange } from '@/types';

function formatLogValue(value: string | number | boolean | null): string {
  if (value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') return value.toLocaleString('fr-FR');
  return value;
}

function getChangeLabel(change: PayrollSubmissionLogChange): string {
  const name = change.discord_username ?? change.discord_id ?? 'Entrée';
  if (change.type === 'initial') {
    return change.label ?? 'Première soumission du pôle';
  }
  if (change.type === 'added') {
    return `${name} ajouté (${(change.montant ?? 0).toLocaleString('fr-FR')} crédits)`;
  }
  if (change.type === 'removed') {
    return `${name} supprimé`;
  }
  const fields = change.fields ?? [];
  if (fields.length === 0) return `${name} modifié`;
  return `${name}: ${fields.slice(0, 3).map((field) => `${field.label} ${formatLogValue(field.old_value)} -> ${formatLogValue(field.new_value)}`).join(', ')}${fields.length > 3 ? ` +${fields.length - 3}` : ''}`;
}

export default function SubmissionLogList({ logs }: { logs: PayrollSubmissionLog[] }) {
  const tr = t();
  const visibleLogs = logs.slice(0, 5);

  return (
    <div className="mt-4 rounded-lg border border-border-secondary bg-white/[0.02] p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        {tr.history.submissionLogs}
      </h4>
      {visibleLogs.length === 0 ? (
        <p className="mt-3 text-xs text-text-tertiary">{tr.history.noSubmissionLogs}</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {visibleLogs.map((log) => {
            const changes = log.changes ?? [];
            return (
              <div key={log.id} className="border-t border-border-secondary pt-3 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                  <span>{formatDate(log.submitted_at)}</span>
                  <span>{tr.history.submittedBy} {log.submitted_by_username ?? '—'}</span>
                  <span>{log.entry_count} staffs</span>
                  <span className="font-medium text-accent">
                    {log.total_montant.toLocaleString('fr-FR')} {tr.common.credits}
                  </span>
                  <span>{changes.length} {tr.history.changes}</span>
                </div>
                {changes.length === 0 ? (
                  <p className="mt-2 text-xs text-text-tertiary">{tr.history.noChanges}</p>
                ) : (
                  <ul className="mt-2 flex flex-col gap-1">
                    {changes.slice(0, 4).map((change, index) => (
                      <li key={`${log.id}-${index}`} className="text-xs text-text-primary">
                        {getChangeLabel(change)}
                      </li>
                    ))}
                    {changes.length > 4 && (
                      <li className="text-xs text-text-tertiary">+{changes.length - 4} autres changements</li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
          {logs.length > visibleLogs.length && (
            <p className="text-xs text-text-tertiary">+{logs.length - visibleLogs.length} soumissions précédentes</p>
          )}
        </div>
      )}
    </div>
  );
}
