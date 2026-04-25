import { useState, useMemo } from 'react';
import Modal from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import { t } from '@/i18n';
import { GRADES_BY_POLE, POLE_LABELS, getGradeColor } from '@/lib/constants';
import { Pole } from '@/types';
import { useMembers } from '@/hooks/queries/use-members';
import { Search } from 'lucide-react';

type Mode = 'manual' | 'from_existing';

export interface NewPoleMemberData {
  pole?: string;
  discord_username: string;
  discord_id: string;
  steam_id: string;
  grade: string;
}

interface EligibleMember {
  discord_username: string;
  discord_id: string;
  steam_id: string | null;
  poleGrades: Array<{ pole: string; grade: string }>;
}

interface AddPoleMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: NewPoleMemberData) => void;
  onBulkAdd?: (members: NewPoleMemberData[]) => void;
  pole: Pole | null;
  loading?: boolean;
}

export default function AddPoleMemberModal({
  isOpen,
  onClose,
  onAdd,
  onBulkAdd,
  pole,
  loading,
}: AddPoleMemberModalProps) {
  const tr = t();

  const [mode, setMode] = useState<Mode>('manual');
  const [selectedPole, setSelectedPole] = useState<string>(pole ?? '');

  // Manual form state
  const [form, setForm] = useState<NewPoleMemberData>({
    discord_username: '',
    discord_id: '',
    steam_id: '',
    grade: '',
  });

  // From-existing state
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkGrade, setBulkGrade] = useState('');

  const showPoleSelector = pole === null;
  const effectivePole = showPoleSelector ? selectedPole : pole;
  const grades = effectivePole ? (GRADES_BY_POLE[effectivePole as Pole] ?? []) : [];
  const gradeOptions = grades.map((g) => ({ value: g, label: g }));

  const poleOptions = Object.values(Pole).map((p) => ({
    value: p,
    label: POLE_LABELS[p],
  }));

  const { data: allMembers, isLoading: isLoadingAll } = useMembers(null);

  const eligibleMembers = useMemo<EligibleMember[]>(() => {
    if (!allMembers || !effectivePole) return [];
    const inPole = new Set(
      allMembers.filter((m) => m.pole === effectivePole && m.is_active).map((m) => m.discord_id),
    );
    const map = new Map<string, EligibleMember>();
    for (const m of allMembers) {
      if (!m.is_active || inPole.has(m.discord_id)) continue;
      const existing = map.get(m.discord_id);
      if (existing) {
        existing.poleGrades.push({ pole: m.pole, grade: m.grade });
      } else {
        map.set(m.discord_id, {
          discord_username: m.discord_username,
          discord_id: m.discord_id,
          steam_id: m.steam_id,
          poleGrades: [{ pole: m.pole, grade: m.grade }],
        });
      }
    }
    return [...map.values()].sort((a, b) =>
      a.discord_username.localeCompare(b.discord_username),
    );
  }, [allMembers, effectivePole]);

  const filteredEligible = useMemo(() => {
    if (!search.trim()) return eligibleMembers;
    const s = search.toLowerCase();
    return eligibleMembers.filter(
      (m) =>
        m.discord_username.toLowerCase().includes(s) ||
        m.discord_id.includes(s),
    );
  }, [eligibleMembers, search]);

  // Auto-select grade when pole has only one option
  const effectiveBulkGrade =
    bulkGrade || (grades.length === 1 ? grades[0] : '');

  function toggleId(discordId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(discordId)) next.delete(discordId);
      else next.add(discordId);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filteredEligible.length && filteredEligible.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEligible.map((m) => m.discord_id)));
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.discord_username || !form.discord_id || !form.grade) return;
    if (showPoleSelector && !selectedPole) return;
    onAdd({ ...form, ...(showPoleSelector ? { pole: selectedPole } : {}) });
    setForm({ discord_username: '', discord_id: '', steam_id: '', grade: '' });
    if (showPoleSelector) setSelectedPole('');
  }

  function handleBulkSubmit() {
    if (!onBulkAdd || selectedIds.size === 0 || !effectiveBulkGrade || !effectivePole) return;
    const membersData: NewPoleMemberData[] = eligibleMembers
      .filter((m) => selectedIds.has(m.discord_id))
      .map((m) => ({
        pole: effectivePole,
        discord_username: m.discord_username,
        discord_id: m.discord_id,
        steam_id: m.steam_id ?? '',
        grade: effectiveBulkGrade,
      }));
    onBulkAdd(membersData);
    setSelectedIds(new Set());
    setBulkGrade('');
    setSearch('');
  }

  function handleClose() {
    setMode('manual');
    setSelectedIds(new Set());
    setBulkGrade('');
    setSearch('');
    setForm({ discord_username: '', discord_id: '', steam_id: '', grade: '' });
    if (showPoleSelector) setSelectedPole('');
    onClose();
  }

  const allFilteredSelected =
    filteredEligible.length > 0 &&
    filteredEligible.every((m) => selectedIds.has(m.discord_id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={tr.members.addModal.title}
      className="max-w-[540px]"
    >
      {/* Tab selector */}
      {onBulkAdd && (
        <div className="mb-5 flex gap-1 rounded-lg bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-white/[0.08] text-text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tr.members.addModal.manual}
          </button>
          <button
            type="button"
            onClick={() => setMode('from_existing')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === 'from_existing'
                ? 'bg-white/[0.08] text-text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tr.members.addModal.fromExisting}
          </button>
        </div>
      )}

      {mode === 'manual' ? (
        /* ── Mode Manuel ── */
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">{tr.members.addModal.description}</p>
          {showPoleSelector && (
            <Select
              label="Pôle"
              value={selectedPole}
              onChange={(e) => {
                setSelectedPole(e.target.value);
                setForm((f) => ({ ...f, grade: '' }));
              }}
              options={poleOptions}
              placeholder="Sélectionner un pôle"
              required
            />
          )}
          <Input
            label={tr.members.fields.discordUsername}
            value={form.discord_username}
            onChange={(e) => setForm((f) => ({ ...f, discord_username: e.target.value }))}
            required
          />
          <Input
            label={tr.members.fields.discordId}
            value={form.discord_id}
            onChange={(e) => setForm((f) => ({ ...f, discord_id: e.target.value }))}
            required
          />
          <Input
            label={tr.members.fields.steamId}
            value={form.steam_id}
            onChange={(e) => setForm((f) => ({ ...f, steam_id: e.target.value }))}
          />
          {grades.length > 0 ? (
            <Select
              label={tr.members.fields.grade}
              value={form.grade}
              onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
              options={gradeOptions}
              placeholder={tr.members.fields.grade}
              required
            />
          ) : (
            <Input
              label={tr.members.fields.grade}
              value={form.grade}
              onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
              required
            />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              {tr.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={
                !form.discord_username ||
                !form.discord_id ||
                !form.grade ||
                (showPoleSelector && !selectedPole)
              }
              loading={loading}
            >
              {tr.members.addMember}
            </Button>
          </div>
        </form>
      ) : (
        /* ── Mode Depuis un autre pôle ── */
        <div className="flex flex-col gap-3">
          {showPoleSelector && (
            <Select
              label="Pôle cible"
              value={selectedPole}
              onChange={(e) => {
                setSelectedPole(e.target.value);
                setSelectedIds(new Set());
                setBulkGrade('');
              }}
              options={poleOptions}
              placeholder="Sélectionner un pôle"
            />
          )}

          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tr.members.addModal.searchMembers}
              className="w-full rounded-lg border border-border-secondary bg-white/[0.04] py-1.5 pl-8 pr-3 text-sm text-text-primary placeholder-text-tertiary focus:border-accent/40 focus:outline-none"
            />
          </div>

          {/* Member list */}
          {isLoadingAll ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner size="sm" />
            </div>
          ) : !effectivePole ? (
            <p className="py-4 text-center text-sm text-text-tertiary">
              Sélectionnez un pôle cible.
            </p>
          ) : eligibleMembers.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-tertiary">
              {tr.members.addModal.noEligible}
            </p>
          ) : (
            <div className="rounded-lg border border-border-secondary">
              {/* Select all header */}
              <div className="flex items-center gap-3 border-b border-border-secondary px-3 py-2">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 accent-accent"
                />
                <span className="text-xs text-text-tertiary">
                  {allFilteredSelected
                    ? tr.members.addModal.deselectAll
                    : tr.members.addModal.selectAll}
                  {filteredEligible.length !== eligibleMembers.length && (
                    <span className="ml-1 opacity-60">
                      ({filteredEligible.length} / {eligibleMembers.length})
                    </span>
                  )}
                </span>
                {selectedIds.size > 0 && (
                  <span className="ml-auto rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                    {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Rows */}
              <div className="max-h-56 overflow-y-auto">
                {filteredEligible.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-text-tertiary">
                    Aucun résultat.
                  </p>
                ) : (
                  filteredEligible.map((member) => {
                    const checked = selectedIds.has(member.discord_id);
                    return (
                      <button
                        key={member.discord_id}
                        type="button"
                        onClick={() => toggleId(member.discord_id)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-white/[0.04] ${
                          checked ? 'bg-accent/5' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleId(member.discord_id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-3.5 w-3.5 shrink-0 accent-accent"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {member.discord_username}
                          </p>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {member.poleGrades.map(({ pole: pg, grade }) => {
                              const colors = getGradeColor(grade);
                              return (
                                <span
                                  key={pg}
                                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  {grade}
                                  <span className="opacity-60">
                                    · {POLE_LABELS[pg as Pole] ?? pg}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Grade for target pole */}
          {effectivePole && grades.length > 1 && (
            <Select
              label={tr.members.addModal.gradeForAll}
              value={bulkGrade}
              onChange={(e) => setBulkGrade(e.target.value)}
              options={gradeOptions}
              placeholder={tr.members.fields.grade}
            />
          )}
          {effectivePole && grades.length === 1 && (
            <p className="text-xs text-text-tertiary">
              Grade attribué : <span className="font-medium text-text-primary">{grades[0]}</span>
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={handleClose}>
              {tr.common.cancel}
            </Button>
            <Button
              type="button"
              onClick={handleBulkSubmit}
              disabled={
                selectedIds.size === 0 ||
                !effectiveBulkGrade ||
                !effectivePole
              }
              loading={loading}
            >
              {tr.members.addModal.addCount.replace('{count}', String(selectedIds.size))}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
