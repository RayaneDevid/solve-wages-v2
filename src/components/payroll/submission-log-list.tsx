import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { t } from '@/i18n';
import { cn, formatDate } from '@/lib/utils';
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

function ChangeDetail({ change }: { change: PayrollSubmissionLogChange }) {
  const name = change.discord_username ?? change.discord_id ?? 'Entrée';

  if (change.type === 'initial') {
    return (
      <div className="rounded-md bg-white/[0.02] px-3 py-2 text-xs text-text-secondary">
        {change.label ?? 'Première soumission du pôle'}
      </div>
    );
  }

  if (change.type === 'added' || change.type === 'removed') {
    return (
      <div className="rounded-md bg-white/[0.02] px-3 py-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-text-primary">{name}</span>
          <span className={change.type === 'added' ? 'text-success' : 'text-danger'}>
            {change.type === 'added' ? 'Ajouté' : 'Supprimé'}
          </span>
          {change.montant != null && (
            <span className="text-accent">{change.montant.toLocaleString('fr-FR')} crédits</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-white/[0.02] px-3 py-2">
      <div className="text-xs font-medium text-text-primary">{name}</div>
      <div className="mt-2 flex flex-col gap-1">
        {(change.fields ?? []).map((field) => (
          <div key={field.field} className="grid grid-cols-[minmax(120px,0.7fr)_minmax(0,1fr)] gap-3 text-xs">
            <span className="text-text-secondary">{field.label}</span>
            <span className="min-w-0 text-text-primary">
              <span className="text-text-tertiary">{formatLogValue(field.old_value)}</span>
              <span className="px-2 text-text-tertiary">-&gt;</span>
              <span>{formatLogValue(field.new_value)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SubmissionLogList({ logs }: { logs: PayrollSubmissionLog[] }) {
  const tr = t();
  const [openLogIds, setOpenLogIds] = useState<Set<string>>(() => new Set());
  const visibleLogs = logs.slice(0, 5);

  function toggleLog(logId: string) {
    setOpenLogIds((current) => {
      const next = new Set(current);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  }

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
            const isOpen = openLogIds.has(log.id);
            return (
              <div key={log.id} className="border-t border-border-secondary pt-3 first:border-t-0 first:pt-0">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-1 text-left transition-colors hover:bg-white/[0.03]"
                  onClick={() => toggleLog(log.id)}
                >
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                    <span>{formatDate(log.submitted_at)}</span>
                    <span>{tr.history.submittedBy} {log.submitted_by_username ?? '—'}</span>
                    <span>{log.entry_count} staffs</span>
                    <span className="font-medium text-accent">
                      {log.total_montant.toLocaleString('fr-FR')} {tr.common.credits}
                    </span>
                    <span>{changes.length} {tr.history.changes}</span>
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-text-tertiary transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
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
                {isOpen && changes.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {changes.map((change, index) => (
                      <ChangeDetail key={`${log.id}-detail-${index}`} change={change} />
                    ))}
                  </div>
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
