import { useQuery } from '@tanstack/react-query';
import { api, guestDemo, type User } from '../services/api';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => guestDemo ? Promise.resolve(null) : api<User | null>('/auth/me'),
  });
}
