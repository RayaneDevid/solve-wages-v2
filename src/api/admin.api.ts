import apiClient from './client';
import type { User, Role } from '@/types';

export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/admin-users');
  return data;
}

export async function createUser(payload: {
  discord_id: string;
  username: string;
  roles: Role[];
}): Promise<User> {
  const { data } = await apiClient.post<User>('/admin-users', payload);
  return data;
}

export async function updateUser(payload: {
  user_id: string;
  roles?: Role[];
  is_active?: boolean;
}): Promise<User> {
  const { data } = await apiClient.patch<User>('/admin-users', payload);
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete('/admin-users', {
    data: { user_id: userId },
  });
}

export async function bulkImportUsers(payload: {
  users: { discord_id: string; username: string; role: string }[];
}): Promise<{ added: number; skipped: number }> {
  const { data } = await apiClient.post<{ added: number; skipped: number }>('/admin-users', payload);
  return data;
}

export async function payrollControl(action: 'open' | 'close' | 'lock', weekId?: string) {
  const { data } = await apiClient.post('/admin-payroll-control', {
    action,
    week_id: weekId,
  });
  return data;
}
