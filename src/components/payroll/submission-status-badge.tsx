import Badge, { type BadgeVariant } from '@/components/ui/badge';
import { t } from '@/i18n';
import type { SubmissionStatus } from '@/types';

interface SubmissionStatusBadgeProps {
  status: SubmissionStatus | null;
  className?: string;
}

const statusConfig: Record<string, BadgeVariant> = {
  draft: 'warning',
  submitted: 'success',
  notStarted: 'default',
};

export default function SubmissionStatusBadge({ status, className }: SubmissionStatusBadgeProps) {
  const tr = t();

  if (!status) {
    return (
      <Badge variant="default" className={className}>
        {tr.dashboard.notStarted}
      </Badge>
    );
  }

  return (
    <Badge variant={statusConfig[status] ?? 'default'} className={className}>
      {status === 'draft' ? tr.payroll.submission.draft : tr.payroll.submission.submitted}
    </Badge>
  );
}
