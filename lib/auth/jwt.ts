import jwt from 'jsonwebtoken';
import type { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

/**
 * Generate JWT token for user authentication
 */
export function generateToken(user: IUser): string {
  const payload: JWTPayload = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, JWT_SECRET as any, { expiresIn: JWT_EXPIRES_IN } as any);
}

/**
 * Verify JWT token and return payload
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Generate refresh token (longer expiry)
 */
export function generateRefreshToken(user: IUser): string {
  const payload: JWTPayload = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, JWT_SECRET as any, { expiresIn: '30d' } as any);
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpirationTime(token: string): number | null {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (!decoded || !decoded.exp) {
      return null;
    }
    return decoded.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) {
    return true; // If we can't determine expiration, consider it expired
  }
  return Date.now() >= expirationTime;
}

