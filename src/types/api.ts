// Response envelope types
export interface ApiResponse<T = unknown> {
  ok: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  lastUsedAt?: string;
  isActive: boolean;
  permissions: string;
  createdAt: string;
  updatedAt: string;
}

// Auth context
export interface AuthContext {
  userId: string;
  user: User;
  sessionId?: string;
}
