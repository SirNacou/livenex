import type { ApiResponse, ApiErrorResponse } from "@shared/types";

/**
 * Fetch wrapper for API calls with automatic envelope handling
 */
export const apiClient = {
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    return handleResponse<T>(response);
  },

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return handleResponse<T>(response);
  },

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    return handleResponse<T>(response);
  },
};

async function handleResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> | ApiErrorResponse = await response.json();

  if (!data.ok) {
    const error = data as ApiErrorResponse;
    throw new Error(`${error.error.code}: ${error.error.message}`);
  }

  return (data as ApiResponse<T>).data;
}

export default apiClient;
