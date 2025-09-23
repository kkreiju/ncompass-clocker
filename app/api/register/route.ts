import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password, profilePicture, faceImage } = body;

    // Validate required fields
    if (!name || !email || !password || !faceImage) {
      return NextResponse.json(
        { error: 'Name, email, password, and face image are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Get Python URL from environment
    const pythonUrl = process.env.PYTHON_URL;
    if (!pythonUrl) {
      return NextResponse.json(
        { error: 'Face recognition service not configured' },
        { status: 500 }
      );
    }

    const formData = new FormData();
    formData.append('image', faceImage);
    formData.append('name', name);

    // Send registration data to Python service
    const pythonResponse = await fetch(`${pythonUrl}/register`, {
      method: 'POST',
      body: formData,
    });

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json();
      return NextResponse.json(
        { error: errorData.error || 'Face registration failed' },
        { status: pythonResponse.status }
      );
    }

    const pythonData = await pythonResponse.json();

    // Handle profile picture (base64 string from frontend)
    let profilePictureURL = '';
    if (profilePicture && profilePicture.startsWith('data:image/')) {
      try {
        // Extract base64 data and convert to buffer
        const base64Data = profilePicture.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}.png`;

        // Ensure user-profile directory exists
        const userProfileDir = join(process.cwd(), 'public', 'user-profile');
        try {
          await mkdir(userProfileDir, { recursive: true });
        } catch (error) {
          // Directory might already exist, continue
        }

        // Save file to user-profile directory
        const filePath = join(userProfileDir, fileName);
        await writeFile(filePath, buffer);

        profilePictureURL = `/user-profile/${fileName}`;
      } catch (error) {
        console.error('Error saving profile picture:', error);
        // Continue without profile picture if saving fails
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileURL: profilePictureURL,
    });

    // Return success (don't send password back)
    const { password: _, ...userResponse } = user.toObject();

    return NextResponse.json({
      success: true,
      message: 'Registration successful! You can now log in.',
      user: userResponse,
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
