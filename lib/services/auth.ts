import bcrypt from 'bcryptjs';
import { generateRefreshToken, generateToken } from '../auth/jwt';
import { ActivityLog, User } from '../models';
import connectToDatabase from '../mongodb';

export interface LoginResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: any;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: any;
  error?: string;
}

/**
 * Authenticate user with email and password
 */
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  try {
    await connectToDatabase();

    // Find user by email and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!user.isActive) {
      return { success: false, error: 'Account is deactivated' };
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Log activity
    await ActivityLog.createLog(
      user._id,
      'LOGIN',
      'auth',
      'User logged in successfully',
      {
        category: 'auth',
        severity: 'low',
      }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      success: true,
      token,
      refreshToken,
      user: userResponse,
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

/**
 * Register a new user (admin only)
 */
export async function registerUser(
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'super_admin' | 'admin' | 'staff';
    phone?: string;
    department?: string;
  },
  createdBy: string
): Promise<RegisterResult> {
  try {
    await connectToDatabase();

    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      return { success: false, error: 'Email address is already registered' };
    }

    // Create new user
    const user = new User({
      ...userData,
      email: userData.email.toLowerCase(),
    });

    await user.save();

    // Log activity
    await ActivityLog.createLog(
      createdBy as any,
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
        },
      }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return { success: true, user: userResponse };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed. Please try again.' };
  }
}

/**
 * Change user password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    // Log activity
    await ActivityLog.createLog(
      userId as any,
      'CHANGE_PASSWORD',
      'auth',
      'Password changed successfully',
      {
        category: 'auth',
        severity: 'medium',
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Password change error:', error);
    return { success: false, error: 'Password change failed. Please try again.' };
  }
}

/**
 * Reset user password (admin function)
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string,
  resetBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    // Log activity
    await ActivityLog.createLog(
      resetBy as any,
      'RESET_PASSWORD',
      'user',
      `Password reset for user: ${user.firstName} ${user.lastName}`,
      {
        category: 'user',
        severity: 'high',
        resourceId: user._id,
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: 'Password reset failed. Please try again.' };
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  try {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Get profile error:', error);
    return { success: false, error: 'Failed to get user profile' };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updateData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: string;
  }
) {
  try {
    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    // Log activity
    await ActivityLog.createLog(
      userId as any,
      'UPDATE_PROFILE',
      'user',
      'Profile updated',
      {
        category: 'user',
        severity: 'low',
        metadata: updateData,
      }
    );

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

