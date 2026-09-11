import apiClient from './apiClient';
import { AuthSessionResponse, AuthUser, LoginPayload } from './authTypes';

const AUTH_RIDER_LOGIN = '/auth/login/rider/email';
const AUTH_ME = '/auth/me';

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthSessionResponse>(AUTH_RIDER_LOGIN, payload, { skipAuth: true }),

  me: () => apiClient.get<AuthUser>(AUTH_ME),

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
