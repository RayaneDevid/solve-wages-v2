import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPayrollWeeks,
  getCurrentWeek,
  getPayrollEntries,
  savePayrollEntries,
  updatePayrollEntries,
  deletePayrollEntry,
  submitPayroll,
  controlPayroll,
  confirmPayrollEntry,
  exportPayrollCsv,
  exportPayrollTsv,
} from '@/api/payroll.api';
import type { PayrollEntry } from '@/types';

// ── Queries ──

export function usePayrollWeeks() {
  return useQuery({
    queryKey: ['payroll-weeks'],
    queryFn: getPayrollWeeks,
  });
}

export function useCurrentWeek() {
  return useQuery({
    queryKey: ['payroll-weeks', 'current'],
    queryFn: getCurrentWeek,
  });
}

export function usePayrollEntries(weekId: string | undefined, pole?: string) {
  return useQuery({
    queryKey: ['payroll-entries', weekId, pole],
    queryFn: () => getPayrollEntries(weekId!, pole),
    enabled: !!weekId,
  });
}

// ── Mutations ──

export function useSaveEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { week_id: string; pole: string; entries: Partial<PayrollEntry>[] }) =>
      savePayrollEntries(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-entries'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-weeks'] });
    },
  });
}

export function useUpdateEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { week_id: string; pole: string; entries: Partial<PayrollEntry>[] }) =>
      updatePayrollEntries(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-entries'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-weeks'] });
    },
  });
}

export function useSubmitPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { week_id: string; pole: string }) => submitPayroll(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-entries'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-weeks'] });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => deletePayrollEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-entries'] });
    },
  });
}

export function useConfirmEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { entry_id: string; confirmed: boolean }) =>
      confirmPayrollEntry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-entries'] });
    },
  });
}

export function useOpenPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weekId?: string) => controlPayroll({ action: 'open', week_id: weekId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-weeks'] });
    },
  });
}

export function useClosePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weekId: string) => controlPayroll({ action: 'close', week_id: weekId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-weeks'] });
    },
  });
}

export function useLockWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weekId: string) => controlPayroll({ action: 'lock', week_id: weekId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-weeks'] });
    },
  });
}

export function useExportPayroll() {
  return {
    downloadCsv: async (weekId: string, filename?: string) => {
      const blob = await exportPayrollCsv(weekId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? `paies-export.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    copyTsv: async (weekId: string): Promise<string> => {
      const tsv = await exportPayrollTsv(weekId);
      await navigator.clipboard.writeText(tsv);
      return tsv;
    },
  };
}
