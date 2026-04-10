import { useState, useMemo, useCallback } from 'react';
import { Plus, Upload, UserX, Check, X } from 'lucide-react';
import { t } from '@/i18n';
import { Role, Pole, type PoleMember } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { isCoordinateur, isGerantStaff, getPoleForRole, isPoleResponsible } from '@/lib/utils';
import { POLE_LABELS, GRADES_BY_POLE, getGradeColor, compareByGradeThenName, GRADE_TO_ROLE, ROLE_HIERARCHY, RESP_PAYROLL_POLE } from '@/lib/constants';
import { useMembers, useAddMember, useUpdateMember, useDeleteMember, useBulkImport } from '@/hooks/queries/use-members';
import Button from '@/components/ui/button';
import SearchableSelect from '@/components/ui/searchable-select';
import Spinner from '@/components/ui/spinner';
import Badge from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import ConfirmModal from '@/components/ui/confirm-modal';
import AddPoleMemberModal from '@/components/members/add-pole-member-modal';
import BulkImportMembersModal from '@/components/members/bulk-import-members-modal';
import { showToast } from '@/components/ui/show-toast';

const ALL_OPTION = 'all';

function MergedGradeBadge({ entry, gradeOptions, onChangeGrade, onDeactivate }: {
  entry: PoleMember;
  gradeOptions: string[];
  onChangeGrade: (grade: string) => void;
  onDeactivate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.grade);
  const colors = getGradeColor(entry.grade);

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <select
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-7 rounded border border-border-secondary bg-white/[0.05] px-1.5 text-xs text-text-primary focus:border-accent/40 focus:outline-none"
          autoFocus
        >
          {gradeOptions.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <button
          onClick={() => { if (draft !== entry.grade) onChangeGrade(draft); setEditing(false); }}
          className="rounded p-0.5 text-success hover:bg-success/10"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => { setDraft(entry.grade); setEditing(false); }} className="rounded p-0.5 text-text-tertiary hover:bg-white/[0.05]">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <span
      className="group inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <button
        onClick={() => { setDraft(entry.grade); setEditing(true); }}
        className="hover:underline"
        title="Modifier le grade"
      >
        {entry.grade}
      </button>
      <span className="opacity-50">({POLE_LABELS[entry.pole as Pole] ?? entry.pole})</span>
      {entry.is_active && (
        <button
          onClick={onDeactivate}
          className="ml-0.5 rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/20"
          title="Retirer ce rôle"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

interface MergedMember {
  discord_username: string;
  discord_id: string;
  steam_id: string | null;
  is_active: boolean;
  /** All entries for this user (one per pole) */
  entries: PoleMember[];
  /** Best (highest) role hierarchy value for sorting */
  bestPriority: number;
}

function getDefaultPole(isCoord: boolean, isGerant: boolean, userPole: Pole | null): string {
  if (isCoord) return ALL_OPTION;
  if (isGerant) return Pole.ADMINISTRATION;
  return userPole ?? ALL_OPTION;
}

function getAvailablePoles(isCoord: boolean, isGerant: boolean, userPole: Pole | null): Pole[] {
  if (isCoord) return Object.values(Pole);
  if (isGerant) return Object.values(Pole).filter((p) => p !== Pole.GERANCE);
  if (userPole) return [userPole];
  return Object.values(Pole);
}

interface InlineEditCellProps {
  value: string;
  onSave: (value: string) => void;
  options?: string[];
  renderValue?: (value: string) => React.ReactNode;
}

function InlineEditCell({ value, onSave, options, renderValue }: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleStart() {
    setDraft(value);
    setEditing(true);
  }

  function handleConfirm() {
    if (draft !== value) {
      onSave(draft);
    }
    setEditing(false);
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        onClick={handleStart}
        className="cursor-pointer rounded px-1 py-0.5 text-left text-sm text-text-primary transition-colors hover:bg-white/[0.05]"
      >
        {renderValue ? renderValue(value) : (value || '—')}
      </button>
    );
  }

  if (options) {
    return (
      <div className="flex items-center gap-1">
        <select
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-7 rounded border border-border-secondary bg-white/[0.05] px-1.5 text-xs text-text-primary focus:border-accent/40 focus:outline-none"
          autoFocus
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <button onClick={handleConfirm} className="rounded p-0.5 text-success hover:bg-success/10">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={handleCancel} className="rounded p-0.5 text-text-tertiary hover:bg-white/[0.05]">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleConfirm();
          if (e.key === 'Escape') handleCancel();
        }}
        className="h-7 w-full rounded border border-border-secondary bg-white/[0.05] px-1.5 text-xs text-text-primary focus:border-accent/40 focus:outline-none"
        autoFocus
      />
      <button onClick={handleConfirm} className="rounded p-0.5 text-success hover:bg-success/10">
        <Check className="h-3.5 w-3.5" />
      </button>
      <button onClick={handleCancel} className="rounded p-0.5 text-text-tertiary hover:bg-white/[0.05]">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function MembersPage() {
  const tr = t();
  const user = useAuthStore((s) => s.user);
  const isCoord = user ? isCoordinateur(user.role) : false;
  const isGerant = user ? isGerantStaff(user.role) : false;
  const userPole = user ? (RESP_PAYROLL_POLE[user.role as Role] ?? getPoleForRole(user.role)) : null;
  const canManage = isCoord || isGerant || (user ? isPoleResponsible(user.role) || user.role === Role.GERANT_EQUILIBRAGE : false);

  const availablePoles = useMemo(
    () => getAvailablePoles(isCoord, isGerant, userPole),
    [isCoord, isGerant, userPole],
  );

  const [selectedPole, setSelectedPole] = useState<string>(
    getDefaultPole(isCoord, isGerant, userPole),
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<PoleMember | null>(null);

  const isAllView = selectedPole === ALL_OPTION;
  const activePole: Pole | null = isAllView ? null : (selectedPole as Pole);

  const { data: rawMembers, isLoading, error } = useMembers(isAllView ? null : selectedPole);
  const addMember = useAddMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const bulkImport = useBulkImport();

  const members = useMemo(() => {
    if (!rawMembers) return undefined;
    if (!isAllView) {
      return [...rawMembers].sort((a, b) => compareByGradeThenName(a, b, a.pole as Pole));
    }
    return [...rawMembers].sort((a, b) => {
      const roleA = GRADE_TO_ROLE[a.grade];
      const roleB = GRADE_TO_ROLE[b.grade];
      const pa = roleA ? ROLE_HIERARCHY[roleA] : 99;
      const pb = roleB ? ROLE_HIERARCHY[roleB] : 99;
      if (pa !== pb) return pa - pb;
      return a.discord_username.localeCompare(b.discord_username);
    });
  }, [rawMembers, isAllView]);

  /** In all-view, merge members with the same discord_id into one row */
  const mergedMembers = useMemo(() => {
    if (!isAllView || !members) return null;
    const map = new Map<string, MergedMember>();
    for (const m of members) {
      const role = GRADE_TO_ROLE[m.grade];
      const priority = role ? ROLE_HIERARCHY[role] : 99;
      const existing = map.get(m.discord_id);
      if (existing) {
        existing.entries.push(m);
        if (priority < existing.bestPriority) {
          existing.bestPriority = priority;
          existing.discord_username = m.discord_username;
          existing.steam_id = m.steam_id ?? existing.steam_id;
        }
        if (m.is_active) existing.is_active = true;
      } else {
        map.set(m.discord_id, {
          discord_username: m.discord_username,
          discord_id: m.discord_id,
          steam_id: m.steam_id,
          is_active: m.is_active,
          entries: [m],
          bestPriority: priority,
        });
      }
    }
    return [...map.values()].sort((a, b) => {
      if (a.bestPriority !== b.bestPriority) return a.bestPriority - b.bestPriority;
      return a.discord_username.localeCompare(b.discord_username);
    });
  }, [isAllView, members]);

  const poleOptions = [
    ...(isCoord ? [{ value: ALL_OPTION, label: tr.members.allStaffs }] : []),
    ...availablePoles.map((p) => ({ value: p, label: POLE_LABELS[p] })),
  ];

  const poleCounts = useMemo(() => {
    if (!rawMembers) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const m of rawMembers) {
      map.set(m.pole, (map.get(m.pole) ?? 0) + 1);
    }
    return map;
  }, [rawMembers]);

  const grades = activePole ? (GRADES_BY_POLE[activePole] ?? []) : [];

  const handleAddMember = useCallback(async (data: { pole?: string; discord_username: string; discord_id: string; steam_id: string; grade: string }) => {
    const pole = data.pole ?? activePole;
    if (!pole) return;
    try {
      await addMember.mutateAsync({
        pole,
        discord_username: data.discord_username,
        discord_id: data.discord_id,
        steam_id: data.steam_id || undefined,
        grade: data.grade,
      });
      showToast(tr.members.toast.memberAdded);
      setShowAddModal(false);
    } catch {
      showToast(tr.members.toast.errorAdd, 'error');
    }
  }, [addMember, activePole, tr]);

  const handleBulkImport = useCallback(async (parsedMembers: { discord_username: string; discord_id: string; steam_id: string; grade: string; pole?: string }[], pole?: string) => {
    try {
      // If members have individual poles (from CSV with pole column), group and import per pole
      const hasPerMemberPoles = parsedMembers.some((m) => m.pole);
      if (hasPerMemberPoles) {
        const byPole = new Map<string, typeof parsedMembers>();
        for (const m of parsedMembers) {
          const p = m.pole;
          if (!p) continue;
          if (!byPole.has(p)) byPole.set(p, []);
          byPole.get(p)!.push(m);
        }
        let totalAdded = 0;
        let totalReactivated = 0;
        let totalSkipped = 0;
        for (const [poleName, members] of byPole) {
          const result = await bulkImport.mutateAsync({
            pole: poleName,
            members: members.map((m) => ({
              discord_username: m.discord_username,
              discord_id: m.discord_id,
              steam_id: m.steam_id || undefined,
              grade: m.grade,
            })),
          });
          totalAdded += result.added;
          totalReactivated += result.reactivated;
          totalSkipped += result.skipped;
        }
        showToast(
          tr.members.toast.bulkImported
            .replace('{added}', String(totalAdded))
            .replace('{reactivated}', String(totalReactivated))
            .replace('{skipped}', String(totalSkipped)),
        );
        setShowImportModal(false);
        return;
      }

      // Single pole import
      const targetPole = pole ?? activePole;
      if (!targetPole) return;
      const result = await bulkImport.mutateAsync({
        pole: targetPole,
        members: parsedMembers.map((m) => ({
          discord_username: m.discord_username,
          discord_id: m.discord_id,
          steam_id: m.steam_id || undefined,
          grade: m.grade,
        })),
      });
      showToast(
        tr.members.toast.bulkImported
          .replace('{added}', String(result.added))
          .replace('{reactivated}', String(result.reactivated))
          .replace('{skipped}', String(result.skipped)),
      );
      setShowImportModal(false);
    } catch {
      showToast(tr.members.toast.errorBulk, 'error');
    }
  }, [bulkImport, activePole, tr]);

  const handleUpdateField = useCallback(async (memberId: string, field: string, value: string) => {
    try {
      await updateMember.mutateAsync({ member_id: memberId, [field]: value });
      showToast(tr.members.toast.memberUpdated);
    } catch {
      showToast(tr.members.toast.errorUpdate, 'error');
    }
  }, [updateMember, tr]);

  const handleDeactivate = useCallback(async () => {
    if (!deactivateTarget) return;
    try {
      await deleteMember.mutateAsync(deactivateTarget.id);
      showToast(tr.members.toast.memberDeactivated);
      setDeactivateTarget(null);
    } catch {
      showToast(tr.members.toast.errorDeactivate, 'error');
    }
  }, [deactivateTarget, deleteMember, tr]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-danger">{tr.members.toast.errorLoad}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{tr.members.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{tr.members.subtitle}</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {poleOptions.length > 1 && (
          <div className="w-[220px]">
            <SearchableSelect
              value={selectedPole}
              onChange={(value) => setSelectedPole(value)}
              options={poleOptions}
              clearable={false}
            />
          </div>
        )}
        {canManage && (
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowImportModal(true)}>
              <Upload className="h-4 w-4" />
              {tr.members.bulkImport}
            </Button>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />
              {tr.members.addMember}
            </Button>
          </div>
        )}
      </div>

      {/* Pole stats */}
      {rawMembers && rawMembers.length > 0 && (
        isAllView ? (
          <div className="flex flex-wrap gap-2">
            {availablePoles.map((p) => {
              const count = poleCounts.get(p);
              if (!count) return null;
              return (
                <div key={p} className="glass-card flex items-center gap-2 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-text-secondary">{POLE_LABELS[p]}</span>
                  <span className="text-sm font-semibold text-text-primary">{count}</span>
                  <span className="text-xs text-text-tertiary">{count > 1 ? tr.members.members_plural : tr.members.member}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            {rawMembers.length}&nbsp;{rawMembers.length > 1 ? tr.members.members_plural : tr.members.member}
          </p>
        )
      )}

      {/* Table */}
      {isAllView ? (
        /* Merged view for "Tous les staffs" */
        !mergedMembers || mergedMembers.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center text-sm text-text-tertiary">
            {tr.members.noMembers}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableCell header>{tr.members.fields.discordUsername}</TableCell>
                <TableCell header>{tr.members.fields.discordId}</TableCell>
                <TableCell header>{tr.members.fields.steamId}</TableCell>
                <TableCell header>Pôle / Grade</TableCell>
                <TableCell header>{tr.members.fields.status}</TableCell>
                <TableCell header>{tr.members.fields.actions}</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {mergedMembers.map((merged) => (
                <TableRow key={merged.discord_id}>
                  <TableCell>
                    <span className="font-medium text-sm">{merged.discord_username}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-text-secondary">{merged.discord_id}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-text-secondary">{merged.steam_id ?? '—'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {merged.entries.map((entry) => {
                        const entryGrades = GRADES_BY_POLE[entry.pole as Pole] ?? [];
                        return (
                          <MergedGradeBadge
                            key={entry.id}
                            entry={entry}
                            gradeOptions={entryGrades}
                            onChangeGrade={(v) => handleUpdateField(entry.id, 'grade', v)}
                            onDeactivate={() => setDeactivateTarget(entry)}
                          />
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={merged.is_active ? 'success' : 'default'}>
                      {merged.is_active ? tr.members.fields.active : tr.members.fields.inactive}
                    </Badge>
                  </TableCell>
                  <TableCell>{''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : (
        /* Single-pole view */
        !members || members.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center text-sm text-text-tertiary">
            {tr.members.noMembers}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableCell header>{tr.members.fields.discordUsername}</TableCell>
                <TableCell header>{tr.members.fields.discordId}</TableCell>
                <TableCell header>{tr.members.fields.steamId}</TableCell>
                <TableCell header>{tr.members.fields.grade}</TableCell>
                <TableCell header>{tr.members.fields.status}</TableCell>
                <TableCell header>{tr.members.fields.actions}</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const memberGrades = GRADES_BY_POLE[member.pole as Pole] ?? [];
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <InlineEditCell
                        value={member.discord_username}
                        onSave={(v) => handleUpdateField(member.id, 'discord_username', v)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-text-secondary">{member.discord_id}</span>
                    </TableCell>
                    <TableCell>
                      <InlineEditCell
                        value={member.steam_id ?? ''}
                        onSave={(v) => handleUpdateField(member.id, 'steam_id', v)}
                      />
                    </TableCell>
                    <TableCell>
                      <InlineEditCell
                        value={member.grade}
                        onSave={(v) => handleUpdateField(member.id, 'grade', v)}
                        options={memberGrades.length > 0 ? memberGrades : (grades.length > 0 ? grades : undefined)}
                        renderValue={(v) => {
                          const colors = getGradeColor(v);
                          return (
                            <span
                              className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
                              style={{ backgroundColor: colors.bg, color: colors.text }}
                            >
                              {v || '—'}
                            </span>
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? 'success' : 'default'}>
                        {member.is_active ? tr.members.fields.active : tr.members.fields.inactive}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.is_active && (
                        <button
                          onClick={() => setDeactivateTarget(member)}
                          className="rounded p-1.5 text-text-tertiary transition-colors hover:bg-danger/10 hover:text-danger"
                          title={tr.common.delete}
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )
      )}

      {/* Modals */}
      <AddPoleMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddMember}
        pole={activePole}
        loading={addMember.isPending}
      />
      <BulkImportMembersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleBulkImport}
        loading={bulkImport.isPending}
        showPoleSelector={isAllView}
      />
      <ConfirmModal
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title={tr.common.delete}
        message={`${tr.admin.confirmDelete} ${deactivateTarget?.discord_username ?? ''} ${tr.admin.confirmDeleteSuffix}`}
        confirmLabel={tr.common.delete}
        variant="danger"
        loading={deleteMember.isPending}
      />
    </div>
  );
}
