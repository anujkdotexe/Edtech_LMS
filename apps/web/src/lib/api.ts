// API client wrapper for decoupled Fastify communication

const getLocale = (): string => {
  if (typeof window !== 'undefined') {
    return window.navigator.language.split('-')[0] || 'en';
  }
  return 'en';
};

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  // Set JSON content-type if body is provided and not FormData
  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Inject user locale for dynamic database syllabus translations fallback
  headers.set('Accept-Language', getLocale());

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include', // Crucial for HttpOnly cookies authentication
  });

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

  // Handle empty or 204 responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
