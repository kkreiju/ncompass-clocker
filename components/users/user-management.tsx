'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UserTable } from "./user-table";
import { AddUserModal } from "./add-user-modal";
import { EditUserModal } from "./edit-user-modal";
import { DeleteUserModal } from "./delete-user-modal";
import { QRCodeModal } from "./qr-code-modal";
import { useUsers } from "../../hooks/use-users";
import { UserPlus } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  profileURL?: string;
  createdAt: string;
}

export function UserManagement() {
  const { users, loading, error, addUser, updateUser, updateUserLocally, deleteUser, clearError } = useUsers();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [qrUserName, setQrUserName] = useState<string>('');
  const [updatingUser, setUpdatingUser] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
    clearError();
  };

  const handleDelete = (user: User) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
    clearError();
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await deleteUser(userId);
      setDeletingUser(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleShowQR = (userName: string) => {
    console.log('Opening QR modal for user:', userName);
    setQrUserName(userName);
    setShowQRModal(true);
  };

  const handleProfileUpdate = (updatedUser: User) => {
    // Update the user in the local state to trigger re-render with new profile picture
    updateUserLocally(updatedUser);
    // Note: Profile updates happen instantly via API, so no additional loading needed here
  };

  const handleAddUser = async (userData: { name: string; email: string; password: string }) => {
    setAddingUser(true);
    try {
      await addUser(userData);
    } finally {
      setAddingUser(false);
    }
  };

  const handleEditUser = async (userId: string, userData: { name: string; email: string; password?: string }) => {
    setUpdatingUser(true);
    try {
      await updateUser(userId, userData);
      setEditingUser(null);
    } finally {
      setUpdatingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your organization's users and access</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 w-full sm:w-auto">
          <UserPlus className="h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* User Table */}
      <UserTable
        users={users}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onShowQR={handleShowQR}
      />

      {/* Modals */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          clearError();
        }}
        onAddUser={handleAddUser}
        loading={addingUser}
        error={error}
      />

      <EditUserModal
        isOpen={showEditModal}
        user={editingUser}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
          clearError();
        }}
        onEditUser={handleEditUser}
        onProfileUpdate={handleProfileUpdate}
        loading={updatingUser}
        error={error}
      />

      <DeleteUserModal
        isOpen={showDeleteModal}
        user={deletingUser}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingUser(null);
          clearError();
        }}
        onDeleteUser={handleDeleteUser}
        loading={loading}
        error={error}
      />

      <QRCodeModal
        isOpen={showQRModal}
        userName={qrUserName}
        onClose={() => {
          setShowQRModal(false);
          setQrUserName('');
        }}
      />
    </div>
  );
}
