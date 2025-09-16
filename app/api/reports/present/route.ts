import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AttendanceService, getAttendanceModel } from '@/models/AttendanceLog';
import { AuthService } from '@/lib/auth';

interface User {
  _id: string;
  name: string;
  email: string;
  profileURL?: string;
}

interface UserStatus {
  user: User;
  status: 'present' | 'absent';
  totalTime: number; // in minutes
  isCurrentlyClockedIn: boolean;
  lastClockIn?: Date;
  formattedTime: string;
  workplace?: 'office' | 'home';
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = AuthService.getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized. Token required.' },
        { status: 401 }
      );
    }

    const payload = AuthService.verifyToken(token);
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required.' },
        { status: 400 }
      );
    }

    const selectedDate = new Date(dateParam);
    const userStatuses = await getDailyAttendanceStatus(selectedDate);

    return NextResponse.json({
      success: true,
      userStatuses
    });

  } catch (error) {
    console.error('Get present data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getDailyAttendanceStatus(selectedDate: Date): Promise<UserStatus[]> {
  // Get all users
  const User = (await import('@/models/User')).default;
  const users = await User.find({}) as import('@/models/User').IUser[];

  // Get attendance data for the selected date
  const AttendanceModel = getAttendanceModel(selectedDate);

  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const attendanceRecords = await AttendanceModel.find({
    timestamp: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  }).sort({ timestamp: 1 });

  // Group records by user
  const userRecords: { [userId: string]: typeof attendanceRecords } = {};
  attendanceRecords.forEach(record => {
    if (!userRecords[record.userId.toString()]) {
      userRecords[record.userId.toString()] = [];
    }
    userRecords[record.userId.toString()].push(record);
  });

  const userStatuses: UserStatus[] = [];

  for (const user of users) {
    const userId = (user._id as any).toString();
    const records = userRecords[userId] || [];

    if (records.length === 0) {
      // User has no records for the day
      userStatuses.push({
        user: {
          _id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          profileURL: user.profileURL,
        },
        status: 'absent',
        totalTime: 0,
        isCurrentlyClockedIn: false,
        formattedTime: '0m',
        // No workplace for absent users
      });
    } else {
      // Calculate total time and current status
      let totalTime = 0;
      let isCurrentlyClockedIn = false;
      let lastClockIn: Date | undefined;

      // Sort records by timestamp
      const sortedRecords = records.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      let currentClockIn: Date | null = null;

      for (const record of sortedRecords) {
        if (record.action === 'clock-in') {
          currentClockIn = new Date(record.timestamp);
          lastClockIn = currentClockIn;
        } else if (record.action === 'clock-out' && currentClockIn) {
          const clockOut = new Date(record.timestamp);
          totalTime += Math.floor((clockOut.getTime() - currentClockIn.getTime()) / (1000 * 60));
          currentClockIn = null;
        }
      }

      // If still clocked in, add time from clock-in to now
      if (currentClockIn) {
        const now = new Date();
        const additionalTime = Math.floor((now.getTime() - currentClockIn.getTime()) / (1000 * 60));
        totalTime += additionalTime;
        isCurrentlyClockedIn = true;
      }

      // Format the total time
      const hours = Math.floor(totalTime / 60);
      const minutes = totalTime % 60;
      let formattedTime = '';
      if (hours === 0) {
        formattedTime = `${minutes}m`;
      } else if (minutes === 0) {
        formattedTime = `${hours}h`;
      } else {
        formattedTime = `${hours}h ${minutes}m`;
      }

      // Get workplace from the most recent record
      const mostRecentRecord = sortedRecords[sortedRecords.length - 1];
      const workplace = mostRecentRecord.workplace || 'office';

      userStatuses.push({
        user: {
          _id: (user._id as any).toString(),
          name: user.name,
          email: user.email,
          profileURL: user.profileURL,
        },
        status: 'present',
        totalTime,
        isCurrentlyClockedIn,
        lastClockIn,
        formattedTime,
        workplace,
      });
    }
  }

  return userStatuses.sort((a, b) => a.user.name.localeCompare(b.user.name));
}
