/* eslint-disable @typescript-eslint/no-explicit-any */
import { verifyToken } from '@/lib/auth/jwt';
import { ActivityLog } from '@/lib/models';
import connectToDatabase from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      // Verify token to get user info for logging
      const decoded = verifyToken(token);
      
      if (decoded) {
        await connectToDatabase();
        
        // Log logout activity
        await (ActivityLog as any).createLog(
          decoded.userId as string,
          'LOGOUT',
          'auth',
          'User logged out',
          {
            category: 'auth',
            severity: 'low',
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
