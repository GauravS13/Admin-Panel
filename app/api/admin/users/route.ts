import { withAuth } from '@/lib/auth/middleware';
import { ActivityLog, User } from '@/lib/models';
import connectToDatabase from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for creating users
const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['super_admin', 'admin', 'staff']),
  phone: z.string().optional(),
  department: z.string().max(100).optional(),
});

// Validation schema for updating users
const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(['super_admin', 'admin', 'staff']).optional(),
  phone: z.string().optional(),
  department: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/users - List all users with filtering and pagination
export async function GET(request: NextRequest) {
  const authResult = await withAuth(['super_admin', 'admin'])(request);
  if (authResult.response) return authResult.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const department = searchParams.get('department');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    await connectToDatabase();

    // Build filter object
    const filter: any = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (isActive !== null && isActive !== undefined) filter.isActive = isActive === 'true';
    if (department) filter.department = { $regex: department, $options: 'i' };

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  const authResult = await withAuth(['super_admin', 'admin'])(request);
  if (authResult.response) return authResult.response;

  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    await connectToDatabase();

    // Check if email already exists
    const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email address is already registered' },
        { status: 400 }
      );
    }

    // Check role permissions - only super_admin can create super_admin or admin users
    if ((validatedData.role === 'super_admin' || validatedData.role === 'admin') &&
        authResult.user!.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create this user role' },
        { status: 403 }
      );
    }

    // Create new user
    const user = new User({
      ...validatedData,
      email: validatedData.email.toLowerCase(),
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Log activity
    await ActivityLog.createLog(
      authResult.user!.userId as any,
      'CREATE_USER',
      'user',
      `Created new user: ${user.firstName} ${user.lastName}`,
      {
        category: 'user',
        severity: 'medium',
        resourceId: user._id,
        metadata: {
          role: user.role,
          department: user.department,
          createdBy: authResult.user!.userId,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'User created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

