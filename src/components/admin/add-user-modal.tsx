import { useState } from 'react';
import Modal from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Select from '@/components/ui/select';
import Button from '@/components/ui/button';
import { Role } from '@/types';
import { ASSIGNABLE_ROLES } from '@/lib/constants';
import { t } from '@/i18n';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { discord_id: string; username: string; role: Role }) => void;
  loading: boolean;
  existingDiscordIds: string[];
}

export default function AddUserModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  existingDiscordIds,
}: AddUserModalProps) {
  const tr = t();
  const [discordId, setDiscordId] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<string>('');
  const [errors, setErrors] = useState<{ discordId?: string; username?: string; role?: string }>({});

  // Reset form when modal opens (React-recommended "store previous props" pattern)
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen && !prevIsOpen) {
    setDiscordId('');
    setUsername('');
    setRole('');
    setErrors({});
  }
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
  }

  function resetForm() {
    setDiscordId('');
    setUsername('');
    setRole('');
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!discordId.trim()) {
      newErrors.discordId = tr.admin.fields.discordId + ' requis';
    } else if (existingDiscordIds.includes(discordId.trim())) {
      newErrors.discordId = tr.admin.toast.discordIdExists;
    }

    if (!username.trim()) {
      newErrors.username = tr.admin.fields.username + ' requis';
    }

    if (!role) {
      newErrors.role = tr.admin.fields.role + ' requis';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      discord_id: discordId.trim(),
      username: username.trim(),
      role: role as Role,
    });
  }

  const roleOptions = ASSIGNABLE_ROLES.map((r) => ({
    value: r,
    label: tr.roles[r as keyof typeof tr.roles],
  }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={tr.admin.addUser}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={tr.admin.fields.discordId}
          value={discordId}
          onChange={(e) => {
            setDiscordId(e.target.value);
            setErrors((prev) => ({ ...prev, discordId: undefined }));
          }}
          placeholder="123456789012345678"
          error={errors.discordId}
        />
        <Input
          label={tr.admin.fields.username}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setErrors((prev) => ({ ...prev, username: undefined }));
          }}
          placeholder="Username"
          error={errors.username}
        />
        <Select
          label={tr.admin.fields.role}
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setErrors((prev) => ({ ...prev, role: undefined }));
          }}
          options={roleOptions}
          placeholder={tr.admin.filters.allRoles}
          error={errors.role}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            {tr.common.cancel}
          </Button>
          <Button type="submit" loading={loading}>
            {tr.admin.addUser}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
