import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AttendanceService } from '@/models/AttendanceLog';
import { AuthService } from '@/lib/auth';

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
        attendance = await AttendanceService.getUserAttendanceForMonth(payload.userId, date);
      } else {
        // Default to current month
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
