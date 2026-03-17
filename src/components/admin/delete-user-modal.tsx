import Modal from '@/components/ui/modal';
import Button from '@/components/ui/button';
import type { User } from '@/types';
import { t } from '@/i18n';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  user: User | null;
}

export default function DeleteUserModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  user,
}: DeleteUserModalProps) {
  const tr = t();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tr.admin.deleteUser}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          {tr.admin.confirmDelete}{' '}
          <span className="font-semibold text-text-primary">{user?.username}</span>
          {tr.admin.confirmDeleteSuffix}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {tr.common.cancel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {tr.common.delete}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
