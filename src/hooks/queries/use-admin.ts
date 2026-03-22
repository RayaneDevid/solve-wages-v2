import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser, bulkImportUsers } from '@/api/admin.api';
import { mockGetUsers, mockCreateUser, mockUpdateUser, mockDeleteUser } from '@/api/mock/admin.mock';
import type { Role } from '@/types';

const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

export function useUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: isDevMode ? mockGetUsers : getUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { discord_id: string; username: string; role: Role }) =>
      isDevMode ? mockCreateUser(payload) : createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { user_id: string; role?: Role; is_active?: boolean }) =>
      isDevMode ? mockUpdateUser(payload) : updateUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      isDevMode ? mockDeleteUser(userId) : deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useBulkImportUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { users: { discord_id: string; username: string; role: string }[] }) =>
      bulkImportUsers(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}
