export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  googleId?: string;
  isLocked?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role?: 'student' | 'instructor';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
