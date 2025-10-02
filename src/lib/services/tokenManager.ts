import { User } from '../../contexts/AuthContext';
import { getTokenExpirationTime, isTokenExpired } from '../auth/jwt';

export interface TokenData {
  token: string;
  refreshToken: string;
  user: User;
  expiresAt: number;
}

export interface RefreshResponse {
  success: boolean;
  token?: string;
  error?: string;
}

class TokenManager {
  private refreshPromise: Promise<RefreshResponse> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  /**
   * Get tokens from localStorage
   */
  getTokens(): TokenData | null {
    if (typeof window === 'undefined') return null;

    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      const user = localStorage.getItem('user');

      if (!token || !refreshToken || !user) {
        return null;
      }

      const userData = JSON.parse(user);
      const expiresAt = getTokenExpirationTime(token) || 0;

      return {
        token,
        refreshToken,
        user: userData,
        expiresAt,
      };
    } catch (error) {
      console.error('Error getting tokens:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Save tokens to localStorage
   */
  setTokens(token: string, refreshToken: string, user: User): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Set up automatic refresh timer
      this.setupRefreshTimer(token);
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  /**
   * Clear all tokens from localStorage
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Clear refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Check if current token is valid
   */
  isTokenValid(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;

    return !isTokenExpired(tokens.token);
  }

  /**
   * Get valid token, refresh if necessary
   */
  async getValidToken(): Promise<string | null> {
    const tokens = this.getTokens();
    if (!tokens) return null;

    // If token is still valid, return it
    if (!isTokenExpired(tokens.token)) {
      return tokens.token;
    }

    // If refresh is already in progress, wait for it
    if (this.refreshPromise) {
      const result = await this.refreshPromise;
      return result.success ? result.token || null : null;
    }

    // Start refresh process
    this.refreshPromise = this.refreshToken();
    const result = await this.refreshPromise;
    this.refreshPromise = null;

    return result.success ? result.token || null : null;
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshToken(): Promise<RefreshResponse> {
    const tokens = this.getTokens();
    if (!tokens) {
      return { success: false, error: 'No refresh token available' };
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: tokens.refreshToken,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update token in localStorage
        this.setTokens(data.token, tokens.refreshToken, tokens.user);
        return { success: true, token: data.token };
      } else {
        // Refresh failed, clear tokens
        this.clearTokens();
        return { success: false, error: data.error || 'Token refresh failed' };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      return { success: false, error: 'Network error during token refresh' };
    }
  }

  /**
   * Set up automatic token refresh timer
   */
  private setupRefreshTimer(token: string): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    const expiresAt = getTokenExpirationTime(token);
    if (!expiresAt) return;

    // Refresh token 5 minutes before expiration
    const refreshTime = expiresAt - Date.now() - (5 * 60 * 1000);

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(async () => {
        await this.getValidToken();
      }, refreshTime);
    }
  }

  /**
   * Logout user and clear all tokens
   */
  async logout(): Promise<void> {
    const tokens = this.getTokens();
    
    if (tokens) {
      try {
        // Call logout API to log the activity
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }

    this.clearTokens();
  }

  /**
   * Get current user data
   */
  getCurrentUser(): User | null {
    const tokens = this.getTokens();
    return tokens?.user || null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isTokenValid();
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
