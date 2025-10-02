/* eslint-disable @typescript-eslint/no-explicit-any */

import { withAuth } from '@/lib/auth/middleware';
import { ActivityLog, User } from '@/lib/models';
import connectToDatabase from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

// Validation schema for password reset
const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth(['super_admin', 'admin'])(request);
  if (authResult.response) return authResult.response;

  try {
    await connectToDatabase();
    const { id } = await params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions - users can only view their own profile unless they're admin/super_admin
    if (authResult.user!.role !== 'super_admin' && authResult.user!.role !== 'admin' &&
        authResult.user!.userId !== id) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth(['super_admin', 'admin'])(request);
  if (authResult.response) return authResult.response;

  try {
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);
    const { id } = await params;

    await connectToDatabase();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (authResult.user!.role !== 'super_admin' && authResult.user!.role !== 'admin') {
      // Regular users can only update their own profile
      if (authResult.user!.userId !== id) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      // Regular users cannot change their role
      if (validatedData.role) {
        return NextResponse.json(
          { error: 'Cannot change your own role' },
          { status: 403 }
        );
      }
    }

    // Only super_admin can create super_admin or admin users
    if (validatedData.role && (validatedData.role === 'super_admin' || validatedData.role === 'admin') &&
        authResult.user!.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions to assign this role' },
        { status: 403 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: validatedData.email.toLowerCase() });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email address is already registered' },
          { status: 400 }
        );
      }
      validatedData.email = validatedData.email.toLowerCase();
    }

    // Update user
    Object.assign(user, validatedData);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Log activity
    await (ActivityLog as any).createLog(
      authResult.user!.userId as string,
      'UPDATE_USER',
      'user',
      `Updated user: ${user.firstName} ${user.lastName}`,
      {
        category: 'user',
        severity: 'low',
        resourceId: user._id,
        metadata: {
          updatedFields: Object.keys(validatedData),
          updatedBy: authResult.user!.userId,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: userResponse,
      message: 'User updated successfully',
    });

  } catch (error) {
    console.error('Error updating user:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth(['super_admin', 'admin'])(request);
  if (authResult.response) return authResult.response;

  try {
    await connectToDatabase();
    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of super_admin users unless you're a super_admin
    if (user.role === 'super_admin' && authResult.user!.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete super admin users' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (authResult.user!.userId === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Log deletion activity
    await (ActivityLog as any).createLog(
      authResult.user!.userId as string,
      'DELETE_USER',
      'user',
      `Deleted user: ${user.firstName} ${user.lastName}`,
      {
        category: 'user',
        severity: 'high',
        resourceId: user._id,
        metadata: {
          deletedUserEmail: user.email,
          deletedUserRole: user.role,
          deletedBy: authResult.user!.userId,
        },
      }
    );

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id]/reset-password - Reset user password
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await withAuth(['super_admin', 'admin'])(request);
  if (authResult.response) return authResult.response;

  try {
    const body = await request.json();
    const { newPassword } = resetPasswordSchema.parse(body);
    const { id } = await params;

    await connectToDatabase();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(id, { password: hashedPassword });

    // Log activity
    await (ActivityLog as any).createLog(
      authResult.user!.userId as string,
      'RESET_PASSWORD',
      'user',
      `Password reset for user: ${user.firstName} ${user.lastName}`,
      {
        category: 'user',
        severity: 'high',
        resourceId: user._id,
        metadata: {
          resetBy: authResult.user!.userId,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });

  } catch (error) {
    console.error('Error resetting password:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

