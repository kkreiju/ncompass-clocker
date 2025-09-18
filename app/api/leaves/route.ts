import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Leave from '@/models/Leave';
import User from '@/models/User';
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
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    let query: any = {};

    // If admin, can see all leaves; if regular user, only their own
    if (payload.type !== 'admin') {
      query.userId = payload.userId;
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by specific user if provided (admin only)
    if (userId && payload.type === 'admin') {
      query.userId = userId;
    }

    const leaves = await Leave.find(query)
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name')
      .populate('userId', 'profileURL');

    return NextResponse.json({
      success: true,
      leaves
    });

  } catch (error) {
    console.error('Get leaves error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { type, startDate, endDate, reason } = await request.json();

    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: 'Type, start date, end date, and reason are required.' },
        { status: 400 }
      );
    }

    // Validate date format and logic
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format.' },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { error: 'End date cannot be before start date.' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // Create leave request
    const leave = await Leave.create({
      userId: payload.userId,
      userName: user.name,
      userEmail: user.email,
      userProfileURL: user.profileURL || '',
      type,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Leave request submitted successfully.',
      leave
    });

  } catch (error) {
    console.error('Create leave error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { leaveId, status, adminComments } = await request.json();

    if (!leaveId || !status) {
      return NextResponse.json(
        { error: 'Leave ID and status are required.' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either approved or rejected.' },
        { status: 400 }
      );
    }

    // Only admin can approve/reject leaves
    if (payload.type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required to update leave status.' },
        { status: 403 }
      );
    }

    // Find and update leave
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return NextResponse.json(
        { error: 'Leave request not found.' },
        { status: 404 }
      );
    }

    const updateData: any = {
      status,
      reviewedBy: payload.userId,
      reviewedAt: new Date(),
    };

    if (adminComments && adminComments.trim()) {
      updateData.adminComments = adminComments.trim();
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      leaveId,
      updateData,
      { new: true }
    ).populate('reviewedBy', 'name');

    return NextResponse.json({
      success: true,
      message: `Leave request ${status} successfully.`,
      leave: updatedLeave
    });

  } catch (error) {
    console.error('Update leave error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
