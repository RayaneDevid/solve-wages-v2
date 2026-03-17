import { Calendar, Lock, XCircle } from 'lucide-react';
import Badge, { type BadgeVariant } from '@/components/ui/badge';
import { t } from '@/i18n';
import type { PayrollWeekStatus } from '@/types';

interface WeekStatusBadgeProps {
  status: PayrollWeekStatus | null;
  className?: string;
}

const statusConfig: Record<PayrollWeekStatus, { variant: BadgeVariant; icon: typeof Calendar }> = {
  open: { variant: 'success', icon: Calendar },
  closed: { variant: 'warning', icon: XCircle },
  locked: { variant: 'default', icon: Lock },
};

export default function WeekStatusBadge({ status, className }: WeekStatusBadgeProps) {
  const tr = t();

  if (!status) {
    return (
      <Badge variant="default" className={className}>
        {tr.dashboard.noWeek}
      </Badge>
    );
  }

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {tr.payroll.status[status]}
    </Badge>
  );
}
