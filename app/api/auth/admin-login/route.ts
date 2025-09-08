import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    // Find admin user
    const admin = await Admin.findOne({ username: username.toLowerCase() });
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await AuthService.comparePassword(password, admin.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // Generate token
    const token = AuthService.generateToken({
      userId: admin._id.toString(),
      email: admin.username, // Using username as email for admin
      name: admin.username,
      type: 'admin',
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: admin._id,
        username: admin.username,
        type: 'admin',
      },
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}