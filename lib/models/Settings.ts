import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  general: any;
  notifications: any;
  security: any;
  appearance: any;
  integrations: any;
  backup: any;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    general: {
      type: Schema.Types.Mixed,
      default: {}
    },
    notifications: {
      type: Schema.Types.Mixed,
      default: {}
    },
    security: {
      type: Schema.Types.Mixed,
      default: {}
    },
    appearance: {
      type: Schema.Types.Mixed,
      default: {}
    },
    integrations: {
      type: Schema.Types.Mixed,
      default: {}
    },
    backup: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Ensure only one settings document exists
// settingsSchema.index({}, { unique: true });

const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);

export default Settings;