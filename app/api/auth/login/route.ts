import { loginUser } from '@/lib/services/auth';
import { loginSchema } from '@/lib/validations/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = loginSchema.parse(body);

    // Attempt login
    const result = await loginUser(validatedData.email, validatedData.password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // Return success response with tokens
    return NextResponse.json({
      success: true,
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user,
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Login API error:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

