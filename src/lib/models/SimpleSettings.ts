import mongoose, { Document, Schema } from 'mongoose';

export interface ISimpleSettings extends Document {
  general: any;
  notifications: any;
  security: any;
  appearance: any;
  integrations: any;
  backup: any;
  createdAt: Date;
  updatedAt: Date;
}

const simpleSettingsSchema = new Schema<ISimpleSettings>(
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

const SimpleSettings = mongoose.models.SimpleSettings || mongoose.model<ISimpleSettings>('SimpleSettings', simpleSettingsSchema);

export default SimpleSettings;
