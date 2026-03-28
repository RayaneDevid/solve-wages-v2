import { useState, useMemo } from 'react';
import { Plus, Upload, Pencil, Trash2, Power, Search } from 'lucide-react';
import { t } from '@/i18n';
import { Role } from '@/types';
import type { User } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useBulkImportUsers } from '@/hooks/queries/use-admin';
import Badge from '@/components/ui/badge';
import { ROLE_HIERARCHY, ROLE_LABELS, getGradeColor, getGradeGlobalPriority } from '@/lib/constants';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Spinner from '@/components/ui/spinner';
import { showToast } from '@/components/ui/show-toast';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import AddUserModal from '@/components/admin/add-user-modal';
import EditUserModal from '@/components/admin/edit-user-modal';
import DeleteUserModal from '@/components/admin/delete-user-modal';
import BulkImportUsersModal from '@/components/admin/bulk-import-users-modal';

function formatDateTime(dateStr: string | null, neverLabel: string): string {
  if (!dateStr) return neverLabel;
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

export default function AdminPage() {
  const tr = t();
  const currentUser = useAuthStore((s) => s.user);

  const { data: users, isLoading, isError } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const bulkImportMutation = useBulkImportUsers();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const statusOptions = useMemo(() => [
    { value: 'all', label: tr.admin.filters.allStatuses },
    { value: 'active', label: tr.admin.fields.active },
    { value: 'inactive', label: tr.admin.fields.inactive },
  ], [tr]);

  const roleOptions = useMemo(() => {
    const options = Object.values(Role).map((r) => ({
      value: r,
      label: tr.roles[r as keyof typeof tr.roles],
    }));
    return [{ value: '', label: tr.admin.filters.allRoles }, ...options];
  }, [tr]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users
      .filter((u) => {
        const matchSearch =
          !search ||
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.discord_id.includes(search);
        const matchRole = !roleFilter || u.role === roleFilter;
        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && u.is_active) ||
          (statusFilter === 'inactive' && !u.is_active);
        return matchSearch && matchRole && matchStatus;
      })
      .sort((a, b) => {
        const ha = ROLE_HIERARCHY[a.role] ?? getGradeGlobalPriority(ROLE_LABELS[a.role] ?? a.role);
        const hb = ROLE_HIERARCHY[b.role] ?? getGradeGlobalPriority(ROLE_LABELS[b.role] ?? b.role);
        if (ha !== hb) return ha - hb;
        return a.username.localeCompare(b.username);
      });
  }, [users, search, roleFilter, statusFilter]);

  const existingDiscordIds = useMemo(() => (users ?? []).map((u) => u.discord_id), [users]);

  function handleCreate(data: { discord_id: string; username: string; roles: Role[] }) {
    createMutation.mutate(data, {
      onSuccess: () => {
        showToast(tr.admin.toast.userCreated, 'success');
        setShowAddModal(false);
      },
      onError: () => {
        showToast(tr.admin.toast.errorCreate, 'error');
      },
    });
  }

  function handleUpdate(data: { user_id: string; roles: Role[]; is_active: boolean }) {
    updateMutation.mutate(data, {
      onSuccess: () => {
        showToast(tr.admin.toast.userUpdated, 'success');
        setEditUser(null);
      },
      onError: () => {
        showToast(tr.admin.toast.errorUpdate, 'error');
      },
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        showToast(tr.admin.toast.userDeleted, 'success');
        setDeleteTarget(null);
      },
      onError: () => {
        showToast(tr.admin.toast.errorDelete, 'error');
      },
    });
  }

  function handleToggleActive(user: User) {
    updateMutation.mutate(
      { user_id: user.id, is_active: !user.is_active },
      {
        onSuccess: () => {
          showToast(tr.admin.toast.userUpdated, 'success');
        },
        onError: () => {
          showToast(tr.admin.toast.errorUpdate, 'error');
        },
      },
    );
  }

  function handleBulkImport(users: { discord_id: string; username: string; role: string }[]) {
    bulkImportMutation.mutate({ users }, {
      onSuccess: (result) => {
        showToast(
          tr.admin.toast.bulkImported
            .replace('{added}', String(result.added))
            .replace('{skipped}', String(result.skipped)),
        );
        setShowBulkImportModal(false);
      },
      onError: () => {
        showToast(tr.admin.toast.errorBulkImport, 'error');
      },
    });
  }

  const isSelf = (user: User) => user.id === currentUser?.id;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-danger">{tr.admin.toast.errorLoad}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{tr.admin.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{tr.admin.subtitle}</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-md flex-1">
          <Input
            placeholder={tr.admin.filters.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-[200px]">
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={roleOptions}
          />
        </div>
        <div className="w-40">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowBulkImportModal(true)}>
            <Upload className="h-4 w-4" />
            {tr.members.bulkImport}
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            {tr.admin.addUser}
          </Button>
        </div>
      </div>

      {/* Table with glass card */}
      <Table>
        <TableHeader>
          <tr>
            <TableCell header>{tr.admin.fields.avatar}</TableCell>
            <TableCell header>{tr.admin.fields.username}</TableCell>
            <TableCell header>{tr.admin.fields.discordId}</TableCell>
            <TableCell header>{tr.admin.fields.role}</TableCell>
            <TableCell header>{tr.admin.fields.status}</TableCell>
            <TableCell header>{tr.admin.fields.lastLogin}</TableCell>
            <TableCell header>{tr.admin.fields.actions}</TableCell>
          </tr>
        </TableHeader>
        <TableBody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-12 text-center text-sm text-text-tertiary">
                {tr.common.noData}
              </td>
            </tr>
          ) : (
            filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="h-8 w-8 rounded-full ring-1 ring-border-secondary"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{user.username}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-text-secondary">{user.discord_id}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(user.roles.length > 0 ? user.roles : [user.role]).map((r) => {
                      const colors = getGradeColor(ROLE_LABELS[r]);
                      return (
                        <span
                          key={r}
                          className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {tr.roles[r as keyof typeof tr.roles]}
                        </span>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'success' : 'danger'}>
                    {user.is_active ? tr.admin.fields.active : tr.admin.fields.inactive}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-text-secondary">
                    {formatDateTime(user.last_login_at, tr.admin.fields.never)}
                  </span>
                </TableCell>
                <TableCell>
                  {!isSelf(user) && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditUser(user)}
                        className="rounded-lg p-2 text-text-secondary transition-colors duration-200 hover:bg-white/[0.04] hover:text-text-primary"
                        title={tr.admin.editUser}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={
                          'rounded-lg p-2 transition-colors duration-200 hover:bg-white/[0.04] ' +
                          (user.is_active
                            ? 'text-text-secondary hover:text-warning'
                            : 'text-text-secondary hover:text-success')
                        }
                        title={user.is_active ? tr.admin.deactivateUser : tr.admin.reactivateUser}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="rounded-lg p-2 text-text-secondary transition-colors duration-200 hover:bg-white/[0.04] hover:text-danger"
                        title={tr.admin.deleteUser}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Modals */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreate}
        loading={createMutation.isPending}
        existingDiscordIds={existingDiscordIds}
      />
      <EditUserModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        onSubmit={handleUpdate}
        loading={updateMutation.isPending}
        user={editUser}
      />
      <DeleteUserModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        user={deleteTarget}
      />
      <BulkImportUsersModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImport={handleBulkImport}
        loading={bulkImportMutation.isPending}
        existingDiscordIds={existingDiscordIds}
      />
    </div>
  );
}
