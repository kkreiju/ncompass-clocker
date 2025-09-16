'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X } from "lucide-react";
import { toast } from "sonner";

// Inline version without Dialog wrapper
export function ProfilePictureUploadInline({ user, onProfileUpdate }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid file type", {
          description: "Please select an image file.",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Please select an image smaller than 5MB.",
        });
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('userId', user._id);
      formData.append('profileImage', selectedFile);

      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Profile picture updated", {
          description: "The profile picture has been uploaded successfully.",
        });

        if (onProfileUpdate && typeof onProfileUpdate === 'function') {
          onProfileUpdate(data.user);
        }
        setPreviewImage(null);
        setSelectedFile(null);
      } else {
        toast.error("Upload failed", {
          description: data.error || "Failed to upload profile picture.",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Upload failed", {
        description: "An error occurred while uploading the profile picture.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove the profile picture?')) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('userId', user._id);
      formData.append('removeProfile', 'true');

      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Profile picture removed", {
          description: "The profile picture has been removed successfully.",
        });

        if (onProfileUpdate && typeof onProfileUpdate === 'function') {
          onProfileUpdate(data.user);
        }
      } else {
        toast.error("Remove failed", {
          description: data.error || "Failed to remove profile picture.",
        });
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast.error("Remove failed", {
        description: "An error occurred while removing the profile picture.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current/Preview Avatar */}
      <div className="flex justify-center">
        <Avatar className="h-20 w-20 border-4 border-background">
          <AvatarImage
            src={previewImage || (user.profileURL && user.profileURL.trim() !== '' ? user.profileURL : undefined)}
            alt={user.name}
          />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* File Input */}
      <div className="space-y-2">
        <label
          htmlFor="profile-upload-inline"
          className="flex items-center justify-center w-full h-10 px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Upload className="h-4 w-4" />
            {selectedFile ? selectedFile.name : 'Choose profile picture'}
          </div>
        </label>
        <input
          id="profile-upload-inline"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground text-center">
          PNG, JPG, GIF up to 5MB
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {user.profileURL && !previewImage && (
          <Button
            variant="outline"
            onClick={handleRemove}
            disabled={isUploading}
            size="sm"
            className="flex-1 gap-2"
          >
            <X className="h-4 w-4" />
            Remove
          </Button>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          size="sm"
          className="flex-1 gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </div>
  );
}

interface User {
  _id: string;
  name: string;
  email: string;
  profileURL?: string;
  createdAt: string;
}

interface ProfilePictureUploadProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
}

export function ProfilePictureUpload({ user, onProfileUpdate }: ProfilePictureUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid file type", {
          description: "Please select an image file.",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Please select an image smaller than 5MB.",
        });
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('userId', user._id);
      formData.append('profileImage', selectedFile);

      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Profile picture updated", {
          description: "The profile picture has been uploaded successfully.",
        });

        if (onProfileUpdate && typeof onProfileUpdate === 'function') {
          onProfileUpdate(data.user);
        }
        setIsOpen(false);
        setPreviewImage(null);
        setSelectedFile(null);
      } else {
        toast.error("Upload failed", {
          description: data.error || "Failed to upload profile picture.",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Upload failed", {
        description: "An error occurred while uploading the profile picture.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewImage(null);
    setSelectedFile(null);
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove the profile picture?')) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('userId', user._id);
      formData.append('removeProfile', 'true');

      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Profile picture removed", {
          description: "The profile picture has been removed successfully.",
        });

        if (onProfileUpdate && typeof onProfileUpdate === 'function') {
          onProfileUpdate(data.user);
        }
        setIsOpen(false);
      } else {
        toast.error("Remove failed", {
          description: data.error || "Failed to remove profile picture.",
        });
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast.error("Remove failed", {
        description: "An error occurred while removing the profile picture.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Camera className="h-4 w-4" />
          <span className="hidden sm:inline">Change Photo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current/Preview Avatar */}
          <div className="flex justify-center">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage
                src={previewImage || (user.profileURL && user.profileURL.trim() !== '' ? user.profileURL : undefined)}
                alt={user.name}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <label
              htmlFor="profile-upload"
              className="flex items-center justify-center w-full h-12 px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Upload className="h-4 w-4" />
                {selectedFile ? selectedFile.name : 'Choose profile picture'}
              </div>
            </label>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground text-center">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {user.profileURL && !previewImage && (
              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={isUploading}
                className="flex-1 gap-2"
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            )}

            {previewImage && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isUploading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1 gap-2"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
