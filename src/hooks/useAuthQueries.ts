import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { authKeys } from '../api/queryKeys';
import { authSession, AuthSession } from '../auth/authSession';
import type { ApiError } from '../api/apiClient';
import { authService } from '../api/authService';
import type { AuthUser } from '../api/authTypes';

type AuthSessionQueryOptions = Omit<
  UseQueryOptions<AuthSession, ApiError>,
  'queryKey' | 'queryFn'
>;

export function useAuthSessionQuery(options?: AuthSessionQueryOptions) {
  return useQuery<AuthSession, ApiError>({
    queryKey: authKeys.session(),
    queryFn: authSession.getSession,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

export function useMeQuery(options?: Omit<UseQueryOptions<AuthUser, ApiError>, 'queryKey' | 'queryFn'>) {
  return useQuery<AuthUser, ApiError>({
    queryKey: authKeys.me(),
    queryFn: authService.me,
    ...options,
  });
}
