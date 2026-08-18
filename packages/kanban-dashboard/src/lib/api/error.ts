export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  path?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
  }
}

export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'The service is temporarily unavailable. Please try again.';
  if (error.status === 401) return 'The email or password is incorrect.';
  if (error.status === 409) return error.message || 'An account with this email already exists.';
  if (error.status === 429) return 'Too many attempts. Please wait and try again.';
  if (error.status === 503) return 'Authentication is temporarily unavailable. Please try again shortly.';
  return error.message || 'Something went wrong. Please try again.';
}
