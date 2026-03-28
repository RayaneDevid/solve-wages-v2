import { Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import Badge from '@/components/ui/badge';
import { getGradeColor, getPoleCounterFields } from '@/lib/constants';
import type { Pole } from '@/types';
import type { LocalPayrollEntry } from './payroll-table';

interface PayrollRowProps {
  entry: LocalPayrollEntry;
  pole: Pole;
  editable: boolean;
  weekStatus: 'open' | 'closed' | 'locked';
  isCoordinator?: boolean;
  showTotal?: boolean;
  onUpdate: (discordId: string, field: string, value: string | number | boolean) => void;
  onDelete: (discordId: string) => void;
  onConfirm?: (entryId: string, confirmed: boolean) => void;
  dateRange: string;
}

function InlineInput({
  value,
  onChange,
  disabled,
  type = 'text',
  className,
}: {
  value: string | number;
  onChange: (val: string) => void;
  disabled?: boolean;
  type?: 'text' | 'number';
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'h-7 w-full rounded border border-transparent bg-transparent px-1.5 text-sm text-text-primary transition-all',
        !disabled && 'hover:border-border-secondary focus:border-accent/40 focus:bg-white/[0.03] focus:outline-none',
        disabled && 'cursor-default opacity-70',
        type === 'number' && 'w-16 text-center',
        className,
      )}
    />
  );
}

function InlineCheckbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className="h-4 w-4 cursor-pointer rounded border-border-secondary bg-white/[0.03] accent-accent"
    />
  );
}

export default function PayrollRow({
  entry,
  pole,
  editable,
  weekStatus,
  isCoordinator,
  showTotal,
  onUpdate,
  onDelete,
  onConfirm,
}: PayrollRowProps) {
  const tr = t();
  const counters = getPoleCounterFields(pole);
  const canEditPayFields = editable && weekStatus === 'open' && !entry.is_inactive;
  const canDeleteOrAdd = editable && weekStatus !== 'locked';
  const isNew = entry._isNew;
  const isCoordModified = entry.modified_by_coordinator;

  return (
    <tr
      className={cn(
        'transition-colors duration-150 hover:bg-white/[0.02]',
        isNew && 'border-l-2 border-l-accent/60',
        isCoordModified && !isNew && 'border-l-2 border-l-accent-purple/60',
        entry.is_inactive && 'opacity-50',
      )}
    >
      {/* Discord Username */}
      <td className="px-3 py-2.5 text-sm">
        <div className="flex items-center gap-2">
          <InlineInput
            value={entry.discord_username}
            onChange={(v) => onUpdate(entry.discord_id, 'discord_username', v)}
            disabled={!canDeleteOrAdd || !isNew}
          />
          {isNew && (
            <Badge variant="info" className="shrink-0 text-[10px]">{tr.common.new}</Badge>
          )}
          {isCoordModified && !isNew && (
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent-purple" />
          )}
        </div>
      </td>

      {/* Discord ID */}
      <td className="px-3 py-2.5 text-sm">
        <span className="font-mono text-xs text-text-secondary">{entry.discord_id}</span>
      </td>

      {/* Steam ID */}
      <td className="px-3 py-2.5 text-sm">
        <InlineInput
          value={entry.steam_id ?? ''}
          onChange={(v) => onUpdate(entry.discord_id, 'steam_id', v)}
          disabled={!canDeleteOrAdd || !isNew}
          className="font-mono text-xs"
        />
      </td>

      {/* Grade */}
      <td className="px-3 py-2.5 text-sm">
        <span
          className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ backgroundColor: getGradeColor(entry.grade).bg, color: getGradeColor(entry.grade).text }}
        >
          {entry.grade}
        </span>
      </td>

      {/* Dynamic counter fields */}
      {counters.map((c) => (
        <td key={c.field} className="px-3 py-2.5 text-sm">
          <InlineInput
            type="number"
            value={(entry as unknown as Record<string, unknown>)[c.field] as number ?? 0}
            onChange={(v) => onUpdate(entry.discord_id, c.field, parseInt(v) || 0)}
            disabled={!canEditPayFields}
          />
        </td>
      ))}

      {/* Total (modération uniquement) */}
      {showTotal && (
        <td className="px-3 py-2.5 text-center text-sm font-medium text-text-primary">
          {(entry.tickets_ig ?? 0) + (entry.tickets_discord ?? 0) + (entry.bda_count ?? 0)}
        </td>
      )}

      {/* Commentaire */}
      <td className="px-3 py-2.5 text-sm">
        <InlineInput
          value={entry.commentaire ?? ''}
          onChange={(v) => onUpdate(entry.discord_id, 'commentaire', v)}
          disabled={!canEditPayFields}
          className="w-24"
        />
      </td>

      {/* Réunion */}
      <td className="px-3 py-2.5 text-center text-sm">
        <InlineCheckbox
          checked={entry.presence_reunion}
          onChange={(v) => onUpdate(entry.discord_id, 'presence_reunion', v)}
          disabled={!canEditPayFields}
        />
      </td>

      {/* Montant */}
      <td className="px-3 py-2.5 text-sm">
        <InlineInput
          type="number"
          value={entry.montant}
          onChange={(v) => onUpdate(entry.discord_id, 'montant', parseInt(v) || 0)}
          disabled={!canEditPayFields}
          className={cn('w-20 font-medium', entry.is_inactive ? 'text-text-tertiary' : 'text-accent')}
        />
      </td>

      {/* Inactif */}
      <td className="px-3 py-2.5 text-center text-sm">
        <InlineCheckbox
          checked={entry.is_inactive}
          onChange={(v) => {
            onUpdate(entry.discord_id, 'is_inactive', v);
            if (v) {
              onUpdate(entry.discord_id, 'montant', 0);
            }
          }}
          disabled={!(editable && weekStatus === 'open')}
        />
      </td>

      {/* Confirmé */}
      {isCoordinator && (
        <td className="px-3 py-2.5 text-center text-sm">
          {entry.id && (
            <button
              onClick={() => onConfirm?.(entry.id!, !entry.confirmed_by_coordinator)}
              className={cn(
                'rounded p-1 transition-colors',
                entry.confirmed_by_coordinator
                  ? 'text-success hover:bg-success/10'
                  : 'text-text-tertiary hover:bg-white/[0.05] hover:text-text-secondary',
              )}
              title={entry.confirmed_by_coordinator ? tr.payroll.fields.confirmed : tr.common.confirm}
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
        </td>
      )}

      {/* Actions */}
      {canDeleteOrAdd && (
        <td className="px-3 py-2.5 text-sm">
          <button
            onClick={() => onDelete(entry.discord_id)}
            className="rounded p-1 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      )}
    </tr>
  );
}
