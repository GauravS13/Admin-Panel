import bcrypt from 'bcryptjs';
import { User } from '../models';
import connectToDatabase from '../mongodb';

/**
 * Setup script to create default admin user
 */
export async function createDefaultAdmin() {
  try {
    await connectToDatabase();

    // Check if any users exist
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('Users already exist. Skipping default admin creation.');
      return { success: true, message: 'Users already exist' };
    }

    // Get credentials from environment variables
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@itconsultancy.com';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';

    // Check if default admin already exists
    const existingAdmin = await User.findOne({ email: defaultEmail.toLowerCase() });
    if (existingAdmin) {
      console.log('Default admin already exists.');
      return { success: true, message: 'Default admin already exists' };
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Create default admin user
    const adminUser = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email: defaultEmail.toLowerCase(),
      password: hashedPassword,
      role: 'super_admin',
      department: 'IT',
      isActive: true,
    });

    await adminUser.save();

    console.log('Default admin user created successfully!');
    console.log(`Email: ${defaultEmail}`);
    console.log(`Password: ${defaultPassword}`);
    console.log('Please change the password after first login.');

    return {
      success: true,
      message: 'Default admin user created successfully',
      user: {
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role,
      },
    };
  } catch (error) {
    console.error('Error creating default admin:', error);
    return {
      success: false,
      error: 'Failed to create default admin user',
    };
  }
}

/**
 * Check if database is properly set up
 */
export async function checkDatabaseSetup() {
  try {
    await connectToDatabase();

    const userCount = await User.countDocuments();
    const hasAdmin = await User.findOne({ role: 'super_admin', isActive: true });

    return {
      success: true,
      data: {
        userCount,
        hasAdmin: !!hasAdmin,
        databaseConnected: true,
      },
    };
  } catch (error) {
    console.error('Database setup check failed:', error);
    return {
      success: false,
      error: 'Database connection failed',
      data: {
        userCount: 0,
        hasAdmin: false,
        databaseConnected: false,
      },
    };
  }
}
