import { useState } from 'react';
import Switch from '@/components/ui/switch';
import Button from '@/components/ui/button';
import Modal from '@/components/ui/modal';
import { Role, Pole } from '@/types';
import type { User } from '@/types';
import { ASSIGNABLE_ROLES, ROLE_TO_POLE, ROLE_LABELS, POLE_LABELS } from '@/lib/constants';
import { t } from '@/i18n';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { user_id: string; roles: Role[]; is_active: boolean }) => void;
  loading: boolean;
  user: User | null;
}

const POLE_ORDER: Pole[] = [
  Pole.GERANCE, Pole.ADMINISTRATION, Pole.RESPONSABLES, Pole.MODERATION, Pole.ANIMATION,
  Pole.MJ, Pole.DOUANE, Pole.BUILDER, Pole.LORE, Pole.EQUILIBRAGE_PVP,
  Pole.COMMUNITY_MANAGER,
];

export default function EditUserModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  user,
}: EditUserModalProps) {
  const tr = t();
  const rolesByPole = POLE_ORDER.map((pole) => ({
    pole,
    label: POLE_LABELS[pole],
    roles: ASSIGNABLE_ROLES.filter((r) => ROLE_TO_POLE[r] === pole),
  })).filter((g) => g.roles.length > 0);
  const [selectedRoles, setSelectedRoles] = useState<Set<Role>>(new Set());
  const [isActive, setIsActive] = useState(true);

  // Sync form from user prop
  const [prevUser, setPrevUser] = useState<User | null>(null);
  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setSelectedRoles(new Set(user.roles.length > 0 ? user.roles : [user.role]));
      setIsActive(user.is_active);
    }
  }

  function toggleRole(role: Role) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    onSubmit({
      user_id: user.id,
      roles: [...selectedRoles],
      is_active: isActive,
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tr.admin.editUser}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-secondary">{tr.admin.fields.username}</span>
          <span className="text-sm text-text-primary">{user?.username}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-secondary">{tr.admin.fields.discordId}</span>
          <span className="text-sm text-text-primary">{user?.discord_id}</span>
        </div>

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
          {selectedRoles.size > 0 && (
            <p className="text-xs text-text-tertiary">
              {selectedRoles.size} rôle{selectedRoles.size > 1 ? 's' : ''} sélectionné{selectedRoles.size > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <Switch
          checked={isActive}
          onChange={setIsActive}
          label={isActive ? tr.admin.fields.active : tr.admin.fields.inactive}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {tr.common.cancel}
          </Button>
          <Button type="submit" loading={loading} disabled={selectedRoles.size === 0}>
            {tr.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
