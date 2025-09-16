import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Admin from '@/models/Admin';
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

    let user = null;
    let userData = null;

    if (payload.type === 'admin') {
      // Get admin user data
      user = await Admin.findById(payload.userId);
      if (user) {
        userData = {
          id: user._id,
          name: "N-Compass Admin",
          email: "team@n-compass.biz",
          profileURL: '/ncompass-logo.svg',
          type: 'admin',
        };
      }
    } else {
      // Get regular user data
      user = await User.findById(payload.userId).select('-password');
      if (user) {
        userData = {
          id: user._id,
          name: user.name,
          email: user.email,
          profileURL: user.profileURL,
          type: 'user',
        };
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userData,
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
