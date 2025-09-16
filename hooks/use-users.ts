'use client';

import { useState, useEffect } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  profileURL?: string;
  createdAt: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData: { name: string; email: string; password: string }) => {
    try {
      setError('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add user');
      }

      setUsers(prev => [...prev, data.user]);
      return data.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add user';
      setError(message);
      throw error;
    }
  };

  const updateUser = async (userId: string, userData: { name: string; email: string; password?: string }) => {
    try {
      setError('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          ...userData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      setUsers(prev => prev.map(user =>
        user._id === userId ? data.user : user
      ));
      return data.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      setError(message);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setError('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      setError(message);
      throw error;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserLocally = (updatedUser: User) => {
    setUsers(prev => prev.map(user =>
      user._id === updatedUser._id ? updatedUser : user
    ));
  };

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    updateUserLocally,
    deleteUser,
    clearError: () => setError(''),
  };
}
