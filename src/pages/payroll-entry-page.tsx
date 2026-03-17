import { useState, useCallback, useMemo } from 'react';
import { Send, Save } from 'lucide-react';
import { t } from '@/i18n';
import { Pole, type PayrollEntry } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { isCoordinateur, isGerantStaff, isPoleResponsible, getPoleForRole, formatShortDate } from '@/lib/utils';
import { POLE_LABELS } from '@/lib/constants';
import { useCurrentWeek, usePayrollEntries, useSaveEntries, useSubmitPayroll, useDeleteEntry } from '@/hooks/queries/use-payroll';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import WeekStatusBadge from '@/components/payroll/week-status-badge';
import PayrollTable, { type LocalPayrollEntry } from '@/components/payroll/payroll-table';
import { showToast } from '@/components/ui/show-toast';

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
    _isNew: entry.is_prefilled ?? false,
    _dirty: false,
  };
}

function getDefaultPole(isCoord: boolean, isGerant: boolean, userPole: Pole | null): Pole {
  if (isCoord) return Pole.MODERATION;
  if (isGerant) return Pole.ADMINISTRATION;
  return userPole ?? Pole.MODERATION;
}

function getAvailablePoles(isCoord: boolean, isGerant: boolean, userPole: Pole | null): Pole[] {
  if (isCoord) return Object.values(Pole);
  if (isGerant) return [Pole.ADMINISTRATION, Pole.MODERATION, Pole.ANIMATION, Pole.MJ, Pole.DOUANE];
  if (userPole) return [userPole];
  return [];
}

export default function PayrollEntryPage() {
  const tr = t();
  const user = useAuthStore((s) => s.user);
  const isCoord = user ? isCoordinateur(user.role) : false;
  const isGerant = user ? isGerantStaff(user.role) : false;
  const isResp = user ? isPoleResponsible(user.role) : false;
  const userPole = user ? getPoleForRole(user.role) : null;

  const availablePoles = useMemo(
    () => getAvailablePoles(isCoord, isGerant, userPole),
    [isCoord, isGerant, userPole],
  );

  const [selectedPole, setSelectedPole] = useState<Pole>(
    getDefaultPole(isCoord, isGerant, userPole),
  );
  const [localEntries, setLocalEntries] = useState<LocalPayrollEntry[]>([]);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  const { data: week, isLoading: weekLoading } = useCurrentWeek();
  const { data: serverEntries, isLoading: entriesLoading } = usePayrollEntries(
    week?.id,
    selectedPole,
  );
  const saveEntries = useSaveEntries();
  const submitPayroll = useSubmitPayroll();
  const deleteEntry = useDeleteEntry();
  const weekStatus = week?.status ?? 'closed';
  const canEdit = isCoord || isGerant || isResp;
  const editable = canEdit && weekStatus !== 'locked';

  // Sync server entries to local state when they change (React-recommended "store previous props" pattern)
  const [prevServerEntries, setPrevServerEntries] = useState(serverEntries);
  if (serverEntries !== prevServerEntries) {
    setPrevServerEntries(serverEntries);
    if (serverEntries) {
      setLocalEntries(serverEntries.map(toLocalEntry));
      setHasLocalChanges(false);
    }
  }

  const handleUpdate = useCallback((discordId: string, field: string, value: string | number | boolean) => {
    setLocalEntries((prev) =>
      prev.map((e) =>
        e.discord_id === discordId
          ? { ...e, [field]: value, _dirty: true }
          : e,
      ),
    );
    setHasLocalChanges(true);
  }, []);

  const handleDelete = useCallback(async (discordId: string) => {
    // Use functional access to avoid stale closure on localEntries
    let entryToDelete: LocalPayrollEntry | undefined;
    setLocalEntries((prev) => {
      entryToDelete = prev.find((e) => e.discord_id === discordId);
      return prev;
    });
    if (!entryToDelete) return;

    // If it's a new unsaved entry, just remove from local state
    if (entryToDelete._isNew) {
      setLocalEntries((prev) => prev.filter((e) => e.discord_id !== discordId));
      return;
    }

    // If it has an id, delete from server
    if (entryToDelete.id) {
      try {
        await deleteEntry.mutateAsync(entryToDelete.id);
        setLocalEntries((prev) => prev.filter((e) => e.discord_id !== discordId));
        showToast(tr.payroll.toast.deleted);
      } catch {
        showToast(tr.payroll.toast.errorDelete, 'error');
      }
    }
  }, [deleteEntry, tr]);

  async function handleSave() {
    if (!week) return;

    const entriesToSave = localEntries
      .filter((e) => e._dirty || e._isNew)
      .map((e) => ({
        discord_username: e.discord_username,
        discord_id: e.discord_id,
        steam_id: e.steam_id,
        grade: e.grade,
        tickets_ig: e.tickets_ig,
        tickets_discord: e.tickets_discord,
        bda_count: e.bda_count,
        nb_animations: e.nb_animations,
        nb_animations_mj: e.nb_animations_mj,
        nb_candidatures_ecrites: e.nb_candidatures_ecrites,
        nb_oraux: e.nb_oraux,
        commentaire: e.commentaire,
        presence_reunion: e.presence_reunion,
        montant: e.montant,
        is_inactive: e.is_inactive || e.montant === 0,
      }));

    if (entriesToSave.length === 0) return;

    try {
      await saveEntries.mutateAsync({
        week_id: week.id,
        pole: selectedPole,
        entries: entriesToSave,
      });
      // Sync local state: mark entries with montant=0 as inactive
      setLocalEntries((prev) =>
        prev.map((e) => (e.montant === 0 && !e.is_inactive ? { ...e, is_inactive: true } : e)),
      );
      showToast(weekStatus === 'open' ? tr.payroll.toast.saved : tr.payroll.toast.updated);
      setHasLocalChanges(false);
    } catch {
      showToast(tr.payroll.toast.errorSave, 'error');
    }
  }

  async function handleSubmit() {
    if (!week) return;

    // Save first, then submit
    try {
      const allEntries = localEntries.map((e) => ({
        discord_username: e.discord_username,
        discord_id: e.discord_id,
        steam_id: e.steam_id,
        grade: e.grade,
        tickets_ig: e.tickets_ig,
        tickets_discord: e.tickets_discord,
        bda_count: e.bda_count,
        nb_animations: e.nb_animations,
        nb_animations_mj: e.nb_animations_mj,
        nb_candidatures_ecrites: e.nb_candidatures_ecrites,
        nb_oraux: e.nb_oraux,
        commentaire: e.commentaire,
        presence_reunion: e.presence_reunion,
        montant: e.montant,
        is_inactive: e.is_inactive || e.montant === 0,
      }));

      await saveEntries.mutateAsync({
        week_id: week.id,
        pole: selectedPole,
        entries: allEntries,
      });

      await submitPayroll.mutateAsync({
        week_id: week.id,
        pole: selectedPole,
      });

      showToast(tr.payroll.toast.submitted);
      setHasLocalChanges(false);
    } catch {
      showToast(tr.payroll.toast.errorSubmit, 'error');
    }
  }

  const poleOptions = availablePoles.map((p) => ({
    value: p,
    label: POLE_LABELS[p],
  }));

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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{tr.nav.payroll}</h1>
          <p className="mt-1 text-sm text-text-secondary">{weekLabel}</p>
        </div>
        <WeekStatusBadge status={week.status} className="px-3 py-1 text-sm" />
      </div>

      {weekStatus === 'locked' && (
        <div className="glass-card rounded-xl p-4 text-center text-sm text-text-tertiary">
          {tr.payroll.lockedMessage}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {availablePoles.length > 1 && (
          <div className="w-[200px]">
            <Select
              value={selectedPole}
              onChange={(e) => setSelectedPole(e.target.value as Pole)}
              options={poleOptions}
              placeholder={tr.payroll.selectPole}
            />
          </div>
        )}
        {editable && (
          <div className="ml-auto flex items-center gap-2">
            {weekStatus === 'open' && (
              <Button
                size="sm"
                onClick={handleSubmit}
                loading={saveEntries.isPending || submitPayroll.isPending}
              >
                <Send className="h-4 w-4" />
                {tr.payroll.actions.submit}
              </Button>
            )}
            {hasLocalChanges && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSave}
                loading={saveEntries.isPending}
              >
                <Save className="h-4 w-4" />
                {weekStatus === 'open' ? tr.common.save : tr.payroll.actions.updateList}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      {entriesLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <PayrollTable
          entries={localEntries}
          pole={selectedPole}
          editable={editable}
          weekStatus={weekStatus}
          weekStart={week.week_start}
          weekEnd={week.week_end}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

    </div>
  );
}
