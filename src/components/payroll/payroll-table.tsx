import { useMemo } from 'react';
import { t } from '@/i18n';
import { formatShortDate } from '@/lib/utils';
import { compareByGradeThenName, getPoleCounterFields } from '@/lib/constants';
import { Pole } from '@/types';
import type { PayrollEntry } from '@/types';
import PayrollRow from './payroll-row';

export interface LocalPayrollEntry extends Omit<PayrollEntry, 'id' | 'payroll_week_id' | 'submission_id' | 'filled_by_id' | 'created_at' | 'updated_at'> {
  id?: string;
  _isNew?: boolean;
  _dirty?: boolean;
}

interface PayrollTableProps {
  entries: LocalPayrollEntry[];
  pole: Pole;
  editable: boolean;
  weekStatus: 'open' | 'closed' | 'locked';
  weekStart?: string;
  weekEnd?: string;
  isCoordinator?: boolean;
  primesByDiscordId?: Map<string, number>;
  onUpdate: (discordId: string, field: string, value: string | number | boolean) => void;
  onDelete: (discordId: string) => void;
  onConfirm?: (entryId: string, confirmed: boolean) => void;
  onEdit?: (entry: LocalPayrollEntry) => void;
}

export default function PayrollTable({
  entries,
  pole,
  editable,
  weekStatus,
  weekStart,
  weekEnd,
  isCoordinator,
  primesByDiscordId,
  onUpdate,
  onDelete,
  onConfirm,
  onEdit,
}: PayrollTableProps) {
  const tr = t();
  const counters = getPoleCounterFields(pole);
  const showTotal = pole === Pole.MODERATION || pole === Pole.MJ;
  const canDeleteOrAdd = editable && weekStatus !== 'locked';

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => compareByGradeThenName(a, b, pole)),
    [entries, pole],
  );

  const dateRange = weekStart && weekEnd
    ? `${formatShortDate(weekStart)} ${tr.payroll.to} ${formatShortDate(weekEnd)}`
    : '';

  const fieldLabels = tr.payroll.fields;

  return (
    <div className="glass-card w-full overflow-x-auto rounded-xl">
      <table className="w-full text-sm">
        <thead className="border-b border-border-secondary bg-[rgba(10,8,35,0.4)]">
          <tr>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              {fieldLabels.discordUsername}
            </th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              {fieldLabels.discordId}
            </th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              {fieldLabels.steamId}
            </th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              {fieldLabels.grade}
            </th>
            {counters.map((c) => (
              <th key={c.field} className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                <div className="flex flex-col items-center">
                  <span>{fieldLabels[c.label as keyof typeof fieldLabels]}</span>
                  {dateRange && (
                    <span className="mt-0.5 text-[9px] font-normal normal-case tracking-normal text-text-tertiary">
                      {dateRange}
                    </span>
                  )}
                </div>
              </th>
            ))}
            {showTotal && (
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                {pole === Pole.MJ ? tr.payroll.fields.nbAnimationsMj : tr.common.total}
              </th>
            )}
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              {fieldLabels.commentaire}
            </th>
            <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              {fieldLabels.presenceReunion}
            </th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              {fieldLabels.montant}
            </th>
            <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              {fieldLabels.inactive}
            </th>
            {isCoordinator && (
              <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                {fieldLabels.confirmed}
              </th>
            )}
            {canDeleteOrAdd && (
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                {tr.common.actions}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-secondary">
          {sortedEntries.length === 0 ? (
            <tr>
              <td
                colSpan={4 + counters.length + (showTotal ? 1 : 0) + 4 + (isCoordinator ? 1 : 0) + (canDeleteOrAdd ? 1 : 0)}
                className="px-5 py-12 text-center text-sm text-text-tertiary"
              >
                {tr.payroll.noEntries}
              </td>
            </tr>
          ) : (
            sortedEntries.map((entry) => (
              <PayrollRow
                key={entry.discord_id}
                entry={entry}
                pole={pole}
                editable={editable}
                weekStatus={weekStatus}
                isCoordinator={isCoordinator}
                showTotal={showTotal}
                primeAmount={primesByDiscordId?.get(entry.discord_id)}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onConfirm={onConfirm}
                onEdit={onEdit}
                dateRange={dateRange}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
