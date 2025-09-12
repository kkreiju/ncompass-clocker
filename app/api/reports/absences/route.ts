import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AttendanceService } from '@/models/AttendanceLog';
import { AuthService } from '@/lib/auth';

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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required.' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    const absences = await AttendanceService.getAbsences(start, end);

    return NextResponse.json({
      success: true,
      absences
    });

  } catch (error) {
    console.error('Get absences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
