import 'server-only';
import { ApiError, ApiErrorBody } from './error';

function apiUrl(): string {
  const value = process.env.KANBAN_API_URL?.trim();
  if (!value) throw new Error('KANBAN_API_URL is required');
  return value.replace(/\/$/, '');
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl()}${path}`, {
      ...init,
      cache: 'no-store',
      headers: { Accept: 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError(503, 'The API is unavailable');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => undefined) as ApiErrorBody | undefined;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiError(response.status, message || response.statusText, body);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
