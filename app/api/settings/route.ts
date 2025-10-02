import { authenticateRequest } from '@/lib/auth/middleware';
import SimpleSettings from '@/lib/models/SimpleSettings';
import connectToDatabase from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas for different setting sections
const generalSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  siteDescription: z.string().optional(),
  siteUrl: z.string().url('Invalid URL format'),
  adminEmail: z.string().email('Invalid email format'),
  timezone: z.string().min(1, 'Timezone is required'),
  language: z.string().min(1, 'Language is required')
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  inquiryAlerts: z.boolean(),
  projectUpdates: z.boolean(),
  systemAlerts: z.boolean()
});

const securitySettingsSchema = z.object({
  twoFactorAuth: z.boolean(),
  sessionTimeout: z.number().min(5).max(480),
  passwordPolicy: z.object({
    minLength: z.number().min(6).max(32),
    requireUppercase: z.boolean(),
    requireNumbers: z.boolean(),
    requireSymbols: z.boolean()
  }),
  ipWhitelist: z.array(z.string()).optional()
});

const appearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  logo: z.string().url().optional().or(z.literal('')),
  favicon: z.string().url().optional().or(z.literal(''))
});

const integrationSettingsSchema = z.object({
  googleAnalytics: z.string().optional(),
  facebookPixel: z.string().optional(),
  mailchimpApiKey: z.string().optional(),
  slackWebhook: z.string().url().optional().or(z.literal(''))
});

const backupSettingsSchema = z.object({
  autoBackup: z.boolean(),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
  backupRetention: z.number().min(1).max(365),
  lastBackup: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    console.log('Settings GET request started');
    const authResult = await authenticateRequest(request);
    console.log('Auth result:', authResult.response ? 'Failed' : 'Success');

    if (authResult.response) {
      console.log('Auth failed with response:', authResult.response.status);
      return authResult.response;
    }

    if (!authResult.user) {
      console.log('No authenticated user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('User role:', authResult.user.role);

    // Check if user has admin permissions
    if (!['super_admin', 'admin'].includes(authResult.user.role)) {
      console.log('User does not have admin permissions');
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Database connected successfully');

    // Get settings from database
    console.log('Fetching settings from database...');
    let settings = await SimpleSettings.findOne({});
    console.log('Settings fetch result:', settings ? 'Found settings' : 'No settings found');

    // Default settings structure
    const defaultSettings = {
      general: {
        siteName: 'Four Eyed Gems',
        siteDescription: 'Comprehensive admin panel for Four Eyed Gems management',
        siteUrl: 'https://admin.example.com',
        adminEmail: 'admin@example.com',
        timezone: 'UTC',
        language: 'en'
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        inquiryAlerts: true,
        projectUpdates: true,
        systemAlerts: true
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: false
        },
        ipWhitelist: []
      },
      appearance: {
        theme: 'system',
        primaryColor: '#4B49AC',
        logo: 'https://example.com/logo.png',
        favicon: 'https://example.com/favicon.ico'
      },
      integrations: {
        googleAnalytics: '',
        facebookPixel: '',
        mailchimpApiKey: '',
        slackWebhook: ''
      },
      backup: {
        autoBackup: true,
        backupFrequency: 'daily',
        backupRetention: 30,
        lastBackup: new Date().toISOString()
      }
    };
    
    if (!settings) {
      // Create default settings if none exist
      console.log('Creating default settings...');
      try {
        settings = new SimpleSettings(defaultSettings);
        await settings.save();
        console.log('Default settings created successfully');
      } catch (saveError) {
        console.error('Error saving default settings:', saveError);
        throw saveError;
      }
    } else {
      console.log('Settings already exist, returning them');
      // For now, just return existing settings without complex merging
      // to isolate the issue
    }

    console.log('About to call settings.toObject()');
    const settingsData = settings.toObject();
    console.log('settings.toObject() succeeded');
    console.log('Returning settings data successfully');
    return NextResponse.json({
      success: true,
      data: settingsData
    });

  } catch (error) {
    console.error('Settings fetch error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    
    if (authResult.response) {
      return authResult.response;
    }

    if (!authResult.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has admin permissions
    if (!['super_admin', 'admin'].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: 'Section and data are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Validate data based on section
    let validatedData;
    switch (section) {
      case 'general':
        validatedData = generalSettingsSchema.parse(data);
        break;
      case 'notifications':
        validatedData = notificationSettingsSchema.parse(data);
        break;
      case 'security':
        validatedData = securitySettingsSchema.parse(data);
        break;
      case 'appearance':
        validatedData = appearanceSettingsSchema.parse(data);
        break;
      case 'integrations':
        validatedData = integrationSettingsSchema.parse(data);
        break;
      case 'backup':
        validatedData = backupSettingsSchema.parse(data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid section' },
          { status: 400 }
        );
    }

    // Update settings
    const settings = await SimpleSettings.findOneAndUpdate(
      {},
      { 
        $set: { [section]: validatedData },
        $setOnInsert: { createdAt: new Date() }
      },
      { 
        upsert: true, 
        new: true, 
        runValidators: true 
      }
    );

    if (!settings) {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: settings.toObject(),
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Settings update error:', error);
    console.error('Error details:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
