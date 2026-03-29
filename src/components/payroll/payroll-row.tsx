import { useState } from 'react';
import { Trash2, ShieldCheck, CheckCircle2, MessageSquare, MessageSquarePlus, Gift, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/i18n';
import Badge from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
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
  primeAmount?: number;
  onUpdate: (discordId: string, field: string, value: string | number | boolean) => void;
  onDelete: (discordId: string) => void;
  onConfirm?: (entryId: string, confirmed: boolean) => void;
  onEdit?: (entry: LocalPayrollEntry) => void;
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

function getNumericField(entry: LocalPayrollEntry, field: string): number {
  return (entry as unknown as Record<string, unknown>)[field] as number ?? 0;
}

export default function PayrollRow({
  entry,
  pole,
  editable,
  weekStatus,
  isCoordinator,
  showTotal,
  primeAmount,
  onUpdate,
  onDelete,
  onConfirm,
  onEdit,
}: PayrollRowProps) {
  const tr = t();
  const counters = getPoleCounterFields(pole);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
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

      <td className="px-3 py-2.5 text-sm">
        <span className="font-mono text-xs text-text-secondary">{entry.discord_id}</span>
      </td>

      <td className="px-3 py-2.5 text-sm">
        <InlineInput
          value={entry.steam_id ?? ''}
          onChange={(v) => onUpdate(entry.discord_id, 'steam_id', v)}
          disabled={!canDeleteOrAdd || !isNew}
          className="font-mono text-xs"
        />
      </td>

      <td className="px-3 py-2.5 text-sm">
        <span
          className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ backgroundColor: getGradeColor(entry.grade).bg, color: getGradeColor(entry.grade).text }}
        >
          {entry.grade}
        </span>
      </td>

      {counters.map((c) => (
        <td key={c.field} className="px-3 py-2.5 text-sm">
          <InlineInput
            type="number"
            value={getNumericField(entry, c.field)}
            onChange={(v) => onUpdate(entry.discord_id, c.field, parseInt(v) || 0)}
            disabled={!canEditPayFields}
          />
        </td>
      ))}

      {showTotal && (
        <td className="px-3 py-2.5 text-center text-sm font-medium text-text-primary">
          {(entry.tickets_ig ?? 0) + (entry.tickets_discord ?? 0) + (entry.bda_count ?? 0)}
        </td>
      )}

      <td className="px-3 py-2.5 text-center text-sm">
        <button
          onClick={() => { setCommentDraft(entry.commentaire ?? ''); setCommentModalOpen(true); }}
          className={cn(
            'rounded p-1 transition-colors',
            entry.commentaire
              ? 'text-accent hover:bg-accent/10'
              : 'text-text-tertiary hover:bg-white/[0.05] hover:text-text-secondary',
          )}
          title={entry.commentaire || tr.payroll.fields.commentaire}
        >
          {entry.commentaire
            ? <MessageSquare className="h-4 w-4" />
            : <MessageSquarePlus className="h-4 w-4" />}
        </button>

        <Modal
          isOpen={commentModalOpen}
          onClose={() => setCommentModalOpen(false)}
          title={`${tr.payroll.fields.commentaire} — ${entry.discord_username}`}
        >
          <div className="flex flex-col gap-4">
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              disabled={!canEditPayFields}
              rows={4}
              placeholder={canEditPayFields ? 'Saisir un commentaire...' : 'Aucun commentaire'}
              className="w-full resize-none rounded-lg border border-border-secondary bg-white/[0.03] px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 disabled:cursor-default disabled:opacity-60"
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setCommentModalOpen(false)}>
                {canEditPayFields ? tr.common.cancel : tr.common.close}
              </Button>
              {canEditPayFields && (
                <Button onClick={() => { onUpdate(entry.discord_id, 'commentaire', commentDraft); setCommentModalOpen(false); }}>
                  {tr.common.save}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      </td>

      <td className="px-3 py-2.5 text-center text-sm">
        <InlineCheckbox
          checked={entry.presence_reunion}
          onChange={(v) => onUpdate(entry.discord_id, 'presence_reunion', v)}
          disabled={!canEditPayFields}
        />
      </td>

      <td className="px-3 py-2.5 text-sm">
        <div className="flex items-center gap-1.5">
          <InlineInput
            type="number"
            value={entry.montant}
            onChange={(v) => onUpdate(entry.discord_id, 'montant', parseInt(v) || 0)}
            disabled={!canEditPayFields}
            className={cn('w-20 font-medium', entry.is_inactive ? 'text-text-tertiary' : 'text-accent')}
          />
          {primeAmount && (
            <span className="flex items-center gap-0.5 text-xs text-accent" title={`Prime : +${primeAmount.toLocaleString('fr-FR')} crédits`}>
              <Gift className="h-3 w-3" />
              +{primeAmount.toLocaleString('fr-FR')}
            </span>
          )}
        </div>
      </td>

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

      {(canDeleteOrAdd || onEdit) && (
        <td className="px-3 py-2.5 text-sm">
          <div className="flex items-center gap-1">
            {onEdit && weekStatus !== 'locked' && (
              <button
                onClick={() => onEdit(entry)}
                className="rounded p-1 text-text-tertiary transition-colors hover:bg-accent/10 hover:text-accent"
                title="Modifier"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {canDeleteOrAdd && (
              <button
                onClick={() => onDelete(entry.discord_id)}
                className="rounded p-1 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
