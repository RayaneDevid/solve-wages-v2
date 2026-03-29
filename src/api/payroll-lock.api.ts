import apiClient from './client';

export interface PayrollLock {
  id: string;
  payroll_week_id: string;
  pole: string;
  user_id: string;
  username: string;
  locked_at: string;
}

export async function checkLock(weekId: string, pole: string): Promise<PayrollLock | null> {
  const { data } = await apiClient.get<PayrollLock | null>(`/payroll-lock?week_id=${weekId}&pole=${pole}`);
  return data;
}

export async function acquireLock(weekId: string, pole: string): Promise<{ ok: true; lock: PayrollLock } | { ok: false; lockedBy: string }> {
  try {
    const { data } = await apiClient.post<PayrollLock>('/payroll-lock', { week_id: weekId, pole });
    return { ok: true, lock: data };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: unknown } };
    if (axiosErr.response?.status === 409) {
      const body = axiosErr.response.data as { locked_by?: string } | string;
      let lockedBy = 'Quelqu\'un d\'autre';
      if (typeof body === 'string') {
        try { lockedBy = (JSON.parse(body) as { locked_by?: string }).locked_by ?? lockedBy; } catch { /* ignore */ }
      } else if (typeof body === 'object' && body !== null) {
        lockedBy = body.locked_by ?? lockedBy;
      }
      return { ok: false, lockedBy };
    }
    throw err;
  }
}

export async function releaseLock(weekId: string, pole: string): Promise<void> {
  await apiClient.delete('/payroll-lock', { data: { week_id: weekId, pole } });
}
