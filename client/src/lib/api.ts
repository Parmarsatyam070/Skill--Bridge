const BASE_URL = '/api';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('skillbridge_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is FormData (e.g. file upload), remove Content-Type header so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle blob responses (e.g. PDF downloads)
  if (headers['Accept'] === 'application/pdf' || endpoint.includes('export-pdf')) {
    if (!response.ok) throw new Error('Failed to generate PDF');
    return (await response.blob()) as unknown as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: ApiError = data.error || {
      code: `HTTP_${response.status}`,
      message: data.message || 'An unexpected error occurred.',
    };
    throw error;
  }

  return data as T;
}

export const api = {
  get: <T = any>(url: string) => apiRequest<T>(url, { method: 'GET' }),
  post: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T = any>(url: string, body?: any) =>
    apiRequest<T>(url, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T = any>(url: string) => apiRequest<T>(url, { method: 'DELETE' }),
  upload: <T = any>(url: string, formData: FormData) =>
    apiRequest<T>(url, {
      method: 'POST',
      body: formData,
    }),
};
