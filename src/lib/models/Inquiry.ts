import mongoose, { Document, Schema } from 'mongoose';

export interface IInquiry extends Document {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  source: 'website' | 'email' | 'phone' | 'referral' | 'social_media' | 'other';
  assignedTo?: mongoose.Types.ObjectId;
  notes: Array<{
    content: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
  tags: string[];
  isArchived: boolean;
  responseTime?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inquirySchema = new Schema<IInquiry>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
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
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['unread', 'read', 'in_progress', 'resolved', 'closed'],
        message: 'Status must be one of: unread, read, in_progress, resolved, closed',
      },
      default: 'unread',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: 'Priority must be one of: low, medium, high, urgent',
      },
      default: 'medium',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },
    source: {
      type: String,
      enum: {
        values: ['website', 'email', 'phone', 'referral', 'social_media', 'other'],
        message: 'Source must be one of: website, email, phone, referral, social_media, other',
      },
      default: 'website',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
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
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, 'Tag cannot exceed 30 characters'],
    }],
    isArchived: {
      type: Boolean,
      default: false,
    },
    responseTime: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
inquirySchema.index({ email: 1 });
inquirySchema.index({ status: 1 });
inquirySchema.index({ priority: 1 });
inquirySchema.index({ category: 1 });
inquirySchema.index({ assignedTo: 1 });
inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ isArchived: 1 });
inquirySchema.index({ status: 1, priority: 1 });
inquirySchema.index({ createdAt: -1, status: 1 });

// Virtual for days since creation
inquirySchema.virtual('daysSinceCreation').get(function (this: IInquiry) {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to set response time
inquirySchema.pre('save', function (next) {
  const inquiry = this as IInquiry;

  // If status changed to read and responseTime is not set
  if (inquiry.isModified('status') && inquiry.status === 'read' && !inquiry.responseTime) {
    inquiry.responseTime = new Date();
  }

  // If status changed to resolved and resolvedAt is not set
  if (inquiry.isModified('status') && inquiry.status === 'resolved' && !inquiry.resolvedAt) {
    inquiry.resolvedAt = new Date();
  }

  next();
});

export default mongoose.models.Inquiry || mongoose.model<IInquiry>('Inquiry', inquirySchema);


