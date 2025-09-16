import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { AuthService } from '@/lib/auth';
import { AttendanceService } from '@/models/AttendanceLog';

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

    // Get all users (admin only)
    const users = await User.find({}, '-password').sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
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
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists.' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Create user error:', error);
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
    if (!payload || payload.type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }

    const { userId, name, email, password } = await request.json();

    if (!userId || !name || !email) {
      return NextResponse.json(
        { error: 'User ID, name, and email are required.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    const emailExists = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: userId }
    });
    if (emailExists) {
      return NextResponse.json(
        { error: 'Email is already taken by another user.' },
        { status: 409 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      updatedAt: new Date()
    };

    // Only update password if provided
    if (password && password.trim()) {
      updateData.password = await AuthService.hashPassword(password);
    }

    // Check if name or email changed
    const nameChanged = name !== existingUser.name;
    const emailChanged = email.toLowerCase() !== existingUser.email.toLowerCase();

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    // If name or email changed, update all attendance records
    if (nameChanged || emailChanged) {
      try {
        await AttendanceService.updateUserInAttendanceRecords(
          userId,
          name,
          email.toLowerCase()
        );
      } catch (attendanceError) {
        console.error('Error updating attendance records:', attendanceError);
        // Don't fail the entire request, but log the error
        // The user update succeeded, but attendance records might be inconsistent
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully.'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}