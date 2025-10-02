import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  _id: string;
  user: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: mongoose.Types.ObjectId;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'user' | 'inquiry' | 'client' | 'project' | 'system' | 'settings';
  createdAt: Date;
}

export interface IActivityLogModel extends Model<IActivityLog> {
  createLog(
    userId: mongoose.Types.ObjectId,
    action: string,
    resource: string,
    description: string,
    options: {
      resourceId?: mongoose.Types.ObjectId;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      category: 'auth' | 'user' | 'inquiry' | 'client' | 'project' | 'system' | 'settings';
    }
  ): Promise<IActivityLog>;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required for activity log'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      maxlength: [100, 'Action cannot exceed 100 characters'],
    },
    resource: {
      type: String,
      required: [true, 'Resource is required'],
      trim: true,
      maxlength: [100, 'Resource cannot exceed 100 characters'],
    },
    resourceId: {
      type: Schema.Types.ObjectId,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Severity must be one of: low, medium, high, critical',
      },
      default: 'low',
    },
    category: {
      type: String,
      enum: {
        values: ['auth', 'user', 'inquiry', 'client', 'project', 'system', 'settings'],
        message: 'Category must be one of: auth, user, inquiry, client, project, system, settings',
      },
      required: [true, 'Category is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for better query performance
activityLogSchema.index({ user: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ resource: 1 });
activityLogSchema.index({ category: 1 });
activityLogSchema.index({ severity: 1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ severity: 1, createdAt: -1 });

// Static method to create activity log
activityLogSchema.statics.createLog = async function (
  userId: mongoose.Types.ObjectId,
  action: string,
  resource: string,
  description: string,
  options: {
    resourceId?: mongoose.Types.ObjectId;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category: 'auth' | 'user' | 'inquiry' | 'client' | 'project' | 'system' | 'settings';
  }
) {
  const logData: Partial<IActivityLog> = {
    user: userId,
    action,
    resource,
    description,
    category: options.category,
    severity: options.severity || 'low',
    resourceId: options.resourceId,
    metadata: options.metadata,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent,
  };

  return this.create(logData);
};

const ActivityLog: IActivityLogModel = (mongoose.models.ActivityLog as unknown as IActivityLogModel) || mongoose.model<IActivityLog, IActivityLogModel>('ActivityLog', activityLogSchema);
export default ActivityLog;

