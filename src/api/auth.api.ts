import apiClient from './client';
import type { User } from '@/types';

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth-me');
  return data;
}
