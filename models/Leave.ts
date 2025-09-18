import mongoose, { Document, Schema } from 'mongoose';

export interface ILeave extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  userProfileURL?: string;
  type: 'vacation' | 'sick' | 'personal' | 'emergency' | 'other';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminComments?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    userEmail: {
      type: String,
      required: [true, 'User email is required'],
      lowercase: true,
      trim: true,
    },
    userProfileURL: {
      type: String,
      required: false,
      default: '',
    },
    type: {
      type: String,
      enum: ['vacation', 'sick', 'personal', 'emergency', 'other'],
      required: [true, 'Leave type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminComments: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin comments cannot exceed 500 characters'],
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for better query performance
LeaveSchema.index({ userId: 1, status: 1 });
LeaveSchema.index({ status: 1, createdAt: -1 });

// Helper class for leave operations
export class LeaveService {
  // Update user information in all leave records
  static async updateUserInLeaveRecords(userId: string, newName: string, newEmail: string, newProfileURL?: string): Promise<void> {
    try {
      const updateData: any = {
        userName: newName,
        userEmail: newEmail
      };

      if (newProfileURL !== undefined) {
        updateData.userProfileURL = newProfileURL;
      }

      // Use mongoose.models to avoid reference issues
      const LeaveModel = mongoose.models.Leave || mongoose.model<ILeave>('Leave', LeaveSchema, 'leaves');
      await LeaveModel.updateMany(
        { userId: userId },
        {
          $set: updateData
        }
      );
    } catch (error) {
      console.error('Error updating leave records:', error);
      throw error;
    }
  }
}

// Clear the model if it exists (for hot reload in development)
if (mongoose.models.Leave) {
  delete mongoose.models.Leave;
}

export default mongoose.model<ILeave>('Leave', LeaveSchema);
