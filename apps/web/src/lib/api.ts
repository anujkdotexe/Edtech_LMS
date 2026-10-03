// Resilient API client wrapper for Fastify backend communication
// Features: automatic 401 token refresh concurrency, network timeout handling,
// abort signal chaining, robust JSON parsing, and 204 No Content resilience.

const getLocale = (): string => {
  if (typeof window !== 'undefined') {
    return window.navigator.language.split('-')[0] || 'en';
  }
  return 'en';
};

let refreshPromise: Promise<boolean> | null = null;

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { timeoutMs = 30000, signal: userSignal, ...fetchOptions } = options;

  // Setup abort controller with timeout chained to caller's signal
  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort(new Error(`Request timeout after ${timeoutMs}ms`));
  }, timeoutMs);

  let combinedSignal: AbortSignal;
  if (userSignal) {
    if (userSignal.aborted) {
      clearTimeout(timer);
      throw new Error('Request was aborted');
    }
    userSignal.addEventListener('abort', () => timeoutController.abort(userSignal.reason));
  }
  combinedSignal = timeoutController.signal;

  const headers = new Headers(fetchOptions.headers || {});
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData) && typeof fetchOptions.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept-Language', getLocale());

  const executeRequest = async (targetPath: string, extraOptions: RequestInit = {}): Promise<Response> => {
    return await fetch(targetPath, {
      ...fetchOptions,
      ...extraOptions,
      headers: extraOptions.headers || headers,
      credentials: 'include',
      signal: combinedSignal,
    });
  };

  const parseResponseBody = async (res: Response): Promise<any> => {
    if (res.status === 204 || res.status === 205) {
      return {} as T;
    }

    const contentType = res.headers.get('content-type') || '';
    const contentLength = res.headers.get('content-length');

    if (contentLength === '0') {
      return {} as T;
    }

    if (contentType.includes('application/json')) {
      try {
        const text = await res.text();
        return text ? JSON.parse(text) : ({} as T);
      } catch {
        return {} as T;
      }
    }

    // Fallback for non-JSON text responses
    try {
      const text = await res.text();
      return text;
    } catch {
      return {} as T;
    }
  };

  try {
    const response = await executeRequest(path);

    const isAuthEndpoint =
      path.includes('/api/auth/login') ||
      path.includes('/api/auth/signup') ||
      path.includes('/api/auth/refresh') ||
      path.includes('/api/auth/me');

    // Handle 401 Unauthorized with single shared refresh promise
    if (response.status === 401 && !isAuthEndpoint) {
      if (!refreshPromise) {
        refreshPromise = fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        })
          .then((r) => r.ok)
          .catch(() => false)
          .finally(() => {
            // Cleared only when promise settles, ensuring concurrent calls share the exact same refresh promise
            refreshPromise = null;
          });
      }

      const refreshed = await refreshPromise;

      if (refreshed) {
        // Retry the original request once with fresh access token
        const retryResponse = await executeRequest(path);
        if (!retryResponse.ok) {
          const errData = await parseResponseBody(retryResponse);
          const errMessage = (typeof errData === 'object' && (errData.message || errData.error)) || 'Request failed';
          throw new Error(errMessage);
        }
        return await parseResponseBody(retryResponse);
      } else {
        // Global 401 interceptor: redirect to login if session expired
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && !currentPath.startsWith('/reset-password')) {
            window.location.href = '/login';
          }
        }
      }
    }

    if (!response.ok) {
      const errorData = await parseResponseBody(response);
      let errorMessage = 'An unexpected error occurred';
      if (typeof errorData === 'object' && errorData !== null) {
        errorMessage = errorData.message || errorData.error || errorMessage;
      } else if (typeof errorData === 'string' && errorData.length > 0) {
        errorMessage = errorData;
      }
      throw new Error(errorMessage);
    }

    return await parseResponseBody(response);
  } finally {
    clearTimeout(timer);
  }
}
