import * as SecureStore from 'expo-secure-store';
import { tokenManager } from '../api/apiClient';
import type { AuthSessionResponse, AuthUser } from '../api/authTypes';

const USER_KEY = 'deliveries_rider_app_auth_user';

export type AuthSession = {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

const getUser = async (): Promise<AuthUser | null> => {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
};

export const authSession = {
  setSession: async (payload: AuthSessionResponse) => {
    await tokenManager.setToken(payload.accessToken);

    if (payload.refreshToken) {
      await tokenManager.setRefreshToken(payload.refreshToken);
    } else {
      await tokenManager.removeRefreshToken();
    }

    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(payload.user));

    return payload;
  },

  getSession: async (): Promise<AuthSession> => {
    const [token, refreshToken, user] = await Promise.all([
      tokenManager.getToken(),
      tokenManager.getRefreshToken(),
      getUser(),
    ]);

    return {
      token,
      refreshToken,
      user,
    };
  },

  clearSession: async () => {
    await tokenManager.clearAll();
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
