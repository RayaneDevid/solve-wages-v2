import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPrimes, submitPrime, reviewPrime, updatePrime, deletePrime } from '@/api/primes.api';

export function usePrimes(weekId: string | undefined) {
  return useQuery({
    queryKey: ['primes', weekId],
    queryFn: () => getPrimes(weekId!),
    enabled: !!weekId,
  });
}

export function useSubmitPrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitPrime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['primes'] });
    },
  });
}

export function useReviewPrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewPrime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['primes'] });
    },
  });
}

export function useUpdatePrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePrime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['primes'] });
    },
  });
}

export function useDeletePrime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePrime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['primes'] });
    },
  });
}
