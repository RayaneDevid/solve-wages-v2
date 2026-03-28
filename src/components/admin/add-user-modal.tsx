import { useState } from 'react';
import Modal from '@/components/ui/modal';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { Role, Pole } from '@/types';
import { ASSIGNABLE_ROLES, ROLE_TO_POLE, ROLE_LABELS, POLE_LABELS } from '@/lib/constants';
import { t } from '@/i18n';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { discord_id: string; username: string; roles: Role[] }) => void;
  loading: boolean;
  existingDiscordIds: string[];
}

const POLE_ORDER: Pole[] = [
  Pole.GERANCE, Pole.ADMINISTRATION, Pole.RESPONSABLES, Pole.MODERATION, Pole.ANIMATION,
  Pole.MJ, Pole.DOUANE, Pole.BUILDER, Pole.LORE, Pole.EQUILIBRAGE_PVP,
  Pole.COMMUNITY_MANAGER,
];

export default function AddUserModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  existingDiscordIds,
}: AddUserModalProps) {
  const tr = t();
  const rolesByPole = POLE_ORDER.map((pole) => ({
    pole,
    label: POLE_LABELS[pole],
    roles: ASSIGNABLE_ROLES.filter((r) => ROLE_TO_POLE[r] === pole),
  })).filter((g) => g.roles.length > 0);
  const [discordId, setDiscordId] = useState('');
  const [username, setUsername] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Set<Role>>(new Set());
  const [errors, setErrors] = useState<{ discordId?: string; username?: string; roles?: string }>({});

  // Reset form when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen && !prevIsOpen) {
    setDiscordId('');
    setUsername('');
    setSelectedRoles(new Set());
    setErrors({});
  }
  if (isOpen !== prevIsOpen) setPrevIsOpen(isOpen);

  function handleClose() {
    setDiscordId('');
    setUsername('');
    setSelectedRoles(new Set());
    setErrors({});
    onClose();
  }

  function toggleRole(role: Role) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
    setErrors((prev) => ({ ...prev, roles: undefined }));
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

    if (selectedRoles.size === 0) {
      newErrors.roles = tr.admin.fields.role + ' requis';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      discord_id: discordId.trim(),
      username: username.trim(),
      roles: [...selectedRoles],
    });
  }

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

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-secondary">{tr.admin.fields.role}</span>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
            <div className="flex flex-col gap-4">
              {rolesByPole.map(({ pole, label, roles }) => (
                <div key={pole}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {roles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={[
                          'rounded px-2 py-1 text-xs transition-colors',
                          selectedRoles.has(role)
                            ? 'bg-accent-orange/20 text-accent-orange ring-1 ring-accent-orange/40'
                            : 'bg-white/[0.05] text-text-secondary hover:bg-white/[0.09]',
                        ].join(' ')}
                      >
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {errors.roles && (
            <p className="text-xs text-danger">{errors.roles}</p>
          )}
          {selectedRoles.size > 0 && (
            <p className="text-xs text-text-tertiary">
              {selectedRoles.size} rôle{selectedRoles.size > 1 ? 's' : ''} sélectionné{selectedRoles.size > 1 ? 's' : ''}
            </p>
          )}
        </div>

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
