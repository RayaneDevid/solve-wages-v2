import { useState, useMemo, useCallback } from 'react';
import { Gift, Check, X, Trash2, Pencil } from 'lucide-react';
import { t } from '@/i18n';
import { type Prime, type PrimeStatus } from '@/types';
import { isCoordinateur, isGerantStaff, isPoleResponsible, formatShortDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useCurrentWeek } from '@/hooks/queries/use-payroll';
import { useMembers } from '@/hooks/queries/use-members';
import {
  usePrimes,
  useSubmitPrime,
  useReviewPrime,
  useUpdatePrime,
  useDeletePrime,
} from '@/hooks/queries/use-primes';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import SearchableSelect from '@/components/ui/searchable-select';
import Spinner from '@/components/ui/spinner';
import Badge from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import WeekStatusBadge from '@/components/payroll/week-status-badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { showToast } from '@/components/ui/show-toast';
import type { BadgeVariant } from '@/components/ui/badge';

function primeStatusVariant(status: PrimeStatus): BadgeVariant {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  return 'warning';
}

export default function PrimesPage() {
  const tr = t();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  const isCoord = role ? isCoordinateur(role) : false;
  const isGerant = role ? isGerantStaff(role) : false;
  const isResp = role ? isPoleResponsible(role) : false;

  const { data: week, isLoading: weekLoading } = useCurrentWeek();
  const { data: primes, isLoading: primesLoading } = usePrimes(week?.id);
  const { data: members, isLoading: membersLoading } = useMembers(null);

  const submitPrime = useSubmitPrime();
  const reviewPrime = useReviewPrime();
  const updatePrime = useUpdatePrime();
  const deletePrime = useDeletePrime();

  // Form state for gerant new prime
  const [selectedDiscordId, setSelectedDiscordId] = useState('');
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');

  // Edit modal state
  const [editingPrime, setEditingPrime] = useState<Prime | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editComment, setEditComment] = useState('');

  const weekLabel = week
    ? `${tr.payroll.weekOf} ${formatShortDate(week.week_start)} ${tr.payroll.to} ${formatShortDate(week.week_end)}`
    : '';

  const weekLocked = week?.status === 'locked';

  const memberOptions = useMemo(() => {
    if (!members) return [];
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [{ value: '', label: tr.primes.selectMember }];
    for (const m of members) {
      if (!seen.has(m.discord_id)) {
        seen.add(m.discord_id);
        opts.push({
          value: m.discord_id,
          label: `${m.discord_username} (${m.grade} — ${m.pole})`,
        });
      }
    }
    return opts;
  }, [members, tr]);

  const visiblePrimes = useMemo(() => {
    if (!primes) return [];
    if (isCoord) return primes;
    return primes.filter((p) => p.submitted_by_id === user?.id);
  }, [primes, isCoord, user?.id]);

  const pendingPrimes = useMemo(() => visiblePrimes.filter((p) => p.status === 'pending'), [visiblePrimes]);
  const approvedPrimes = useMemo(() => visiblePrimes.filter((p) => p.status === 'approved'), [visiblePrimes]);
  const rejectedPrimes = useMemo(() => visiblePrimes.filter((p) => p.status === 'rejected'), [visiblePrimes]);

  async function handleSubmit() {
    if (!week || !selectedDiscordId || !amount) return;

    const selectedMember = members?.find((m) => m.discord_id === selectedDiscordId);
    if (!selectedMember) return;

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      await submitPrime.mutateAsync({
        week_id: week.id,
        discord_id: selectedMember.discord_id,
        discord_username: selectedMember.discord_username,
        amount: parsedAmount,
        comment: comment.trim() || undefined,
      });
      showToast(tr.primes.toast.submitted);
      setSelectedDiscordId('');
      setAmount('');
      setComment('');
    } catch {
      showToast(tr.primes.toast.errorSubmit, 'error');
    }
  }

  async function handleApprove(primeId: string) {
    try {
      await reviewPrime.mutateAsync({ prime_id: primeId, status: 'approved' });
      showToast(tr.primes.toast.approved);
    } catch {
      showToast(tr.primes.toast.errorReview, 'error');
    }
  }

  async function handleReject(primeId: string) {
    try {
      await reviewPrime.mutateAsync({ prime_id: primeId, status: 'rejected' });
      showToast(tr.primes.toast.rejected);
    } catch {
      showToast(tr.primes.toast.errorReview, 'error');
    }
  }

  async function handleDelete(primeId: string) {
    try {
      await deletePrime.mutateAsync(primeId);
      showToast(tr.primes.toast.deleted);
    } catch {
      showToast(tr.primes.toast.errorDelete, 'error');
    }
  }

  function openEditModal(prime: Prime) {
    setEditingPrime(prime);
    setEditAmount(String(prime.amount));
    setEditComment(prime.comment ?? '');
  }

  async function handleEditSave() {
    if (!editingPrime || !editAmount) return;
    const parsedAmount = parseInt(editAmount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    try {
      await updatePrime.mutateAsync({
        prime_id: editingPrime.id,
        amount: parsedAmount,
        comment: editComment.trim() || undefined,
      });
      showToast(tr.primes.toast.updated);
      setEditingPrime(null);
    } catch {
      showToast(tr.primes.toast.errorUpdate, 'error');
    }
  }

  const canEditPrime = useCallback((prime: Prime): boolean => {
    if (weekLocked) return false;
    if (prime.status !== 'pending') return false;
    if (isCoord) return true;
    if (user && prime.submitted_by_id === user.id) return true;
    return false;
  }, [weekLocked, isCoord, user]);

  if (weekLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!week) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-text-tertiary">{tr.dashboard.noWeekDescription}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold text-text-primary">{tr.primes.title}</h1>
          </div>
          <p className="mt-1 text-sm text-text-secondary">{tr.primes.subtitle}</p>
          <p className="mt-0.5 text-xs text-text-tertiary">{weekLabel}</p>
        </div>
        <WeekStatusBadge status={week.status} />
      </div>

      {weekLocked && (
        <div className="glass-card rounded-xl px-4 py-3">
          <p className="text-sm text-text-secondary">{tr.primes.weekNotOpen}</p>
        </div>
      )}

      {/* Submit form: gérant + coord/dev */}
      {(isGerant || isCoord || isResp) && !weekLocked && (
        <div className="glass-elevated rounded-xl p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
            {tr.primes.newPrime}
          </h2>
          {membersLoading ? (
            <div className="flex h-16 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2">
                  <SearchableSelect
                    label={tr.primes.member}
                    value={selectedDiscordId}
                    onChange={setSelectedDiscordId}
                    options={memberOptions}
                    placeholder={tr.primes.selectMember}
                  />
                </div>
                <div>
                  <Input
                    label={tr.primes.amount}
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Input
                    label={tr.primes.comment}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Optionnel"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  loading={submitPrime.isPending}
                  disabled={!selectedDiscordId || !amount}
                >
                  <Gift className="h-4 w-4" />
                  {tr.primes.actions.submit}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Primes list */}
      {primesLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : visiblePrimes.length === 0 ? (
        <div className="glass-card rounded-xl px-5 py-8 text-center">
          <p className="text-sm text-text-tertiary">{tr.primes.noPrimes}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Pending */}
          {pendingPrimes.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                {tr.primes.pendingPrimes}
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>{tr.primes.member}</TableCell>
                    <TableCell header>{tr.primes.amount}</TableCell>
                    <TableCell header>{tr.primes.comment}</TableCell>
                    <TableCell header>{tr.primes.submittedBy}</TableCell>
                    <TableCell header>{tr.common.actions}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPrimes.map((prime) => (
                    <TableRow key={prime.id}>
                      <TableCell>
                        <span className="font-medium text-text-primary">{prime.discord_username}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-accent">
                          {prime.amount.toLocaleString('fr-FR')} {tr.common.credits}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-text-secondary">{prime.comment ?? '—'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-text-secondary">{prime.submitted_by_username ?? '—'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {canEditPrime(prime) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(prime)}
                              className="text-accent hover:bg-accent/10"
                            >
                              <Pencil className="h-4 w-4" />
                              {tr.primes.actions.edit}
                            </Button>
                          )}
                          {isCoord && !weekLocked && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleApprove(prime.id)}
                                loading={reviewPrime.isPending}
                                className="text-success hover:bg-success/10"
                              >
                                <Check className="h-4 w-4" />
                                {tr.primes.actions.approve}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReject(prime.id)}
                                loading={reviewPrime.isPending}
                                className="text-danger-text hover:bg-danger/10"
                              >
                                <X className="h-4 w-4" />
                                {tr.primes.actions.reject}
                              </Button>
                            </>
                          )}
                          {(isGerant || isCoord || isResp) && !weekLocked && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(prime.id)}
                              loading={deletePrime.isPending}
                              className="text-text-tertiary hover:bg-danger/10 hover:text-danger-text"
                            >
                              <Trash2 className="h-4 w-4" />
                              {tr.primes.actions.delete}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Approved */}
          {approvedPrimes.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                {tr.primes.approvedPrimes}
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>{tr.primes.member}</TableCell>
                    <TableCell header>{tr.primes.amount}</TableCell>
                    <TableCell header>{tr.primes.comment}</TableCell>
                    <TableCell header>{tr.common.actions}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedPrimes.map((prime) => (
                    <TableRow key={prime.id}>
                      <TableCell>
                        <span className="font-medium text-text-primary">{prime.discord_username}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-accent">
                          {prime.amount.toLocaleString('fr-FR')} {tr.common.credits}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-text-secondary">{prime.comment ?? '—'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={primeStatusVariant(prime.status)}>
                          {tr.primes.status[prime.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Rejected */}
          {rejectedPrimes.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                {tr.primes.rejectedPrimes}
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>{tr.primes.member}</TableCell>
                    <TableCell header>{tr.primes.amount}</TableCell>
                    <TableCell header>{tr.primes.comment}</TableCell>
                    <TableCell header>{tr.common.actions}</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedPrimes.map((prime) => (
                    <TableRow key={prime.id}>
                      <TableCell>
                        <span className="font-medium text-text-primary">{prime.discord_username}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-text-secondary">
                          {prime.amount.toLocaleString('fr-FR')} {tr.common.credits}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-text-secondary">{prime.comment ?? '—'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={primeStatusVariant(prime.status)}>
                          {tr.primes.status[prime.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Edit prime modal */}
      <Modal
        isOpen={!!editingPrime}
        onClose={() => setEditingPrime(null)}
        title={tr.primes.editPrime}
      >
        <div className="flex flex-col gap-4 p-6">
          <p className="text-sm text-text-secondary">
            {editingPrime?.discord_username}
          </p>
          <Input
            label={tr.primes.amount}
            type="number"
            min={1}
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            placeholder="0"
          />
          <Input
            label={tr.primes.comment}
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            placeholder="Optionnel"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setEditingPrime(null)}
            >
              {tr.primes.actions.cancel}
            </Button>
            <Button
              onClick={handleEditSave}
              loading={updatePrime.isPending}
              disabled={!editAmount}
            >
              {tr.primes.actions.save}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
