// Small fetch wrapper for the box cricket API. Responses have no { data } wrapper; errors are
// { success: false, message, errors? } and are thrown as ApiError with the server's message.

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');
export const VENUE_ID = import.meta.env.VITE_VENUE_ID ?? 'arena';

export interface FieldError {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  // Message for one form field, from a 400 validation error.
  fieldError(path: string): string | undefined {
    return this.errors.find(e => e.path === path)?.message;
  }
}

export const NETWORK_ERROR = 'Could not reach the server. Check your connection and try again.';

export const errorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    // Validation errors: the first field message is more useful than "Validation error".
    return error.errors[0]?.message ?? error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
};

type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  token?: string | null;
  signal?: AbortSignal;
}

export interface ApiClientConfig {
  getToken: () => string | null;
  // Called on 401 for authenticated requests, so the app can clear the session.
  onUnauthorized?: () => void;
}

const buildUrl = (path: string, query?: Query): string => {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  return url.toString();
};

export const createApiClient = (config: ApiClientConfig) => {
  const send = async (path: string, options: RequestOptions = {}): Promise<Response> => {
    const token = options.token === undefined ? config.getToken() : options.token;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(buildUrl(path, options.query), {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new ApiError(0, NETWORK_ERROR);
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        errors?: FieldError[];
      } | null;
      if (response.status === 401 && token) config.onUnauthorized?.();
      throw new ApiError(
        response.status,
        payload?.message ?? `Request failed (${response.status})`,
        payload?.errors ?? [],
      );
    }
    return response;
  };

  const request = async <T>(path: string, options?: RequestOptions): Promise<T> => {
    const response = await send(path, options);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  };

  // Admin lists: array body + total in the X-Total-Count header.
  const page = async <T>(path: string, options?: RequestOptions): Promise<{ items: T[]; total: number }> => {
    const response = await send(path, options);
    const items = (await response.json()) as T[];
    const header = response.headers.get('X-Total-Count');
    return { items, total: header === null ? items.length : Number(header) };
  };

  return { request, page };
};

export type ApiClient = ReturnType<typeof createApiClient>;
