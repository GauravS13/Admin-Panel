import { tokenManager } from './tokenManager';

export interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  retryOnAuthFailure?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

class HttpClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * Make HTTP request with automatic token handling
   */
  async request<T = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      requireAuth = true,
      retryOnAuthFailure = true,
      ...fetchOptions
    } = options;

    // Add authentication header if required
    if (requireAuth) {
      const token = await tokenManager.getValidToken();
      if (!token) {
        return {
          success: false,
          error: 'Authentication required',
          status: 401,
        };
      }

      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      // Handle authentication errors
      if (response.status === 401 && requireAuth && retryOnAuthFailure) {
        // Try to refresh token and retry once
        const refreshedToken = await tokenManager.getValidToken();
        
        if (refreshedToken) {
          // Retry with new token
          const retryResponse = await fetch(`${this.baseURL}${url}`, {
            ...fetchOptions,
            headers: {
              ...fetchOptions.headers,
              'Authorization': `Bearer ${refreshedToken}`,
            },
          });

          if (retryResponse.ok) {
            const data = await retryResponse.json();
            return {
              success: true,
              data,
              status: retryResponse.status,
            };
          }
        }

        // If retry failed, user needs to login again
        await tokenManager.logout();
        window.location.href = '/login';
        
        return {
          success: false,
          error: 'Session expired. Please login again.',
          status: 401,
        };
      }

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data,
          status: response.status,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Request failed',
          status: response.status,
        };
      }
    } catch (error) {
      console.error('HTTP request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export singleton instance
export const httpClient = new HttpClient();
