import { useState } from 'react';
import { Calendar, FileCheck, Coins, ArrowRight, Download, Lock, Unlock, XCircle, RotateCcw, Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/i18n';
import { Pole, type PayrollSubmission } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { isCoordinateur, isPoleResponsible, isGerantStaff, formatShortDate, getPoleForRole } from '@/lib/utils';
import { POLE_LABELS } from '@/lib/constants';
import { useCurrentWeek, usePayrollEntries, useOpenPayroll, useClosePayroll, useLockWeek, useExportPayroll } from '@/hooks/queries/use-payroll';
import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import ConfirmModal from '@/components/ui/confirm-modal';
import WeekStatusBadge from '@/components/payroll/week-status-badge';
import SubmissionStatusBadge from '@/components/payroll/submission-status-badge';
import { showToast } from '@/components/ui/show-toast';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  iconColor: string;
}

function StatCard({ icon, label, value, subtitle, iconColor }: StatCardProps) {
  return (
    <div className="glass-card flex flex-col gap-3 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-text-tertiary">{subtitle}</p>}
      </div>
    </div>
  );
}

const ALL_POLES: Pole[] = Object.values(Pole);

function getSubmissionForPole(submissions: PayrollSubmission[], pole: Pole): PayrollSubmission | undefined {
  return submissions.find((s) => s.pole === pole);
}

export default function DashboardPage() {
  const tr = t();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isCoord = user ? isCoordinateur(user.role) : false;
  const isResp = user ? isPoleResponsible(user.role) : false;
  const isGerant = user ? isGerantStaff(user.role) : false;
  const userPole = user ? getPoleForRole(user.role) : null;

  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);

  const { data: week, isLoading, error } = useCurrentWeek();
  const { data: allEntries } = usePayrollEntries(week?.id);
  const openPayroll = useOpenPayroll();
  const closePayroll = useClosePayroll();
  const lockWeek = useLockWeek();
  const { copyTsv } = useExportPayroll();

  const submissions = week?.submissions ?? [];
  const submittedCount = submissions.filter((s) => s.status === 'submitted').length;

  const totalEntries = allEntries?.length ?? 0;
  const inactiveEntries = allEntries?.filter((e) => e.is_inactive).length ?? 0;
  const activeEntries = totalEntries - inactiveEntries;
  const totalMontant = allEntries?.reduce((sum, e) => sum + e.montant, 0) ?? 0;

  const weekLabel = week
    ? `${formatShortDate(week.week_start)} ${tr.payroll.to} ${formatShortDate(week.week_end)}`
    : '—';

  const visiblePoles = isCoord
    ? ALL_POLES
    : isGerant
      ? [Pole.ADMINISTRATION, Pole.MODERATION, Pole.ANIMATION, Pole.MJ, Pole.DOUANE]
      : userPole
        ? [userPole]
        : [];

  async function handleOpen() {
    try {
      await openPayroll.mutateAsync(week?.id);
      showToast(tr.payroll.toast.weekOpened);
    } catch {
      showToast(tr.payroll.toast.errorControl, 'error');
    }
  }

  async function handleClose() {
    if (!week) return;
    try {
      await closePayroll.mutateAsync(week.id);
      showToast(tr.payroll.toast.weekClosed);
      setShowCloseConfirm(false);
    } catch {
      showToast(tr.payroll.toast.errorControl, 'error');
    }
  }

  async function handleReopen() {
    if (!week) return;
    try {
      await openPayroll.mutateAsync(week.id);
      showToast(tr.payroll.toast.weekReopened);
      setShowReopenConfirm(false);
    } catch {
      showToast(tr.payroll.toast.errorControl, 'error');
    }
  }

  async function handleLock() {
    if (!week) return;
    try {
      await lockWeek.mutateAsync(week.id);
      showToast(tr.payroll.toast.weekLocked);
      setShowLockConfirm(false);
    } catch {
      showToast(tr.payroll.toast.errorControl, 'error');
    }
  }

  function handleCopyBotLink() {
    if (!week) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payroll-bot-json?week_id=${week.id}`;
    navigator.clipboard.writeText(url);
    showToast(tr.payroll.toast.botLinkCopied);
  }

  async function handleExportTsv() {
    if (!week) return;
    try {
      await copyTsv(week.id);
      showToast(tr.payroll.toast.tsvCopied);
    } catch {
      showToast(tr.payroll.toast.errorExport, 'error');
    }
  }

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
        <p className="text-sm text-danger">{tr.common.error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{tr.nav.dashboard}</h1>
        {week && (
          <p className="mt-1 text-sm text-text-secondary">
            {tr.payroll.weekOf} {weekLabel}
          </p>
        )}
      </div>

      {/* Card: Semaine en cours */}
      <div className="glass-card flex flex-col gap-4 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">{tr.dashboard.currentWeek}</h2>
              {week ? (
                <p className="text-xs text-text-secondary">{weekLabel}</p>
              ) : (
                <p className="text-xs text-text-tertiary">{tr.dashboard.noWeekDescription}</p>
              )}
            </div>
          </div>
          <WeekStatusBadge status={week?.status ?? null} />
        </div>
        {isCoord && week?.status !== 'locked' && (
          <div className="flex flex-wrap gap-2 border-t border-border-secondary pt-4">
            {/* No week → Open */}
            {!week && (
              <Button
                size="sm"
                onClick={handleOpen}
                loading={openPayroll.isPending}
              >
                <Unlock className="h-4 w-4" />
                {tr.payroll.actions.openWeek}
              </Button>
            )}
            {/* Week open → Close */}
            {week?.status === 'open' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowCloseConfirm(true)}
                loading={closePayroll.isPending}
              >
                <XCircle className="h-4 w-4" />
                {tr.payroll.actions.closeWeek}
              </Button>
            )}
            {/* Week closed → Reopen + Bot Link + Lock */}
            {week?.status === 'closed' && (
              <>
                <Button
                  size="sm"
                  onClick={() => setShowReopenConfirm(true)}
                  loading={openPayroll.isPending}
                >
                  <RotateCcw className="h-4 w-4" />
                  {tr.payroll.actions.reopenWeek}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCopyBotLink}
                >
                  <Link2 className="h-4 w-4" />
                  {tr.payroll.actions.copyBotLink}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowLockConfirm(true)}
                  loading={lockWeek.isPending}
                >
                  <Lock className="h-4 w-4" />
                  {tr.payroll.actions.lockWeek}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      {week && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<FileCheck className="h-4 w-4 text-success" />}
            label={tr.dashboard.submissions}
            value={`${submittedCount} / ${ALL_POLES.length}`}
            subtitle={`${ALL_POLES.length - submittedCount} ${tr.dashboard.pending}`}
            iconColor="bg-success/10"
          />
          <StatCard
            icon={<Coins className="h-4 w-4 text-accent-amber" />}
            label={tr.dashboard.totalAmount}
            value={totalMontant.toLocaleString()}
            subtitle={tr.common.credits}
            iconColor="bg-accent-amber/10"
          />
          <StatCard
            icon={<Calendar className="h-4 w-4 text-accent-blue" />}
            label={tr.dashboard.activeStaffs}
            value={`${activeEntries} / ${totalEntries}`}
            subtitle={`${inactiveEntries} ${tr.dashboard.inactive}`}
            iconColor="bg-accent-blue/10"
          />
        </div>
      )}

      {/* Card: Soumissions */}
      {week && (week.status === 'open' || week.status === 'closed') && (
        <div className="glass-card rounded-xl p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
            {tr.dashboard.submissions}
          </h2>
          <div className="flex flex-col divide-y divide-border-secondary">
            {visiblePoles.map((pole) => {
              const sub = getSubmissionForPole(submissions, pole);
              return (
                <div key={pole} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-text-primary">
                    {POLE_LABELS[pole]}
                  </span>
                  <SubmissionStatusBadge status={sub?.status ?? null} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Card: Actions rapides */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          {tr.dashboard.quickActions}
        </h2>
        <div className="flex flex-wrap gap-3">
          {(isResp || isGerant) && (
            <Button size="sm" onClick={() => navigate('/payroll')}>
              <ArrowRight className="h-4 w-4" />
              {tr.dashboard.enterPayroll}
            </Button>
          )}
          {isCoord && (
            <>
              <Button size="sm" onClick={() => navigate('/payroll')}>
                <ArrowRight className="h-4 w-4" />
                {tr.nav.payroll}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => navigate('/global')}>
                <ArrowRight className="h-4 w-4" />
                {tr.nav.globalView}
              </Button>
              {week && (
                <Button size="sm" variant="ghost" onClick={handleExportTsv}>
                  <Download className="h-4 w-4" />
                  {tr.payroll.actions.copyTsv}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation modals */}
      <ConfirmModal
        isOpen={showLockConfirm}
        onClose={() => setShowLockConfirm(false)}
        onConfirm={handleLock}
        title={tr.payroll.actions.lockWeek}
        message={tr.payroll.confirmLock}
        confirmLabel={tr.payroll.actions.lockWeek}
        variant="danger"
        loading={lockWeek.isPending}
      />
      <ConfirmModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleClose}
        title={tr.payroll.actions.closeWeek}
        message={tr.common.confirmClose}
        confirmLabel={tr.payroll.actions.closeWeek}
        variant="warning"
        loading={closePayroll.isPending}
      />
      <ConfirmModal
        isOpen={showReopenConfirm}
        onClose={() => setShowReopenConfirm(false)}
        onConfirm={handleReopen}
        title={tr.payroll.actions.reopenWeek}
        message={tr.common.confirmClose}
        confirmLabel={tr.payroll.actions.reopenWeek}
        variant="warning"
        loading={openPayroll.isPending}
      />
    </div>
  );
}
