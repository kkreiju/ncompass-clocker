import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAttendanceLog extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  action: 'clock-in' | 'clock-out';
  timestamp: Date;
  qrCodeId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceLogSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
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
    action: {
      type: String,
      enum: ['clock-in', 'clock-out'],
      required: [true, 'Action is required'],
      index: true,
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      index: true,
    },
    qrCodeId: {
      type: Schema.Types.ObjectId,
      ref: 'QRCode',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
AttendanceLogSchema.index({ userId: 1, timestamp: -1 });
AttendanceLogSchema.index({ timestamp: -1 });
AttendanceLogSchema.index({ userId: 1, action: 1, timestamp: -1 });

// Utility function to generate collection name based on month/year
export function getAttendanceCollectionName(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}${year}-attendances`;
}

// Utility function to get model for specific month
export function getAttendanceModel(date: Date = new Date()): Model<IAttendanceLog> {
  const collectionName = getAttendanceCollectionName(date);
  
  // Check if model already exists
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName] as Model<IAttendanceLog>;
  }
  
  // Create new model for this collection
  return mongoose.model<IAttendanceLog>(collectionName, AttendanceLogSchema, collectionName);
}

// Utility function to get models for a date range (multiple months)
export function getAttendanceModelsForRange(startDate: Date, endDate: Date): Array<{
  model: Model<IAttendanceLog>;
  collectionName: string;
  month: number;
  year: number;
}> {
  const models: Array<{
    model: Model<IAttendanceLog>;
    collectionName: string;
    month: number;
    year: number;
  }> = [];
  
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  
  while (current <= end) {
    const collectionName = getAttendanceCollectionName(current);
    const model = getAttendanceModel(current);
    
    models.push({
      model,
      collectionName,
      month: current.getMonth() + 1,
      year: current.getFullYear(),
    });
    
    current.setMonth(current.getMonth() + 1);
  }
  
  return models;
}

// Helper class for attendance operations
export class AttendanceService {
  // Log attendance with auto-detection for clock-in/clock-out
  static async logAttendance(data: {
    userId: string;
    userName: string;
    userEmail: string;
    action?: 'clock-in' | 'clock-out'; // Optional - will auto-detect if not provided
    timestamp?: Date;
    qrCodeId?: string;
  }): Promise<IAttendanceLog> {
    const timestamp = data.timestamp || new Date();
    
    let action = data.action;
    
    // Auto-detect action if not provided
    if (!action) {
      const lastAction = await this.getLastAttendanceAction(data.userId);
      
      if (!lastAction || lastAction.action === 'clock-out') {
        action = 'clock-in';
      } else {
        action = 'clock-out';
      }
    }
    
    const AttendanceModel = getAttendanceModel(timestamp);
    
    const attendanceLog = await AttendanceModel.create({
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      action,
      timestamp,
      qrCodeId: data.qrCodeId,
    });
    
    return attendanceLog;
  }
  
  // Get attendance logs for a user in a specific month
  static async getUserAttendanceForMonth(
    userId: string, 
    date: Date = new Date()
  ): Promise<IAttendanceLog[]> {
    const AttendanceModel = getAttendanceModel(date);
    
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return await AttendanceModel.find({
      userId,
      timestamp: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }).sort({ timestamp: -1 });
  }
  
  // Get attendance logs for a user across multiple months
  static async getUserAttendanceForRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IAttendanceLog[]> {
    const models = getAttendanceModelsForRange(startDate, endDate);
    const allLogs: IAttendanceLog[] = [];
    
    for (const { model } of models) {
      const logs = await model.find({
        userId,
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      });
      allLogs.push(...logs);
    }
    
    // Sort by timestamp descending
    return allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  // Get all attendance logs for a specific month
  static async getAllAttendanceForMonth(date: Date = new Date()): Promise<IAttendanceLog[]> {
    const AttendanceModel = getAttendanceModel(date);
    
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    
    return await AttendanceModel.find({
      timestamp: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }).sort({ timestamp: -1 });
  }
  
  // Get user's last attendance action
  static async getLastAttendanceAction(userId: string): Promise<IAttendanceLog | null> {
    // Check current month first
    const currentModel = getAttendanceModel();
    let lastLog = await currentModel.findOne({ userId }).sort({ timestamp: -1 });
    
    if (!lastLog) {
      // Check previous month if nothing found in current month
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevModel = getAttendanceModel(prevMonth);
      lastLog = await prevModel.findOne({ userId }).sort({ timestamp: -1 });
    }
    
    return lastLog;
  }
}

export default AttendanceService;
