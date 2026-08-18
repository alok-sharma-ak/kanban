export type SystemRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthActionState {
  status: 'idle' | 'error';
  message?: string;
  fieldErrors?: Partial<Record<'name' | 'email' | 'password', string[]>>;
}

export const INITIAL_AUTH_STATE: AuthActionState = { status: 'idle' };
