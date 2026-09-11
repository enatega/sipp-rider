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
