import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  website?: string;
  industry?: string;
  status: 'active' | 'inactive' | 'prospect' | 'former';
  source: 'inquiry' | 'referral' | 'cold_outreach' | 'conference' | 'social_media' | 'other';
  assignedTo?: mongoose.Types.ObjectId;
  tags: string[];
  notes: Array<{
    content: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
  totalProjects: number;
  totalRevenue: number;
  lastContact?: Date;
  nextFollowUp?: Date;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    position: {
      type: String,
      trim: true,
      maxlength: [100, 'Position cannot exceed 100 characters'],
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
    industry: {
      type: String,
      trim: true,
      maxlength: [100, 'Industry cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'prospect', 'former'],
        message: 'Status must be one of: active, inactive, prospect, former',
      },
      default: 'prospect',
    },
    source: {
      type: String,
      enum: {
        values: ['inquiry', 'referral', 'cold_outreach', 'conference', 'social_media', 'other'],
        message: 'Source must be one of: inquiry, referral, cold_outreach, conference, social_media, other',
      },
      default: 'inquiry',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, 'Tag cannot exceed 30 characters'],
    }],
    notes: [{
      content: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Note content cannot exceed 1000 characters'],
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    totalProjects: {
      type: Number,
      default: 0,
      min: [0, 'Total projects cannot be negative'],
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: [0, 'Total revenue cannot be negative'],
    },
    lastContact: {
      type: Date,
    },
    nextFollowUp: {
      type: Date,
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
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
clientSchema.virtual('fullName').get(function (this: IClient) {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for full address
clientSchema.virtual('fullAddress').get(function (this: IClient) {
  if (!this.address) return '';
  const { street, city, state, zipCode, country } = this.address;
  const parts = [street, city, state, zipCode, country].filter(Boolean);
  return parts.join(', ');
});

// Indexes for better query performance
clientSchema.index({ status: 1 });
clientSchema.index({ assignedTo: 1 });
clientSchema.index({ company: 1 });
clientSchema.index({ industry: 1 });
clientSchema.index({ createdAt: -1 });
clientSchema.index({ isArchived: 1 });
clientSchema.index({ nextFollowUp: 1 });
clientSchema.index({ status: 1, assignedTo: 1 });

export default mongoose.models.Client || mongoose.model<IClient>('Client', clientSchema);
