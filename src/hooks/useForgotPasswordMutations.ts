import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { authService } from '../api/authService';
import type { ApiError } from '../api/apiClient';
import type {
  ForgotPasswordSendPayload,
  ForgotPasswordSendResponse,
  ForgotPasswordVerifyPayload,
  ForgotPasswordVerifyResponse,
  ResetCodeCooldownErrorData,
  ResetPasswordPayload,
  ResetPasswordResponse,
} from '../api/authTypes';

export function useSendResetCodeMutation(
  options?: UseMutationOptions<ForgotPasswordSendResponse, ApiError, ForgotPasswordSendPayload>
) {
  return useMutation<ForgotPasswordSendResponse, ApiError, ForgotPasswordSendPayload>({
    mutationFn: authService.sendPasswordResetCode,
    ...options,
  });
}

export function useVerifyResetCodeMutation(
  options?: UseMutationOptions<ForgotPasswordVerifyResponse, ApiError, ForgotPasswordVerifyPayload>
) {
  return useMutation<ForgotPasswordVerifyResponse, ApiError, ForgotPasswordVerifyPayload>({
    mutationFn: authService.verifyPasswordResetCode,
    ...options,
  });
}

export function useResetPasswordMutation(
  options?: UseMutationOptions<ResetPasswordResponse, ApiError, ResetPasswordPayload>
) {
  return useMutation<ResetPasswordResponse, ApiError, ResetPasswordPayload>({
    mutationFn: authService.resetPassword,
    ...options,
  });
}

/**
 * Seconds until another code may be requested when the server rejected a
 * send because one was issued moments ago; null for any other error.
 */
export function getResetCodeCooldownSeconds(error: ApiError | null | undefined): number | null {
  const data = error?.data as Partial<ResetCodeCooldownErrorData> | undefined;
  if (error?.code !== 'PASSWORD_RESET_OTP_COOLDOWN' || typeof data?.retryAfterSeconds !== 'number') {
    return null;
  }
  return data.retryAfterSeconds;
}
