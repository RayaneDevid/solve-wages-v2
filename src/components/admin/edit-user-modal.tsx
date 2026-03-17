import { useState } from 'react';
import Modal from '@/components/ui/modal';
import Select from '@/components/ui/select';
import Switch from '@/components/ui/switch';
import Button from '@/components/ui/button';
import { Role } from '@/types';
import type { User } from '@/types';
import { ASSIGNABLE_ROLES } from '@/lib/constants';
import { t } from '@/i18n';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { user_id: string; role: Role; is_active: boolean }) => void;
  loading: boolean;
  user: User | null;
}

export default function EditUserModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  user,
}: EditUserModalProps) {
  const tr = t();
  const [role, setRole] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  // Sync form from user prop (React-recommended "store previous props" pattern)
  const [prevUser, setPrevUser] = useState<User | null>(null);
  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setRole(user.role);
      setIsActive(user.is_active);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    onSubmit({
      user_id: user.id,
      role: role as Role,
      is_active: isActive,
    });
  }

  const roleOptions = ASSIGNABLE_ROLES.map((r) => ({
    value: r,
    label: tr.roles[r as keyof typeof tr.roles],
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tr.admin.editUser}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-secondary">
            {tr.admin.fields.username}
          </span>
          <span className="text-sm text-text-primary">{user?.username}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-secondary">
            {tr.admin.fields.discordId}
          </span>
          <span className="text-sm text-text-primary">{user?.discord_id}</span>
        </div>
        <Select
          label={tr.admin.fields.role}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={roleOptions}
        />
        <Switch
          checked={isActive}
          onChange={setIsActive}
          label={isActive ? tr.admin.fields.active : tr.admin.fields.inactive}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {tr.common.cancel}
          </Button>
          <Button type="submit" loading={loading}>
            {tr.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
