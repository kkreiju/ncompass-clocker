import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Admin from '@/models/Admin';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, username, password } = await request.json();

    // Require either email or username, and password
    if ((!email && !username) || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required.' },
        { status: 400 }
      );
    }

    let user = null;
    let userType: 'user' | 'admin' = 'user';
    let loginIdentifier = email || username;

    // Try to find as regular user first (by email)
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        userType = 'user';
      }
    }

    // If not found as user, try as admin (by username or email)
    if (!user && username) {
      user = await Admin.findOne({ username: username.toLowerCase() });
      if (user) {
        userType = 'admin';
      }
    }

    // If still not found and we have email, try admin by email (for backward compatibility)
    if (!user && email) {
      user = await Admin.findOne({ username: email.toLowerCase() });
      if (user) {
        userType = 'admin';
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await AuthService.comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials.' },
        { status: 401 }
      );
    }

    // Generate token based on user type
    let token;
    let userData;

    if (userType === 'admin') {
      token = AuthService.generateToken({
        userId: user._id.toString(),
        email: user.username, // Using username as email for admin
        name: user.username,
        type: 'admin',
      });

      userData = {
        id: user._id,
        username: user.username,
        type: 'admin',
      };
    } else {
      token = AuthService.generateToken({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        type: 'user',
      });

      userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        type: 'user',
      };
    }

    return NextResponse.json({
      success: true,
      token,
      user: userData,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
