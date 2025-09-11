import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  _id: string;
  title: string;
  description: string;
  client: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId[];
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  services: string[];
  budget?: number;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: Date;
  endDate?: Date;
  deadline?: Date;
  progress: number; // 0-100
  tags: string[];
  milestones: Array<{
    title: string;
    description?: string;
    dueDate?: Date;
    completed: boolean;
    completedAt?: Date;
  }>;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
  }>;
  notes: Array<{
    content: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
  timeEntries: Array<{
    user: mongoose.Types.ObjectId;
    hours: number;
    description: string;
    date: Date;
    billable: boolean;
  }>;
  invoiceId?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client is required'],
    },
    assignedTo: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'At least one team member must be assigned'],
    }],
    status: {
      type: String,
      enum: {
        values: ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'],
        message: 'Status must be one of: planning, in_progress, on_hold, completed, cancelled',
      },
      default: 'planning',
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
    services: [{
      type: String,
      required: [true, 'At least one service is required'],
      trim: true,
      maxlength: [100, 'Service name cannot exceed 100 characters'],
    }],
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
    },
    estimatedHours: {
      type: Number,
      min: [0, 'Estimated hours cannot be negative'],
    },
    actualHours: {
      type: Number,
      default: 0,
      min: [0, 'Actual hours cannot be negative'],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    deadline: {
      type: Date,
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, 'Progress cannot be less than 0'],
      max: [100, 'Progress cannot be more than 100'],
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [30, 'Tag cannot exceed 30 characters'],
    }],
    milestones: [{
      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Milestone title cannot exceed 200 characters'],
      },
      description: {
        type: String,
        trim: true,
        maxlength: [500, 'Milestone description cannot exceed 500 characters'],
      },
      dueDate: {
        type: Date,
      },
      completed: {
        type: Boolean,
        default: false,
      },
      completedAt: {
        type: Date,
      },
    }],
    attachments: [{
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'File name cannot exceed 200 characters'],
      },
      url: {
        type: String,
        required: true,
        trim: true,
      },
      type: {
        type: String,
        required: true,
        trim: true,
      },
      size: {
        type: Number,
        required: true,
        min: [0, 'File size cannot be negative'],
      },
      uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
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
    timeEntries: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      hours: {
        type: Number,
        required: true,
        min: [0.01, 'Hours must be greater than 0'],
      },
      description: {
        type: String,
        trim: true,
        maxlength: [500, 'Time entry description cannot exceed 500 characters'],
      },
      date: {
        type: Date,
        required: true,
      },
      billable: {
        type: Boolean,
        default: true,
      },
    }],
    invoiceId: {
      type: String,
      trim: true,
      maxlength: [100, 'Invoice ID cannot exceed 100 characters'],
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

// Virtual for total billed hours
projectSchema.virtual('totalBilledHours').get(function (this: IProject) {
  return this.timeEntries
    .filter(entry => entry.billable)
    .reduce((total, entry) => total + entry.hours, 0);
});

// Virtual for total unbilled hours
projectSchema.virtual('totalUnbilledHours').get(function (this: IProject) {
  return this.timeEntries
    .filter(entry => !entry.billable)
    .reduce((total, entry) => total + entry.hours, 0);
});

// Virtual for project duration in days
projectSchema.virtual('durationInDays').get(function (this: IProject) {
  if (!this.startDate || !this.endDate) return null;
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
projectSchema.index({ client: 1 });
projectSchema.index({ assignedTo: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ deadline: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ isArchived: 1 });
projectSchema.index({ status: 1, client: 1 });
projectSchema.index({ assignedTo: 1, status: 1 });

// Pre-save middleware to update progress based on milestones
projectSchema.pre('save', function (next) {
  const project = this as IProject;

  if (project.milestones && project.milestones.length > 0) {
    const completedMilestones = project.milestones.filter(m => m.completed).length;
    project.progress = Math.round((completedMilestones / project.milestones.length) * 100);
  }

  next();
});

export default mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema);


