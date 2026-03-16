import { AlertTriangle } from 'lucide-react';
import Modal from './modal';
import Button from './button';
import { t } from '@/i18n';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  const tr = t();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-5">
        <div className="flex gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-danger/10' : 'bg-warning/10'}`}>
            <AlertTriangle className={`h-5 w-5 ${variant === 'danger' ? 'text-danger' : 'text-warning'}`} />
          </div>
          <p className="text-sm text-text-secondary">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {tr.common.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? tr.common.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
