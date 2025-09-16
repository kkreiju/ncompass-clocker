import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AttendanceService } from '@/models/AttendanceLog';
import { AuthService } from '@/lib/auth';
import User from '@/models/User';

// GET - Fetch attendance records
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
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let attendance;

    if (payload.type === 'admin') {
      // Admin can see all attendance records
      if (month && year) {
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        attendance = await AttendanceService.getAllAttendanceForMonth(date);
      } else {
        // Default to current month
        attendance = await AttendanceService.getAllAttendanceForMonth();
      }
    } else {
      // Users can only see their own attendance records
      if (month && year) {
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        console.log(payload.userId, date);
        attendance = await AttendanceService.getUserAttendanceForMonth(payload.userId, date);
      } else {
        attendance = await AttendanceService.getUserAttendanceForMonth(payload.userId);
      }
    }

    return NextResponse.json({
      success: true,
      attendance
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Log attendance
export async function POST(request: NextRequest) {
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
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, workplace, qrCodeId } = body;

    // Get fresh user data from database (not from potentially stale JWT)
    const currentUser = await User.findById(payload.userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // Log attendance with current user information
    const attendanceLog = await AttendanceService.logAttendance({
      userId: payload.userId,
      userName: currentUser.name,
      userEmail: currentUser.email,
      action,
      workplace,
      qrCodeId,
    });

    return NextResponse.json({
      success: true,
      attendance: attendanceLog
    });

  } catch (error) {
    console.error('Log attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}