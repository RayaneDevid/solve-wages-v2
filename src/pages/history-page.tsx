import { useState } from 'react';
import { Calendar, ArrowLeft, Download, Copy } from 'lucide-react';
import { t } from '@/i18n';
import { Pole, type PayrollWeek, type PayrollEntry } from '@/types';
import { formatDate, formatShortDate } from '@/lib/utils';
import { POLE_LABELS } from '@/lib/constants';
import { usePayrollWeeks, usePayrollEntries, useExportPayroll } from '@/hooks/queries/use-payroll';
import { useAuthStore } from '@/stores/auth.store';
import { isCoordinateur } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import Button from '@/components/ui/button';
import Spinner from '@/components/ui/spinner';
import WeekStatusBadge from '@/components/payroll/week-status-badge';
import SubmissionStatusBadge from '@/components/payroll/submission-status-badge';
import PayrollTable, { type LocalPayrollEntry } from '@/components/payroll/payroll-table';
import PayrollSummary from '@/components/payroll/payroll-summary';
import { showToast } from '@/components/ui/show-toast';

const ALL_POLES: Pole[] = Object.values(Pole);

function toLocalEntry(entry: PayrollEntry): LocalPayrollEntry {
  return {
    id: entry.id ?? undefined,
    staff_id: entry.staff_id,
    pole: entry.pole,
    discord_username: entry.discord_username,
    discord_id: entry.discord_id,
    steam_id: entry.steam_id,
    grade: entry.grade,
    tickets_ig: entry.tickets_ig,
    tickets_discord: entry.tickets_discord,
    bda_count: entry.bda_count,
    nb_animations: entry.nb_animations,
    nb_animations_mj: entry.nb_animations_mj,
    nb_animations_mj_p: entry.nb_animations_mj_p,
    nb_animations_mj_m: entry.nb_animations_mj_m,
    nb_animations_mj_g: entry.nb_animations_mj_g,
    nb_candidatures_ecrites: entry.nb_candidatures_ecrites,
    nb_oraux: entry.nb_oraux,
    commentaire: entry.commentaire,
    presence_reunion: entry.presence_reunion,
    montant: entry.montant,
    is_inactive: entry.is_inactive,
    confirmed_by_coordinator: entry.confirmed_by_coordinator,
    confirmed_at: entry.confirmed_at,
    modified_by_coordinator: entry.modified_by_coordinator,
    coordinator_modified_at: entry.coordinator_modified_at,
    _isNew: false,
    _dirty: false,
  };
}

function WeekDetailView({ week, onBack }: { week: PayrollWeek; onBack: () => void }) {
  const tr = t();
  const user = useAuthStore((s) => s.user);
  const isCoord = user ? isCoordinateur(user.role) : false;
  const { data: allEntries, isLoading } = usePayrollEntries(week.id);
  const { downloadCsv, copyTsv } = useExportPayroll();

  const entries = allEntries?.map(toLocalEntry) ?? [];
  const submissions = week.submissions ?? [];

  const poleSummaries = ALL_POLES.map((pole) => {
    const poleEntries = entries.filter((e) => e.pole === pole);
    return {
      pole,
      total: poleEntries.reduce((sum, e) => sum + e.montant, 0),
      count: poleEntries.length,
    };
  }).filter((ps) => ps.count > 0);

  async function handleExportCsv() {
    try {
      await downloadCsv(week.id, `paies_${week.week_start}_${week.week_end}.csv`);
      showToast(tr.payroll.toast.exported);
    } catch {
      showToast(tr.payroll.toast.errorExport, 'error');
    }
  }

  async function handleCopyTsv() {
    try {
      await copyTsv(week.id);
      showToast(tr.payroll.toast.tsvCopied);
    } catch {
      showToast(tr.payroll.toast.errorExport, 'error');
    }
  }

  function getSubmissionStatus(pole: Pole) {
    const sub = submissions.find((s) => s.pole === pole);
    return sub?.status ?? null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            {tr.history.backToList}
          </Button>
        </div>
        {isCoord && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCsv}>
              <Download className="h-4 w-4" />
              {tr.payroll.actions.exportCsv}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCopyTsv}>
              <Copy className="h-4 w-4" />
              {tr.payroll.actions.copyTsv}
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-text-primary">
          {tr.payroll.weekOf} {formatShortDate(week.week_start)} {tr.payroll.to} {formatShortDate(week.week_end)}
        </h2>
        <WeekStatusBadge status={week.status} />
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {ALL_POLES.map((pole) => {
            const poleEntries = entries.filter((e) => e.pole === pole);
            if (poleEntries.length === 0) return null;
            return (
              <div key={pole}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-base font-semibold text-text-primary">{POLE_LABELS[pole]}</h3>
                  <SubmissionStatusBadge status={getSubmissionStatus(pole)} />
                  <span className="text-xs text-text-tertiary">{poleEntries.length} staffs</span>
                </div>
                <PayrollTable
                  entries={poleEntries}
                  pole={pole}
                  editable={false}
                  weekStatus="locked"
                  weekStart={week.week_start}
                  weekEnd={week.week_end}
                  onUpdate={() => {}}
                  onDelete={() => {}}
                />
              </div>
            );
          })}

          {poleSummaries.length > 0 && (
            <PayrollSummary poleSummaries={poleSummaries} />
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const tr = t();
  const [selectedWeek, setSelectedWeek] = useState<PayrollWeek | null>(null);
  const { data: weeks, isLoading, error } = usePayrollWeeks();

  if (selectedWeek) {
    return <WeekDetailView week={selectedWeek} onBack={() => setSelectedWeek(null)} />;
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

  const weeksData = weeks ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{tr.history.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">{tr.history.subtitle}</p>
      </div>

      {weeksData.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-text-tertiary">{tr.common.noData}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableCell header>{tr.history.week}</TableCell>
              <TableCell header>{tr.admin.fields.status}</TableCell>
              <TableCell header>{tr.history.submissionsColumn}</TableCell>
              <TableCell header>{tr.history.totalColumn}</TableCell>
              <TableCell header>{tr.history.lockedAt}</TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {weeksData.map((week) => {
              const submittedCount = (week.submissions ?? []).filter(
                (s) => s.status === 'submitted',
              ).length;
              return (
                <TableRow
                  key={week.id}
                  onClick={() => setSelectedWeek(week)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-text-tertiary" />
                      <span className="font-medium">
                        {formatShortDate(week.week_start)} — {formatShortDate(week.week_end)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <WeekStatusBadge status={week.status} />
                  </TableCell>
                  <TableCell>
                    {submittedCount} / {ALL_POLES.length} {tr.poles.moderation && 'pôles'}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-accent">—</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-text-secondary">
                      {week.locked_at ? formatDate(week.locked_at) : '—'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
