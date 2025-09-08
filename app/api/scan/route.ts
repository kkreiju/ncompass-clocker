import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { AttendanceService } from '@/models/AttendanceLog';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { qrCodeData } = body;

    if (!qrCodeData) {
      return NextResponse.json(
        { error: 'QR code data is required' },
        { status: 400 }
      );
    }

    // Find user by name (QR code contains the user's name)
    const user = await User.findOne({ name: qrCodeData });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please contact your administrator.' },
        { status: 404 }
      );
    }

    // Log attendance
    const attendanceLog = await AttendanceService.logAttendance({
      userId: (user._id as string).toString(),
      userName: user.name,
      userEmail: user.email,
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${attendanceLog.action === 'clock-in' ? 'clocked in' : 'clocked out'}`,
      attendance: {
        action: attendanceLog.action,
        timestamp: attendanceLog.timestamp,
        userName: attendanceLog.userName
      }
    });

  } catch (error) {
    console.error('Scan attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}