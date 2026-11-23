export type AuthUser = {
  id: string;
  name: string;
  email?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  device_push_token?: string;
};

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken?: string | null;
  user: AuthUser;
};

// ─── Forgot password ─────────────────────────────────────────────────────────

export type ForgotPasswordSendPayload = {
  email: string;
};

export type ForgotPasswordSendResponse = {
  message: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export type ForgotPasswordVerifyPayload = {
  email: string;
  otp: string;
};

export type ForgotPasswordVerifyResponse = {
  message: string;
  resetToken: string;
};

export type ResetPasswordPayload = {
  resetToken: string;
  password: string;
};

export type ResetPasswordResponse = {
  message: string;
};

/** Error body the server returns while a fresh reset code is on cooldown. */
export type ResetCodeCooldownErrorData = {
  code: 'PASSWORD_RESET_OTP_COOLDOWN';
  retryAfterSeconds: number;
};
