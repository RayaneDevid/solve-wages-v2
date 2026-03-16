import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMembers,
  addMember,
  updateMember,
  deleteMember,
  bulkImportMembers,
} from '@/api/members.api';
import type { BulkImportResult } from '@/types';

export function useMembers(pole?: string) {
  return useQuery({
    queryKey: ['pole-members', pole],
    queryFn: () => getMembers(pole),
    enabled: !!pole,
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pole-members'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-entries'] });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pole-members'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-entries'] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pole-members'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-entries'] });
    },
  });
}

export function useBulkImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      pole: string;
      members: { discord_username: string; discord_id: string; steam_id?: string; grade: string }[];
    }): Promise<BulkImportResult> => bulkImportMembers(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pole-members'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-entries'] });
    },
  });
}
