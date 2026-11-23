import apiClient from './apiClient';
import {
  AuthSessionResponse,
  AuthUser,
  ForgotPasswordSendPayload,
  ForgotPasswordSendResponse,
  ForgotPasswordVerifyPayload,
  ForgotPasswordVerifyResponse,
  LoginPayload,
  ResetPasswordPayload,
  ResetPasswordResponse,
} from './authTypes';

const AUTH_RIDER_LOGIN = '/auth/login/rider/email';
const AUTH_ME = '/auth/me';
const FORGOT_PASSWORD_SEND = '/otp/rider/send';
const FORGOT_PASSWORD_VERIFY = '/otp/rider/verify';
const FORGOT_PASSWORD_RESET = '/otp/rider/reset-password';

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthSessionResponse>(AUTH_RIDER_LOGIN, payload, { skipAuth: true }),

  me: () => apiClient.get<AuthUser>(AUTH_ME),

  /** POST /api/v1/otp/rider/send — emails a reset code to a rider account. */
  sendPasswordResetCode: (payload: ForgotPasswordSendPayload) =>
    apiClient.post<ForgotPasswordSendResponse>(FORGOT_PASSWORD_SEND, payload, { skipAuth: true }),

  /** POST /api/v1/otp/rider/verify — exchanges the code for a one-time resetToken. */
  verifyPasswordResetCode: (payload: ForgotPasswordVerifyPayload) =>
    apiClient.post<ForgotPasswordVerifyResponse>(FORGOT_PASSWORD_VERIFY, payload, { skipAuth: true }),

  /** POST /api/v1/otp/rider/reset-password — sets the new password. */
  resetPassword: (payload: ResetPasswordPayload) =>
    apiClient.post<ResetPasswordResponse>(FORGOT_PASSWORD_RESET, payload, { skipAuth: true }),

  // Useful for local app wiring before backend auth endpoints are ready.
  createDemoSession: async (appTag: 'store' | 'rider'): Promise<AuthSessionResponse> => ({
    accessToken: appTag + '-demo-token',
    refreshToken: null,
    user: {
      id: appTag + '-demo-user',
      name: appTag === 'store' ? 'Store Demo User' : 'Rider Demo User',
      email: appTag + '@demo.enatega.app',
    },
  }),
};
