import { useState, useCallback, useMemo } from 'react';
import { Download, Copy, CheckCircle2, Gift } from 'lucide-react';
import { t } from '@/i18n';
import { Pole, type PayrollEntry, type PayrollSubmission, type PayrollWeek } from '@/types';
import { formatShortDate, isCoordinateur } from '@/lib/utils';
import { POLE_LABELS } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';
import {
  useCurrentWeek,
  usePayrollEntries,
  useSaveEntries,
  useConfirmEntry,
  useBulkConfirmEntries,
  useExportPayroll,
} from '@/hooks/queries/use-payroll';
import { usePrimes } from '@/hooks/queries/use-primes';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import Modal from '@/components/ui/modal';
import Input from '@/components/ui/input';
import WeekStatusBadge from '@/components/payroll/week-status-badge';
import SubmissionStatusBadge from '@/components/payroll/submission-status-badge';
import PayrollTable, { type LocalPayrollEntry } from '@/components/payroll/payroll-table';
import PayrollSummary from '@/components/payroll/payroll-summary';
import { showToast } from '@/components/ui/show-toast';

const ALL_POLES: Pole[] = Object.values(Pole);

function toLocalEntry(entry: PayrollEntry): LocalPayrollEntry {
  return {
    id: entry.id ?? undefined,
    staff_id: entry.staff_id,
    pole: entry.pole,
    discord_username: entry.discord_username,
    discord_id: entry.discord_id,
    steam_id: entry.steam_id,
    grade: entry.grade,
    tickets_ig: entry.tickets_ig,
    tickets_discord: entry.tickets_discord,
    bda_count: entry.bda_count,
    nb_animations: entry.nb_animations,
    nb_animations_mj: entry.nb_animations_mj,
    nb_candidatures_ecrites: entry.nb_candidatures_ecrites,
    nb_oraux: entry.nb_oraux,
    commentaire: entry.commentaire,
    presence_reunion: entry.presence_reunion,
    montant: entry.montant,
    is_inactive: entry.is_inactive,
    confirmed_by_coordinator: entry.confirmed_by_coordinator,
    confirmed_at: entry.confirmed_at,
    modified_by_coordinator: entry.modified_by_coordinator,
    coordinator_modified_at: entry.coordinator_modified_at,
    _isNew: false,
    _dirty: false,
  };
}

interface EditModalProps {
  entry: LocalPayrollEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: LocalPayrollEntry) => void;
}

function EditEntryModal({ entry, isOpen, onClose, onSave }: EditModalProps) {
  const tr = t();
  const [form, setForm] = useState<LocalPayrollEntry | null>(null);

  const [prevEntry, setPrevEntry] = useState<LocalPayrollEntry | null>(null);
  if (entry !== prevEntry) {
    setPrevEntry(entry);
    if (entry) setForm({ ...entry });
  }

  if (!form) return null;

  function handleSave() {
    if (form) onSave(form);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tr.global.editEntry}>
      <div className="flex flex-col gap-4">
        <Input
          label={tr.payroll.fields.discordUsername}
          value={form.discord_username}
          disabled
        />
        <Input
          label={tr.payroll.fields.commentaire}
          value={form.commentaire ?? ''}
          onChange={(e) => setForm((f) => f ? { ...f, commentaire: e.target.value } : f)}
        />
        <Input
          label={tr.payroll.fields.montant}
          type="number"
          value={form.montant}
          onChange={(e) => setForm((f) => f ? { ...f, montant: parseInt(e.target.value) || 0 } : f)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>{tr.common.cancel}</Button>
          <Button onClick={handleSave}>{tr.common.save}</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function GlobalViewPage() {
  const tr = t();
  const user = useAuthStore((s) => s.user);
  const isCoord = user ? (user.roles ?? [user.role]).some((r) => isCoordinateur(r)) : false;
  const [filterPole, setFilterPole] = useState<string>('all');
  const [editEntry, setEditEntry] = useState<LocalPayrollEntry | null>(null);

  const { data: week, isLoading: weekLoading } = useCurrentWeek();
  const { data: allEntries, isLoading: entriesLoading } = usePayrollEntries(week?.id);
  const { data: primesData } = usePrimes(week?.id);
  const saveEntries = useSaveEntries();
  const confirmEntry = useConfirmEntry();
  const bulkConfirm = useBulkConfirmEntries();
  const { downloadCsv, copyTsv } = useExportPayroll();

  const submissions = (week as PayrollWeek & { submissions?: PayrollSubmission[] })?.submissions ?? [];

  const entries = useMemo(() => allEntries?.map(toLocalEntry) ?? [], [allEntries]);

  const polesToShow = filterPole === 'all' ? ALL_POLES : [filterPole as Pole];

  const approvedPrimesMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!primesData) return map;
    for (const p of primesData) {
      if (p.status === 'approved') {
        map.set(p.discord_id, (map.get(p.discord_id) ?? 0) + p.amount);
      }
    }
    return map;
  }, [primesData]);

  const approvedPrimesList = useMemo(
    () => primesData?.filter((p) => p.status === 'approved') ?? [],
    [primesData],
  );

  const poleSummaries = (() => {
    const countedDiscordIds = new Set<string>();
    return ALL_POLES.map((pole) => {
      const poleEntries = entries.filter((e) => e.pole === pole);
      const poleDiscordIds = new Set(poleEntries.map((e) => e.discord_id));
      const primesTotal = approvedPrimesList
        .filter((p) => poleDiscordIds.has(p.discord_id) && !countedDiscordIds.has(p.discord_id))
        .reduce((sum, p) => sum + p.amount, 0);
      poleDiscordIds.forEach((id) => countedDiscordIds.add(id));
      return {
        pole,
        total: poleEntries.reduce((sum, e) => sum + e.montant, 0) + primesTotal,
        primesTotal,
        count: poleEntries.length,
      };
    }).filter((ps) => ps.count > 0);
  })();

  const poleFilterOptions = [
    { value: 'all', label: tr.global.allPoles },
    ...ALL_POLES.map((p) => ({ value: p, label: POLE_LABELS[p] })),
  ];

  function getSubmissionStatus(pole: Pole) {
    const sub = submissions.find((s) => s.pole === pole);
    return sub?.status ?? null;
  }

  function getSubmissionUsername(pole: Pole) {
    const sub = submissions.find((s) => s.pole === pole);
    return sub?.submitted_by_username ?? null;
  }

  async function handleExportCsv() {
    if (!week) return;
    try {
      await downloadCsv(week.id, `paies_${week.week_start}_${week.week_end}.csv`);
      showToast(tr.payroll.toast.exported);
    } catch {
      showToast(tr.payroll.toast.errorExport, 'error');
    }
  }

  async function handleCopyTsv() {
    if (!week) return;
    try {
      await copyTsv(week.id);
      showToast(tr.payroll.toast.tsvCopied);
    } catch {
      showToast(tr.payroll.toast.errorExport, 'error');
    }
  }

  const handleEditSave = useCallback(async (updated: LocalPayrollEntry) => {
    if (!week) return;
    try {
      await saveEntries.mutateAsync({
        week_id: week.id,
        pole: updated.pole,
        entries: [{
          discord_username: updated.discord_username,
          discord_id: updated.discord_id,
          steam_id: updated.steam_id,
          grade: updated.grade,
          tickets_ig: updated.tickets_ig,
          tickets_discord: updated.tickets_discord,
          bda_count: updated.bda_count,
          nb_animations: updated.nb_animations,
          nb_animations_mj: updated.nb_animations_mj,
          nb_candidatures_ecrites: updated.nb_candidatures_ecrites,
          nb_oraux: updated.nb_oraux,
          commentaire: updated.commentaire,
          presence_reunion: updated.presence_reunion,
          montant: updated.montant,
          is_inactive: updated.is_inactive,
        }],
      });
      showToast(tr.payroll.toast.saved);
    } catch {
      showToast(tr.payroll.toast.errorSave, 'error');
    }
  }, [week, saveEntries, tr]);

  const handleConfirm = useCallback(async (entryId: string, confirmed: boolean) => {
    try {
      await confirmEntry.mutateAsync({ entry_id: entryId, confirmed });
      showToast(confirmed ? tr.payroll.toast.entryConfirmed : tr.payroll.toast.entryUnconfirmed);
    } catch {
      showToast(tr.payroll.toast.errorConfirm, 'error');
    }
  }, [confirmEntry, tr]);

  const unconfirmedIds = useMemo(
    () => entries.filter((e) => e.id && !e.confirmed_by_coordinator).map((e) => e.id!),
    [entries],
  );

  const handleConfirmAll = useCallback(async () => {
    if (unconfirmedIds.length === 0) return;
    try {
      await bulkConfirm.mutateAsync({ entry_ids: unconfirmedIds, confirmed: true });
      showToast(tr.payroll.toast.allConfirmed);
    } catch {
      showToast(tr.payroll.toast.errorConfirm, 'error');
    }
  }, [bulkConfirm, unconfirmedIds, tr]);

  const handleConfirmAllPole = useCallback(async (pole: Pole) => {
    const ids = entries
      .filter((e) => e.pole === pole && e.id && !e.confirmed_by_coordinator)
      .map((e) => e.id!);
    if (ids.length === 0) return;
    try {
      await bulkConfirm.mutateAsync({ entry_ids: ids, confirmed: true });
      showToast(tr.payroll.toast.allConfirmed);
    } catch {
      showToast(tr.payroll.toast.errorConfirm, 'error');
    }
  }, [bulkConfirm, entries, tr]);

  const weekLabel = week
    ? `${tr.payroll.weekOf} ${formatShortDate(week.week_start)} ${tr.payroll.to} ${formatShortDate(week.week_end)}`
    : '';

  if (weekLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!week) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-text-tertiary">{tr.dashboard.noWeekDescription}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{tr.global.title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {isCoord && unconfirmedIds.length > 0 && (
            <Button size="sm" onClick={handleConfirmAll} loading={bulkConfirm.isPending}>
              <CheckCircle2 className="h-4 w-4" />
              {tr.payroll.actions.confirmAll} ({unconfirmedIds.length})
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleExportCsv}>
            <Download className="h-4 w-4" />
            {tr.payroll.actions.exportCsv}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopyTsv}>
            <Copy className="h-4 w-4" />
            {tr.payroll.actions.copyTsv}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-[220px]">
          <Select
            value={filterPole}
            onChange={(e) => setFilterPole(e.target.value)}
            options={poleFilterOptions}
          />
        </div>
        <WeekStatusBadge status={week.status} />
      </div>

      {entriesLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {polesToShow.map((pole) => {
            const poleEntries = entries.filter((e) => e.pole === pole);
            const poleDiscordIds = new Set(poleEntries.map((e) => e.discord_id));
            const polePrimes = approvedPrimesList.filter((p) => poleDiscordIds.has(p.discord_id));
            const poleUnconfirmedCount = poleEntries.filter((e) => e.id && !e.confirmed_by_coordinator).length;
            return (
              <div key={pole}>
                <div className="mb-3 flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-text-primary">{POLE_LABELS[pole]}</h2>
                  <SubmissionStatusBadge status={getSubmissionStatus(pole)} />
                  {getSubmissionUsername(pole) && (
                    <span className="text-xs text-text-tertiary">
                      {tr.global.submittedBy} <span className="font-medium text-text-secondary">{getSubmissionUsername(pole)}</span>
                    </span>
                  )}
                  <span className="text-xs text-text-tertiary">
                    {poleEntries.length} staffs
                  </span>
                  {polePrimes.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-accent">
                      <Gift className="h-3.5 w-3.5" />
                      {polePrimes.reduce((s, p) => s + p.amount, 0).toLocaleString('fr-FR')} {tr.common.credits}
                    </span>
                  )}
                  {isCoord && poleUnconfirmedCount > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleConfirmAllPole(pole)}
                      loading={bulkConfirm.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {tr.payroll.actions.confirmAll} ({poleUnconfirmedCount})
                    </Button>
                  )}
                </div>
                <PayrollTable
                  entries={poleEntries}
                  pole={pole}
                  editable={false}
                  weekStatus={week.status}
                  weekStart={week.week_start}
                  weekEnd={week.week_end}
                  isCoordinator={isCoord}
                  primesByDiscordId={approvedPrimesMap}
                  onUpdate={() => {}}
                  onDelete={() => {}}
                  onConfirm={handleConfirm}
                  onEdit={isCoord && week.status !== 'locked' ? setEditEntry : undefined}
                />
              </div>
            );
          })}

          {poleSummaries.length > 0 && (
            <PayrollSummary poleSummaries={poleSummaries} />
          )}
        </div>
      )}

      <EditEntryModal
        entry={editEntry}
        isOpen={!!editEntry}
        onClose={() => setEditEntry(null)}
        onSave={handleEditSave}
      />
    </div>
  );
}
