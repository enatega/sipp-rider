import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { authService } from '../api/authService';
import { authKeys } from '../api/queryKeys';
import type { ApiError } from '../api/apiClient';
import type { AuthSessionResponse, LoginPayload } from '../api/authTypes';
import { useAuth } from '../auth/AuthProvider';

type AppTag = 'store' | 'rider';

export function useDemoLoginMutation(
  appTag: AppTag,
  options?: UseMutationOptions<AuthSessionResponse, ApiError, void>
) {
  const queryClient = useQueryClient();
  const { setSessionFromResponse } = useAuth();

  return useMutation<AuthSessionResponse, ApiError, void>({
    mutationFn: () => authService.createDemoSession(appTag),
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await setSessionFromResponse(data);
      queryClient.setQueryData(authKeys.session(), {
        token: data.accessToken,
        refreshToken: data.refreshToken ?? null,
        user: data.user,
      });
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useLoginMutation(
  options?: UseMutationOptions<AuthSessionResponse, ApiError, LoginPayload>
) {
  const queryClient = useQueryClient();
  const { setSessionFromResponse } = useAuth();

  return useMutation<AuthSessionResponse, ApiError, LoginPayload>({
    mutationFn: async (payload) => {
      console.log('[LOGIN REQUEST][RIDER]', {
        email: payload.email,
        device_push_token: payload.device_push_token ?? null,
      });
      return authService.login(payload);
    },
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      console.log('[LOGIN RESPONSE][RIDER]', {
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? null,
      });
      await setSessionFromResponse(data);
      queryClient.setQueryData(authKeys.session(), {
        token: data.accessToken,
        refreshToken: data.refreshToken ?? null,
        user: data.user,
      });
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      console.log('[LOGIN ERROR][RIDER]', {
        email: variables.email,
        device_push_token: variables.device_push_token ?? null,
        status: error.status,
        code: error.code ?? null,
        message: error.message,
        data: error.data,
      });
      options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}

export function useLogoutMutation(options?: UseMutationOptions<void, ApiError, void>) {
  const queryClient = useQueryClient();
  const { clearSession } = useAuth();

  return useMutation<void, ApiError, void>({
    mutationFn: clearSession,
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      queryClient.setQueryData(authKeys.session(), {
        token: null,
        refreshToken: null,
        user: null,
      });
      queryClient.removeQueries({ queryKey: authKeys.me() });
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
