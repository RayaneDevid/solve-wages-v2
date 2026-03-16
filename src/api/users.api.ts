import apiClient from './client';
import type { User } from '@/types';

export async function fetchUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/admin-users');
  return data;
}
