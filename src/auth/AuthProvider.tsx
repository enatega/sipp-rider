import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthSessionResponse } from '../api/authTypes';
import { authSession, AuthSession } from './authSession';
import { setSessionExpiredHandler } from '../api/apiClient';
import { stopRiderBackgroundLocation } from '../location/riderBackgroundLocationTask';

type AuthContextValue = {
  session: AuthSession;
  isAuthenticated: boolean;
  isReady: boolean;
  setSessionFromResponse: (payload: AuthSessionResponse) => Promise<void>;
  clearSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const emptySession: AuthSession = {
  token: null,
  refreshToken: null,
  user: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession>(emptySession);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    authSession
      .getSession()
      .then((value) => {
        setSession(value);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  const setSessionFromResponse = async (payload: AuthSessionResponse) => {
    await authSession.setSession(payload);
    setSession({
      token: payload.accessToken,
      refreshToken: payload.refreshToken ?? null,
      user: payload.user,
    });
  };

  const clearSession = async () => {
    await stopRiderBackgroundLocation().catch(() => undefined);
    await authSession.clearSession();
    setSession(emptySession);
  };

  useEffect(() => {
    setSessionExpiredHandler(async () => {
      await stopRiderBackgroundLocation().catch(() => undefined);
      await authSession.clearSession();
      setSession(emptySession);
    });

    return () => {
      setSessionExpiredHandler(null);
    };
  }, []);

  const isAuthenticated = Boolean(session.token);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated,
      isReady,
      setSessionFromResponse,
      clearSession,
    }),
    [session, isAuthenticated, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
