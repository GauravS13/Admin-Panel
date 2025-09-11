/**
 * Token Manager Tests
 * 
 * These tests demonstrate the token management functionality
 * Run with: npm test or jest
 */

import { tokenManager } from '../tokenManager';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe('TokenManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('getTokens', () => {
    it('should return null when no tokens are stored', () => {
      const tokens = tokenManager.getTokens();
      expect(tokens).toBeNull();
    });

    it('should return tokens when valid data is stored', () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockToken = 'valid-token';
      const mockRefreshToken = 'valid-refresh-token';

      localStorageMock.getItem
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(mockRefreshToken)
        .mockReturnValueOnce(JSON.stringify(mockUser));

      const tokens = tokenManager.getTokens();
      
      expect(tokens).toEqual({
        token: mockToken,
        refreshToken: mockRefreshToken,
        user: mockUser,
        expiresAt: expect.any(Number),
      });
    });
  });

  describe('setTokens', () => {
    it('should store tokens in localStorage', () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockToken = 'valid-token';
      const mockRefreshToken = 'valid-refresh-token';

      tokenManager.setTokens(mockToken, mockRefreshToken, mockUser);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', mockRefreshToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });
  });

  describe('clearTokens', () => {
    it('should remove all tokens from localStorage', () => {
      tokenManager.clearTokens();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('isTokenValid', () => {
    it('should return false when no tokens exist', () => {
      const isValid = tokenManager.isTokenValid();
      expect(isValid).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear tokens and call logout API', async () => {
      const mockToken = 'valid-token';
      const mockRefreshToken = 'valid-refresh-token';
      const mockUser = { id: '1', email: 'test@example.com' };

      localStorageMock.getItem
        .mockReturnValueOnce(mockToken)
        .mockReturnValueOnce(mockRefreshToken)
        .mockReturnValueOnce(JSON.stringify(mockUser));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await tokenManager.logout();

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json',
        },
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });
});

/**
 * Example usage in a component:
 * 
 * import { useAuth } from '@/contexts/AuthContext';
 * 
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 * 
 *   if (!isAuthenticated) {
 *     return <LoginForm />;
 *   }
 * 
 *   return (
 *     <div>
 *       <h1>Welcome, {user.firstName}!</h1>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 */
