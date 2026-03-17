import { useState, useMemo, useCallback } from 'react';
import { Plus, Upload, UserX, Check, X } from 'lucide-react';
import { t } from '@/i18n';
import { Pole, type PoleMember } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { isCoordinateur, isGerantStaff, getPoleForRole } from '@/lib/utils';
import { POLE_LABELS, GRADES_BY_POLE, getGradeColor, compareByGradeThenName } from '@/lib/constants';
import { useMembers, useAddMember, useUpdateMember, useDeleteMember, useBulkImport } from '@/hooks/queries/use-members';
import Button from '@/components/ui/button';
import Select from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import Badge from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import ConfirmModal from '@/components/ui/confirm-modal';
import AddPoleMemberModal from '@/components/members/add-pole-member-modal';
import BulkImportMembersModal from '@/components/members/bulk-import-members-modal';
import { showToast } from '@/components/ui/show-toast';

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
  const userPole = user ? getPoleForRole(user.role) : null;

  const availablePoles = useMemo(
    () => getAvailablePoles(isCoord, isGerant, userPole),
    [isCoord, isGerant, userPole],
  );

  const [selectedPole, setSelectedPole] = useState<Pole>(
    getDefaultPole(isCoord, isGerant, userPole),
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<PoleMember | null>(null);

  const { data: rawMembers, isLoading, error } = useMembers(selectedPole);
  const addMember = useAddMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const bulkImport = useBulkImport();

  const members = useMemo(() => {
    if (!rawMembers) return undefined;
    return [...rawMembers].sort((a, b) => compareByGradeThenName(a, b, selectedPole));
  }, [rawMembers, selectedPole]);

  const poleOptions = availablePoles.map((p) => ({
    value: p,
    label: POLE_LABELS[p],
  }));

  const grades = GRADES_BY_POLE[selectedPole] ?? [];

  const handleAddMember = useCallback(async (data: { discord_username: string; discord_id: string; steam_id: string; grade: string }) => {
    try {
      await addMember.mutateAsync({
        pole: selectedPole,
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
  }, [addMember, selectedPole, tr]);

  const handleBulkImport = useCallback(async (parsedMembers: { discord_username: string; discord_id: string; steam_id: string; grade: string }[]) => {
    try {
      const result = await bulkImport.mutateAsync({
        pole: selectedPole,
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
  }, [bulkImport, selectedPole, tr]);

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
        {availablePoles.length > 1 && (
          <div className="w-[200px]">
            <Select
              value={selectedPole}
              onChange={(e) => setSelectedPole(e.target.value as Pole)}
              options={poleOptions}
            />
          </div>
        )}
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
      </div>

      {/* Table */}
      {!members || members.length === 0 ? (
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
            {members.map((member) => (
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
                    options={grades.length > 0 ? grades : undefined}
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
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modals */}
      <AddPoleMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddMember}
        pole={selectedPole}
        loading={addMember.isPending}
      />
      <BulkImportMembersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleBulkImport}
        loading={bulkImport.isPending}
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
