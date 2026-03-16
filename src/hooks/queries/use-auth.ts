import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect } from 'react';

export function useAuthMe(enabled = true) {
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: ['auth-me'],
    queryFn: fetchMe,
    enabled,
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}
