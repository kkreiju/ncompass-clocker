'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { UserTable } from "./user-table";
import { AddUserModal } from "./add-user-modal";
import { EditUserModal } from "./edit-user-modal";
import { QRCodeModal } from "./qr-code-modal";
import { useUsers } from "../../hooks/use-users";
import { UserPlus } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export function UserManagement() {
  const { users, loading, error, addUser, updateUser, deleteUser, clearError } = useUsers();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [qrUserName, setQrUserName] = useState<string>('');

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
    clearError();
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(userId);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleShowQR = (userName: string) => {
    console.log('Opening QR modal for user:', userName);
    setQrUserName(userName);
    setShowQRModal(true);
  };

  const handleAddUser = async (userData: { name: string; email: string; password: string }) => {
    await addUser(userData);
  };

  const handleEditUser = async (userId: string, userData: { name: string; email: string; password?: string }) => {
    await updateUser(userId, userData);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage your organization's users and access</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
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
        loading={loading}
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
