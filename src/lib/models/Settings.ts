import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  _id: string;
  company: {
    name: string;
    description?: string;
    email: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    website?: string;
    logo?: string;
    socialLinks?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      instagram?: string;
    };
  };
  email: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    fromEmail: string;
    fromName: string;
    replyToEmail?: string;
  };
  notifications: {
    emailOnNewInquiry: boolean;
    emailOnInquiryUpdate: boolean;
    emailOnProjectDeadline: boolean;
    emailOnClientUpdate: boolean;
    emailOnSystemError: boolean;
  };
  security: {
    sessionTimeout: number; // in minutes
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    passwordRequireNumbers: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number; // in minutes
  };
  system: {
    timezone: string;
    dateFormat: string;
    currency: string;
    defaultInquiryCategory: string;
    defaultProjectCategory: string;
    maintenanceMode: boolean;
  };
  integrations?: {
    googleAnalyticsId?: string;
    googleMapsApiKey?: string;
    slackWebhookUrl?: string;
    webhookUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    company: {
      name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters'],
      },
      description: {
        type: String,
        trim: true,
        maxlength: [500, 'Company description cannot exceed 500 characters'],
      },
      email: {
        type: String,
        required: [true, 'Company email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      },
      phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'],
      },
      address: {
        street: {
          type: String,
          trim: true,
          maxlength: [200, 'Street address cannot exceed 200 characters'],
        },
        city: {
          type: String,
          trim: true,
          maxlength: [100, 'City cannot exceed 100 characters'],
        },
        state: {
          type: String,
          trim: true,
          maxlength: [100, 'State cannot exceed 100 characters'],
        },
        zipCode: {
          type: String,
          trim: true,
          maxlength: [20, 'ZIP code cannot exceed 20 characters'],
        },
        country: {
          type: String,
          trim: true,
          maxlength: [100, 'Country cannot exceed 100 characters'],
        },
      },
      website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.*/, 'Website must be a valid URL'],
      },
      logo: {
        type: String,
        trim: true,
      },
      socialLinks: {
        linkedin: {
          type: String,
          trim: true,
          match: [/^https?:\/\/.*/, 'LinkedIn must be a valid URL'],
        },
        twitter: {
          type: String,
          trim: true,
          match: [/^https?:\/\/.*/, 'Twitter must be a valid URL'],
        },
        facebook: {
          type: String,
          trim: true,
          match: [/^https?:\/\/.*/, 'Facebook must be a valid URL'],
        },
        instagram: {
          type: String,
          trim: true,
          match: [/^https?:\/\/.*/, 'Instagram must be a valid URL'],
        },
      },
    },
    email: {
      smtpHost: {
        type: String,
        trim: true,
      },
      smtpPort: {
        type: Number,
        min: [1, 'SMTP port must be a positive number'],
        max: [65535, 'SMTP port must be less than 65536'],
      },
      smtpUser: {
        type: String,
        trim: true,
      },
      smtpPassword: {
        type: String,
        trim: true,
      },
      fromEmail: {
        type: String,
        required: [true, 'From email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      },
      fromName: {
        type: String,
        required: [true, 'From name is required'],
        trim: true,
        maxlength: [100, 'From name cannot exceed 100 characters'],
      },
      replyToEmail: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      },
    },
    notifications: {
      emailOnNewInquiry: {
        type: Boolean,
        default: true,
      },
      emailOnInquiryUpdate: {
        type: Boolean,
        default: true,
      },
      emailOnProjectDeadline: {
        type: Boolean,
        default: true,
      },
      emailOnClientUpdate: {
        type: Boolean,
        default: false,
      },
      emailOnSystemError: {
        type: Boolean,
        default: true,
      },
    },
    security: {
      sessionTimeout: {
        type: Number,
        default: 480, // 8 hours in minutes
        min: [15, 'Session timeout must be at least 15 minutes'],
        max: [1440, 'Session timeout cannot exceed 24 hours'],
      },
      passwordMinLength: {
        type: Number,
        default: 8,
        min: [6, 'Password minimum length must be at least 6'],
        max: [128, 'Password minimum length cannot exceed 128'],
      },
      passwordRequireSpecialChars: {
        type: Boolean,
        default: true,
      },
      passwordRequireNumbers: {
        type: Boolean,
        default: true,
      },
      maxLoginAttempts: {
        type: Number,
        default: 5,
        min: [3, 'Maximum login attempts must be at least 3'],
        max: [20, 'Maximum login attempts cannot exceed 20'],
      },
      lockoutDuration: {
        type: Number,
        default: 30, // 30 minutes
        min: [5, 'Lockout duration must be at least 5 minutes'],
        max: [1440, 'Lockout duration cannot exceed 24 hours'],
      },
    },
    system: {
      timezone: {
        type: String,
        default: 'UTC',
        trim: true,
      },
      dateFormat: {
        type: String,
        default: 'MM/DD/YYYY',
        enum: {
          values: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
          message: 'Date format must be one of: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD',
        },
      },
      currency: {
        type: String,
        default: 'USD',
        trim: true,
        maxlength: [3, 'Currency code cannot exceed 3 characters'],
      },
      defaultInquiryCategory: {
        type: String,
        default: 'General',
        trim: true,
        maxlength: [50, 'Default inquiry category cannot exceed 50 characters'],
      },
      defaultProjectCategory: {
        type: String,
        default: 'Consulting',
        trim: true,
        maxlength: [50, 'Default project category cannot exceed 50 characters'],
      },
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
    },
    integrations: {
      googleAnalyticsId: {
        type: String,
        trim: true,
        match: [/^G-[A-Z0-9]+$/, 'Google Analytics ID must be in format G-XXXXXXXXXX'],
      },
      googleMapsApiKey: {
        type: String,
        trim: true,
      },
      slackWebhookUrl: {
        type: String,
        trim: true,
        match: [/^https:\/\/hooks\.slack\.com\/.*/, 'Slack webhook URL must be a valid Slack webhook URL'],
      },
      webhookUrl: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.*/, 'Webhook URL must be a valid URL'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
settingsSchema.pre('save', async function (next) {
  const settings = this as ISettings;

  if (settings.isNew) {
    const existingSettings = await mongoose.models.Settings.findOne({});
    if (existingSettings) {
      const error = new Error('Settings document already exists. Use update instead.');
      return next(error);
    }
  }

  next();
});

// Static method to get settings (singleton pattern)
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({});
  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({
      company: {
        name: 'Four Eyed Gems',
        email: 'admin@foureyedgems.com',
        fromEmail: 'noreply@foureyedgems.com',
        fromName: 'Four Eyed Gems',
      },
      email: {
        fromEmail: 'noreply@foureyedgems.com',
        fromName: 'Four Eyed Gems',
      },
      notifications: {},
      security: {},
      system: {},
    });
  }
  return settings;
};

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);


