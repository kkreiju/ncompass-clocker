import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { AttendanceService } from '@/models/AttendanceLog';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Get Python URL from environment
    const pythonUrl = process.env.PYTHON_URL;

    if (!pythonUrl) {
      console.error('PYTHON_URL environment variable not set');
      return NextResponse.json(
        { error: 'Face recognition service not configured' },
        { status: 500 }
      );
    }

    // Forward the image data to Python service as form data
    const formData = new FormData();
    formData.append('image', imageData);

    const response = await fetch(`${pythonUrl}/scan`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Python service error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Face recognition service unavailable' },
        { status: 503 }
      );
    }

    const data = await response.json();

    // Check if Python service returned an error message
    if (data.error && data.error.includes('No matching face found')) {
      return NextResponse.json(
        { error: data.error },
        { status: 404 } // Not Found - appropriate for face not recognized
      );
    }

    // If face recognition successful, log attendance (following exact QR scanner logic)
    if (data.success && data.matched_name) {
      console.log('Finding user by name:', data.matched_name);

      console.log('Executing User.findOne query...');
      const user = await User.findOne({ name: data.matched_name });
      console.log('Query completed, user found:', user);

      if (!user) {
        return NextResponse.json(
          { error: 'User not found. Please contact your administrator.' },
          { status: 404 }
        );
      }

      console.log('Logging attendance for user:', user.name);

      // Log attendance (exact same logic as QR scanner)
      const timestamp = new Date();
      const collectionName = `${String(timestamp.getMonth() + 1).padStart(2, '0')}${timestamp.getFullYear()}-attendances`;


      const attendanceLog = await AttendanceService.logAttendance({
        userId: (user._id as string).toString(),
        userName: user.name,
        userEmail: user.email,
        timestamp: timestamp
      });

      console.log('Attendance logged successfully:', {
        id: attendanceLog._id,
        action: attendanceLog.action,
        timestamp: attendanceLog.timestamp,
        userName: attendanceLog.userName
      });

      // Return response (exact same format as QR scanner)
      return NextResponse.json({
        success: true,
        message: `Successfully ${attendanceLog.action === 'clock-in' ? 'clocked in' : 'clocked out'}`,
        attendance: {
          action: attendanceLog.action,
          timestamp: attendanceLog.timestamp,
          userName: attendanceLog.userName
        }
      });
    }

    // Return the response from Python service (for failed recognition)
    return NextResponse.json(data);

  } catch (error) {
    console.error('Face scan API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
