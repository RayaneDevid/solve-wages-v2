import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Send, Save, EyeOff, Eye, Lock, Upload } from 'lucide-react';
import { usePayrollLock } from '@/hooks/use-payroll-lock';
import { t } from '@/i18n';
import { Role, Pole, type PayrollEntry, type PayrollWeek, type PayrollSubmission } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { isCoordinateur, isPoleResponsible, getPoleForRole, formatShortDate } from '@/lib/utils';
import { POLE_LABELS, RESP_PAYROLL_POLE } from '@/lib/constants';
import { useCurrentWeek, usePayrollEntries, useSaveEntries, useSubmitPayroll, useDeleteEntry } from '@/hooks/queries/use-payroll';
import Button from '@/components/ui/button';
import SearchableSelect from '@/components/ui/searchable-select';
import Spinner from '@/components/ui/spinner';
import WeekStatusBadge from '@/components/payroll/week-status-badge';
import PayrollTable, { type LocalPayrollEntry } from '@/components/payroll/payroll-table';
import PayrollCsvImportModal, { type PayrollCsvRow } from '@/components/payroll/mj-csv-import-modal';
import { bulkImportMembers as bulkImportMembersApi } from '@/api/members.api';
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
    nb_animations_mj_p: entry.nb_animations_mj_p,
    nb_animations_mj_m: entry.nb_animations_mj_m,
    nb_animations_mj_g: entry.nb_animations_mj_g,
    nb_heures_mj: entry.nb_heures_mj,
    nb_candidatures_ecrites: entry.nb_candidatures_ecrites,
    nb_oraux: entry.nb_oraux,
    commentaire: entry.commentaire,
    presence_reunion: entry.presence_reunion,
    montant: entry.montant,
    is_inactive: entry.is_inactive,
    is_probatoire: entry.is_probatoire ?? false,
    probatoire_since: entry.probatoire_since ?? null,
    confirmed_by_coordinator: entry.confirmed_by_coordinator,
    confirmed_at: entry.confirmed_at,
    modified_by_coordinator: entry.modified_by_coordinator,
    coordinator_modified_at: entry.coordinator_modified_at,
    _isNew: entry.is_prefilled ?? false,
    _dirty: false,
  };
}

function getAvailablePoles(roles: Role[]): Pole[] {
  if (roles.some((r) => isCoordinateur(r))) return Object.values(Pole);
  const poles = new Set<Pole>();
  for (const r of roles) {
    if (r === Role.GERANT_STAFF || r === Role.GERANT_RP || r === Role.GERANT_SERVEUR) {
      Object.values(Pole).filter((p) => p !== Pole.GERANCE).forEach((p) => poles.add(p));
    } else {
      // resp_ roles fill their own pole's payroll (not responsables)
      const pole = RESP_PAYROLL_POLE[r] ?? getPoleForRole(r);
      if (pole) poles.add(pole);
    }
  }
  return [...poles];
}

export default function PayrollEntryPage() {
  const tr = t();
  const user = useAuthStore((s) => s.user);
  const userRoles: Role[] = user?.roles ?? (user?.role ? [user.role] : []);
  const isCoord = userRoles.some((r) => isCoordinateur(r));
  const isGerant = userRoles.some((r) => r === Role.GERANT_STAFF || r === Role.GERANT_RP || r === Role.GERANT_SERVEUR);
  const isResp = userRoles.some((r) => isPoleResponsible(r));

  const availablePoles = useMemo(
    () => getAvailablePoles(userRoles),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  const [selectedPole, setSelectedPole] = useState<Pole>(
    availablePoles[0] ?? Pole.MODERATION,
  );
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

  const submissions = (week as (PayrollWeek & { submissions?: PayrollSubmission[] }) | undefined)?.submissions ?? [];
  const currentSubmission = submissions.find((s) => s.pole === selectedPole);

  const [localEntries, setLocalEntries] = useState<LocalPayrollEntry[]>(
    () => serverEntries?.map(toLocalEntry) ?? [],
  );
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [payrollCsvImportOpen, setPayrollCsvImportOpen] = useState(false);

  const lockState = usePayrollLock(editable ? week?.id : undefined, editable ? selectedPole : undefined);
  const isBlocked = lockState.status === 'blocked';
  const lockedBy = lockState.status === 'blocked' ? lockState.lockedBy : null;

  const localEntriesRef = useRef(localEntries);
  localEntriesRef.current = localEntries;
  const weekRef = useRef(week);
  weekRef.current = week;
  const selectedPoleRef = useRef(selectedPole);
  selectedPoleRef.current = selectedPole;

  useEffect(() => {
    if (!editable || lockState.status !== 'owned') return;

    const interval = setInterval(async () => {
      if (!weekRef.current || !hasLocalChanges) return;
      const dirty = localEntriesRef.current.filter((e) => e._dirty || e._isNew);
      if (dirty.length === 0) return;
      try {
        await saveEntries.mutateAsync({
          week_id: weekRef.current.id,
          pole: selectedPoleRef.current,
          entries: dirty.map((e) => ({
            discord_username: e.discord_username,
            discord_id: e.discord_id,
            steam_id: e.steam_id,
            grade: e.grade,
            tickets_ig: e.tickets_ig,
            tickets_discord: e.tickets_discord,
            bda_count: e.bda_count,
            nb_animations: e.nb_animations,
            nb_animations_mj: e.nb_animations_mj,
            nb_animations_mj_p: e.nb_animations_mj_p,
            nb_animations_mj_m: e.nb_animations_mj_m,
            nb_animations_mj_g: e.nb_animations_mj_g,
            nb_heures_mj: e.nb_heures_mj,
            nb_candidatures_ecrites: e.nb_candidatures_ecrites,
            nb_oraux: e.nb_oraux,
            commentaire: e.commentaire,
            presence_reunion: e.presence_reunion,
            montant: e.montant,
            is_inactive: e.is_inactive,
          })),
        });
        setHasLocalChanges(false);
      } catch (err) {
        // Don't reset hasLocalChanges on failure — data is not saved
        console.error('[auto-save] échec de la sauvegarde automatique:', err);
      }
    }, 20_000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, lockState.status, selectedPole, hasLocalChanges]);

  const [prevServerEntries, setPrevServerEntries] = useState(serverEntries);
  if (serverEntries !== prevServerEntries) {
    setPrevServerEntries(serverEntries);
    if (serverEntries) {
      setLocalEntries(serverEntries.map(toLocalEntry));
      setHasLocalChanges(false);
    }
  }

  const ANIMATION_BREAKDOWN_FIELDS = ['nb_animations_mj_m', 'nb_animations_mj_g'] as const;
  const canImportStructuredCsv = selectedPole === Pole.MJ || selectedPole === Pole.ANIMATION;

  const handleUpdate = useCallback((discordId: string, field: string, value: string | number | boolean) => {
    setLocalEntries((prev) =>
      prev.map((e) => {
        if (e.discord_id !== discordId) return e;
        const updated = { ...e, [field]: value, _dirty: true };
        if (ANIMATION_BREAKDOWN_FIELDS.includes(field as typeof ANIMATION_BREAKDOWN_FIELDS[number])) {
          const total =
            (field === 'nb_animations_mj_m' ? (value as number) : (updated.nb_animations_mj_m ?? 0)) +
            (field === 'nb_animations_mj_g' ? (value as number) : (updated.nb_animations_mj_g ?? 0));
          if (selectedPoleRef.current === Pole.ANIMATION) {
            updated.nb_animations = total;
          } else {
            updated.nb_animations_mj = total;
          }
        }
        return updated;
      }),
    );
    setHasLocalChanges(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zeroActiveCount = localEntries.filter((e) => e.montant === 0 && !e.is_inactive).length;
  const inactiveCount = localEntries.filter((e) => e.is_inactive).length;

  function handleMarkZeroInactive() {
    setLocalEntries((prev) =>
      prev.map((e) => (e.montant === 0 && !e.is_inactive ? { ...e, is_inactive: true, _dirty: true } : e)),
    );
    setHasLocalChanges(true);
  }

  function handleMarkAllActive() {
    setLocalEntries((prev) =>
      prev.map((e) => (e.is_inactive ? { ...e, is_inactive: false, _dirty: true } : e)),
    );
    setHasLocalChanges(true);
  }

  async function handlePayrollCsvImport(rows: PayrollCsvRow[]): Promise<void> {
    const importPole = selectedPoleRef.current;
    if (importPole !== Pole.MJ && importPole !== Pole.ANIMATION) return;

    // Detect new discord_ids absent from current entries
    const existingIds = new Set(localEntries.map((e) => e.discord_id));
    const newRows = rows.filter((r) => !existingIds.has(r.discord_id));

    // Create missing pole_members first (direct API call to avoid cache invalidation)
    if (newRows.length > 0) {
      try {
        await bulkImportMembersApi({
          pole: importPole,
          members: newRows.map((r) => ({
            discord_username: r.discord_id,
            discord_id: r.discord_id,
            steam_id: r.steam_id || undefined,
            grade: r.grade,
          })),
        });
      } catch {
        showToast(`Erreur lors de la création des membres ${POLE_LABELS[importPole]}`, 'error');
        return;
      }
    }

    setLocalEntries((prev) => {
      const updated = [...prev];
      const idxById = new Map(updated.map((e, i) => [e.discord_id, i]));

      for (const row of rows) {
        const total = row.moyenne + row.grande;
        const idx = idxById.get(row.discord_id);
        const totalField = importPole === Pole.ANIMATION ? 'nb_animations' : 'nb_animations_mj';

        if (idx !== undefined) {
          updated[idx] = {
            ...updated[idx],
            steam_id: row.steam_id || updated[idx].steam_id,
            grade: row.grade,
            [totalField]: total,
            nb_animations_mj_m: row.moyenne,
            nb_animations_mj_g: row.grande,
            nb_heures_mj: row.heures,
            commentaire: row.commentaire,
            montant: row.montant,
            is_inactive: row.montant === 0,
            _dirty: true,
          };
        } else {
          updated.push({
            id: undefined,
            staff_id: null,
            pole: importPole,
            discord_username: row.discord_id,
            discord_id: row.discord_id,
            steam_id: row.steam_id || null,
            grade: row.grade,
            tickets_ig: null,
            tickets_discord: null,
            bda_count: null,
            nb_animations: importPole === Pole.ANIMATION ? total : null,
            nb_animations_mj: importPole === Pole.MJ ? total : null,
            nb_animations_mj_p: null,
            nb_animations_mj_m: row.moyenne,
            nb_animations_mj_g: row.grande,
            nb_heures_mj: row.heures,
            nb_candidatures_ecrites: null,
            nb_oraux: null,
            commentaire: row.commentaire,
            presence_reunion: false,
            montant: row.montant,
            is_inactive: row.montant === 0,
            confirmed_by_coordinator: false,
            confirmed_at: null,
            modified_by_coordinator: false,
            coordinator_modified_at: null,
            _isNew: true,
            _dirty: true,
          });
        }
      }

      return updated;
    });
    setHasLocalChanges(true);

    const msg = newRows.length > 0
      ? `${rows.length} entrées importées, ${newRows.length} membre(s) créé(s)`
      : `${rows.length} entrées importées`;
    showToast(msg);
  }

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
        nb_animations_mj_p: e.nb_animations_mj_p,
        nb_animations_mj_m: e.nb_animations_mj_m,
        nb_animations_mj_g: e.nb_animations_mj_g,
        nb_heures_mj: e.nb_heures_mj,
        nb_candidatures_ecrites: e.nb_candidatures_ecrites,
        nb_oraux: e.nb_oraux,
        commentaire: e.commentaire,
        presence_reunion: e.presence_reunion,
        montant: e.montant,
        is_inactive: e.is_inactive,
      }));

    if (entriesToSave.length === 0) return;

    try {
      await saveEntries.mutateAsync({
        week_id: week.id,
        pole: selectedPole,
        entries: entriesToSave,
      });
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
        nb_animations_mj_p: e.nb_animations_mj_p,
        nb_animations_mj_m: e.nb_animations_mj_m,
        nb_animations_mj_g: e.nb_animations_mj_g,
        nb_heures_mj: e.nb_heures_mj,
        nb_candidatures_ecrites: e.nb_candidatures_ecrites,
        nb_oraux: e.nb_oraux,
        commentaire: e.commentaire,
        presence_reunion: e.presence_reunion,
        montant: e.montant,
        is_inactive: e.is_inactive,
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{tr.nav.payroll}</h1>
          <p className="mt-1 text-sm text-text-secondary">{weekLabel}</p>
        </div>
        <WeekStatusBadge status={week.status} className="px-3 py-1 text-sm" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {availablePoles.length > 1 && (
          <div className="w-[200px]">
            <SearchableSelect
              value={selectedPole}
              onChange={(value) => setSelectedPole(value as Pole)}
              options={poleOptions}
              placeholder={tr.payroll.selectPole}
              clearable={false}
            />
          </div>
        )}
        {!isBlocked && currentSubmission?.submitted_by_username && (
          <span className="text-xs text-text-tertiary">
            {tr.global.submittedBy} <span className="font-medium text-text-secondary">{currentSubmission.submitted_by_username}</span>
          </span>
        )}
        {!isBlocked && editable && (
          <div className="ml-auto flex items-center gap-2">
            {inactiveCount > 0 && (
              <Button size="sm" variant="ghost" onClick={handleMarkAllActive}>
                <Eye className="h-4 w-4" />
                {tr.payroll.actions.markAllActive} ({inactiveCount})
              </Button>
            )}
            {zeroActiveCount > 0 && (
              <Button size="sm" variant="ghost" onClick={handleMarkZeroInactive}>
                <EyeOff className="h-4 w-4" />
                {tr.payroll.actions.markZeroInactive} ({zeroActiveCount})
              </Button>
            )}
            {weekStatus === 'open' && canImportStructuredCsv && (
              <Button size="sm" variant="secondary" onClick={() => setPayrollCsvImportOpen(true)}>
                <Upload className="h-4 w-4" />
                {tr.payroll.actions.importCsv}
              </Button>
            )}
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

      {isBlocked ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3">
          <Lock className="h-8 w-8 text-text-tertiary" />
          <p className="text-sm font-medium text-text-primary">Saisie en cours par <span className="text-accent">{lockedBy}</span></p>
          <p className="text-xs text-text-tertiary">Cette page se débloquera automatiquement dès qu'il aura terminé.</p>
        </div>
      ) : (
        <>
          {weekStatus === 'locked' && (
            <div className="glass-card rounded-xl p-4 text-center text-sm text-text-tertiary">
              {tr.payroll.lockedMessage}
            </div>
          )}
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
        </>
      )}

      <PayrollCsvImportModal
        isOpen={payrollCsvImportOpen}
        pole={selectedPole === Pole.ANIMATION ? Pole.ANIMATION : Pole.MJ}
        onClose={() => setPayrollCsvImportOpen(false)}
        onImport={handlePayrollCsvImport}
      />
    </div>
  );
}
