import { checkDatabaseSetup, createDefaultAdmin } from '@/lib/services/setup';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/setup - Check database setup status
export async function GET() {
  try {
    const result = await checkDatabaseSetup();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json(
      { error: 'Setup check failed' },
      { status: 500 }
    );
  }
}

// POST /api/setup - Create default admin user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create-admin') {
      const result = await createDefaultAdmin();
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed' },
      { status: 500 }
    );
  }
}
