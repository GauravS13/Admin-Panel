import { NextRequest, NextResponse } from 'next/server';
import { User } from '../models';
import connectToDatabase from '../mongodb';
import { extractTokenFromHeader, JWTPayload, verifyToken } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Authentication middleware for API routes
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  user: JWTPayload | null;
  response: NextResponse | null;
}> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        user: null,
        response: NextResponse.json(
          { error: 'Access token is required' },
          { status: 401 }
        ),
      };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return {
        user: null,
        response: NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        ),
      };
    }

    // Verify user still exists and is active
    await connectToDatabase();
    const user = await User.findById(decoded.userId).select('+password');

    if (!user || !user.isActive) {
      return {
        user: null,
        response: NextResponse.json(
          { error: 'User not found or inactive' },
          { status: 401 }
        ),
      };
    }

    // Update last login if it's been more than an hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!user.lastLogin || user.lastLogin < oneHourAgo) {
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    }

    return { user: decoded, response: null };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Authorization middleware to check user roles
 */
export function authorizeRoles(allowedRoles: string[]) {
  return async (request: NextRequest): Promise<{
    user: JWTPayload | null;
    response: NextResponse | null;
  }> => {
    const authResult = await authenticateRequest(request);

    if (authResult.response) {
      return authResult;
    }

    if (!authResult.user) {
      return {
        user: null,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    if (!allowedRoles.includes(authResult.user.role)) {
      return {
        user: null,
        response: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        ),
      };
    }

    return { user: authResult.user, response: null };
  };
}

/**
 * Combined authentication and authorization middleware
 */
export function withAuth(allowedRoles?: string[]) {
  return async (request: NextRequest): Promise<{
    user: JWTPayload;
    response: NextResponse | null;
  }> => {
    if (allowedRoles && allowedRoles.length > 0) {
      const authResult = await authorizeRoles(allowedRoles)(request);
      if (authResult.response) {
        return { user: null as any, response: authResult.response };
      }
      return { user: authResult.user!, response: null };
    } else {
      const authResult = await authenticateRequest(request);
      if (authResult.response) {
        return { user: null as any, response: authResult.response };
      }
      return { user: authResult.user!, response: null };
    }
  };
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

