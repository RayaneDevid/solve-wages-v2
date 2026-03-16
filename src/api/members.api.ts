import apiClient from './client';
import type { PoleMember, BulkImportResult } from '@/types';

export async function getMembers(pole?: string, includeInactive?: boolean): Promise<PoleMember[]> {
  const { data } = await apiClient.get<PoleMember[]>('/pole-members', {
    params: {
      ...(pole ? { pole } : {}),
      ...(includeInactive ? { include_inactive: 'true' } : {}),
    },
  });
  return data;
}

export async function addMember(payload: {
  pole: string;
  discord_username: string;
  discord_id: string;
  steam_id?: string;
  grade: string;
}): Promise<PoleMember> {
  const { data } = await apiClient.post<PoleMember>('/pole-members', payload);
  return data;
}

export async function updateMember(payload: {
  member_id: string;
  discord_username?: string;
  steam_id?: string;
  grade?: string;
  is_active?: boolean;
}): Promise<PoleMember> {
  const { data } = await apiClient.put<PoleMember>('/pole-members', payload);
  return data;
}

export async function deleteMember(memberId: string): Promise<PoleMember> {
  const { data } = await apiClient.delete<PoleMember>('/pole-members', {
    params: { member_id: memberId },
  });
  return data;
}

export async function bulkImportMembers(payload: {
  pole: string;
  members: { discord_username: string; discord_id: string; steam_id?: string; grade: string }[];
}): Promise<BulkImportResult> {
  const { data } = await apiClient.post<BulkImportResult>('/pole-members/bulk', payload);
  return data;
}
