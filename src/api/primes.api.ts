import apiClient from './client';
import type { Prime } from '@/types';

export async function getPrimes(weekId: string): Promise<Prime[]> {
  const { data } = await apiClient.get<Prime[]>(`/primes?week_id=${weekId}`);
  return data;
}

export async function submitPrime(payload: {
  week_id: string;
  discord_id: string;
  discord_username: string;
  amount: number;
  comment?: string;
}): Promise<Prime> {
  const { data } = await apiClient.post<Prime>('/primes', payload);
  return data;
}

export async function reviewPrime(payload: {
  prime_id: string;
  status: 'approved' | 'rejected';
}): Promise<Prime> {
  const { data } = await apiClient.patch<Prime>('/primes', payload);
  return data;
}

export async function deletePrime(primeId: string): Promise<void> {
  await apiClient.delete('/primes', { data: { prime_id: primeId } });
}
