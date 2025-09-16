import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { AuthService } from '@/lib/auth';
import User from '@/models/User';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

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

    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const profileImage = formData.get('profileImage') as File;
    const removeProfile = formData.get('removeProfile') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required.' },
        { status: 400 }
      );
    }

    // Get current user to check for existing profile picture
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    let profileURL = '';

    if (removeProfile) {
      // Remove profile picture - delete the file if it exists
      if (currentUser.profileURL && currentUser.profileURL.trim() !== '') {
        try {
          const oldFileName = currentUser.profileURL.replace('/user-profile/', '');
          const oldFilePath = join(process.cwd(), 'public', 'user-profile', oldFileName);
          await unlink(oldFilePath);
        } catch (error) {
          // File might not exist or couldn't be deleted, continue anyway
          console.warn('Could not delete old profile picture:', error);
        }
      }
      profileURL = '';
    } else {
      // Upload new profile picture
      if (!profileImage) {
        return NextResponse.json(
          { error: 'Profile image is required.' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!profileImage.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Only image files are allowed.' },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (profileImage.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 5MB.' },
          { status: 400 }
        );
      }

      // Delete old profile picture if it exists
      if (currentUser.profileURL && currentUser.profileURL.trim() !== '') {
        try {
          const oldFileName = currentUser.profileURL.replace('/user-profile/', '');
          const oldFilePath = join(process.cwd(), 'public', 'user-profile', oldFileName);
          await unlink(oldFilePath);
        } catch (error) {
          // File might not exist or couldn't be deleted, continue anyway
          console.warn('Could not delete old profile picture:', error);
        }
      }

      // Generate unique filename
      const fileExtension = profileImage.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExtension}`;

      // Ensure user-profile directory exists
      const userProfileDir = join(process.cwd(), 'public', 'user-profile');
      try {
        await mkdir(userProfileDir, { recursive: true });
      } catch (error) {
        // Directory might already exist, continue
      }

      // Save file to user-profile directory
      const filePath = join(userProfileDir, fileName);
      const bytes = await profileImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      profileURL = `/user-profile/${fileName}`;
    }

    // Update user profile in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileURL },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user profile.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileURL: updatedUser.profileURL,
      },
    });

  } catch (error) {
    console.error('Profile upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
