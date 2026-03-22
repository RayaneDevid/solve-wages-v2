import apiClient from './client';
import type { PayrollWeek, PayrollEntry, PayrollSubmission } from '@/types';

// ── Payroll Weeks ──

export async function getPayrollWeeks(): Promise<PayrollWeek[]> {
  const { data } = await apiClient.get<PayrollWeek[]>('/payroll-weeks');
  return data;
}

export async function getCurrentWeek(): Promise<PayrollWeek | null> {
  const { data } = await apiClient.get<PayrollWeek | null>('/payroll-weeks', {
    params: { current: true },
  });
  return data;
}

export async function createPayrollWeek(): Promise<PayrollWeek> {
  const { data } = await apiClient.post<PayrollWeek>('/payroll-weeks');
  return data;
}

export async function updatePayrollWeekStatus(payload: {
  week_id: string;
  status: string;
}): Promise<PayrollWeek> {
  const { data } = await apiClient.patch<PayrollWeek>('/payroll-weeks', payload);
  return data;
}

// ── Payroll Entries ──

export async function getPayrollEntries(
  weekId: string,
  pole?: string,
): Promise<PayrollEntry[]> {
  const { data } = await apiClient.get<PayrollEntry[]>('/payroll-entries', {
    params: { week_id: weekId, ...(pole ? { pole } : {}) },
  });
  return data;
}

export async function savePayrollEntries(payload: {
  week_id: string;
  pole: string;
  entries: Partial<PayrollEntry>[];
}): Promise<PayrollEntry[]> {
  const { data } = await apiClient.post<PayrollEntry[]>('/payroll-entries', payload);
  return data;
}

export async function updatePayrollEntries(payload: {
  week_id: string;
  pole: string;
  entries: Partial<PayrollEntry>[];
}): Promise<PayrollEntry[]> {
  const { data } = await apiClient.put<PayrollEntry[]>('/payroll-entries', payload);
  return data;
}

export async function deletePayrollEntry(entryId: string): Promise<void> {
  await apiClient.delete('/payroll-entries', {
    params: { entry_id: entryId },
  });
}

export async function confirmPayrollEntry(payload: {
  entry_id: string;
  confirmed: boolean;
}): Promise<PayrollEntry> {
  const { data } = await apiClient.patch<PayrollEntry>('/payroll-entries', payload);
  return data;
}

export async function bulkConfirmPayrollEntries(payload: {
  entry_ids: string[];
  confirmed: boolean;
}): Promise<PayrollEntry[]> {
  const { data } = await apiClient.patch<PayrollEntry[]>('/payroll-entries', payload);
  return data;
}

// ── Submit ──

export async function submitPayroll(payload: {
  week_id: string;
  pole: string;
}): Promise<PayrollSubmission> {
  const { data } = await apiClient.post<PayrollSubmission>('/payroll-submit', payload);
  return data;
}

// ── Export ──

export async function exportPayrollCsv(weekId: string): Promise<Blob> {
  const { data } = await apiClient.get('/payroll-export', {
    params: { week_id: weekId, format: 'csv' },
    responseType: 'blob',
  });
  return data as Blob;
}

export async function exportPayrollTsv(weekId: string): Promise<string> {
  const { data } = await apiClient.get<string>('/payroll-export', {
    params: { week_id: weekId, format: 'tsv' },
  });
  return data;
}

// ── Admin Payroll Control ──

export async function controlPayroll(payload: {
  action: 'open' | 'close' | 'lock';
  week_id?: string;
}): Promise<PayrollWeek> {
  const { data } = await apiClient.post<PayrollWeek>('/admin-payroll-control', payload);
  return data;
}
