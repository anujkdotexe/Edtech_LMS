// API client wrapper for Fastify backend communication with automatic 401 token refresh

const getLocale = (): string => {
  if (typeof window !== 'undefined') {
    return window.navigator.language.split('-')[0] || 'en';
  }
  return 'en';
};

let refreshPromise: Promise<boolean> | null = null;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  headers.set('Accept-Language', getLocale());

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  });

  const isAuthEndpoint =
    path.includes('/api/auth/login') ||
    path.includes('/api/auth/signup') ||
    path.includes('/api/auth/refresh');

  if (response.status === 401 && !isAuthEndpoint) {
    if (!refreshPromise) {
      refreshPromise = fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
        .then((r) => r.ok)
        .catch(() => false);
    }

    const refreshed = await refreshPromise;
    refreshPromise = null;

    if (refreshed) {
      // Retry original request once
      const retryResponse = await fetch(path, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!retryResponse.ok) {
        let errMessage = 'An unexpected error occurred';
        try {
          const errData = await retryResponse.json();
          errMessage = errData.message || errData.error || errMessage;
        } catch {
          // Keep fallback
        }
        throw new Error(errMessage);
      }

      if (retryResponse.status === 204) {
        return {} as T;
      }
      return retryResponse.json();
    }
  }

  if (!response.ok) {
    let errorMessage = 'An unexpected error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Keep fallback
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
