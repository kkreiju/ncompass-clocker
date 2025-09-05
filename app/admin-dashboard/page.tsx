'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AttendanceRecord {
  _id: string;
  userName: string;
  userEmail: string;
  action: 'clock-in' | 'clock-out';
  timestamp: string;
}

// QR Code Component with Logo
function QRCodeWithLogo({ value, size = 256 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current) return;

      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Generate QR code on canvas
        await QRCode.toCanvas(canvas, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Load and draw logo in center
        const logo = new Image();
        logo.onload = () => {
          const logoSize = size * 0.2; // Logo is 20% of QR code size
          const x = (size - logoSize) / 2;
          const y = (size - logoSize) / 2;

          // Create a white background circle for the logo
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, logoSize / 2 + 5, 0, 2 * Math.PI);
          ctx.fill();

          // Draw the logo
          ctx.drawImage(logo, x, y, logoSize, logoSize);
        };
        logo.src = '/logo.png';
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'attendance' | 'rates'>('users');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [editUser, setEditUser] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrUserName, setQrUserName] = useState('');
  
  // Rate calculation states
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [rateCalculation, setRateCalculation] = useState<{
    totalHours: number;
    totalPay: number;
    workingDays: number;
  } | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || userType !== 'admin') {
      router.push('/admin');
      return;
    }

    fetchUsers();
    fetchAttendance();
  }, [router]);

  // Auto-calculate rate when inputs change
  useEffect(() => {
    if (selectedUser && startDate && endDate && hourlyRate && parseFloat(hourlyRate) > 0 && attendance.length > 0) {
      calculateRate();
    } else {
      setRateCalculation(null);
    }
  }, [selectedUser, startDate, endDate, hourlyRate, attendance]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers([...users, data.user]);
        setNewUser({ name: '', email: '', password: '' });
        setShowAddUser(false);
      } else {
        setError(data.error || 'Failed to add user');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!editingUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: editingUser._id,
          ...editUser,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.map(user => 
          user._id === editingUser._id ? data.user : user
        ));
        setEditUser({ name: '', email: '', password: '' });
        setEditingUser(null);
        setShowEditUser(false);
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(users.filter(user => user._id !== userId));
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      password: '' // Don't pre-fill password for security
    });
    setShowEditUser(true);
    setError('');
  };

  const showUserQRCode = (userName: string) => {
    setQrUserName(userName);
    setShowQRCode(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    router.push('/admin');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateRate = async () => {
    try {
      // Create start and end date objects for proper comparison
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0); // Start of start date
      
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // End of end date

      const userAttendance = attendance.filter(record => {
        const recordDate = new Date(record.timestamp);
        return record.userEmail === users.find(u => u._id === selectedUser)?.email &&
               recordDate >= startDateTime &&
               recordDate <= endDateTime;
      });

      // Group records by date
      const dateGroups: { [date: string]: AttendanceRecord[] } = {};
      userAttendance.forEach(record => {
        const date = new Date(record.timestamp).toDateString();
        if (!dateGroups[date]) {
          dateGroups[date] = [];
        }
        dateGroups[date].push(record);
      });

      let totalHours = 0;
      let workingDays = 0;

      // Calculate hours for each day
      Object.values(dateGroups).forEach(dayRecords => {
        const sortedRecords = dayRecords.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        let dayHours = 0;
        let clockInTime: Date | null = null;

        sortedRecords.forEach(record => {
          if (record.action === 'clock-in') {
            clockInTime = new Date(record.timestamp);
          } else if (record.action === 'clock-out' && clockInTime) {
            const clockOutTime = new Date(record.timestamp);
            const sessionHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
            dayHours += sessionHours;
            clockInTime = null;
          }
        });

        if (dayHours > 0) {
          totalHours += dayHours;
          workingDays++;
        }
      });

      const hourlyRateNum = parseFloat(hourlyRate);
      const totalPay = totalHours * hourlyRateNum;

      setRateCalculation({
        totalHours: Math.round(totalHours * 100) / 100,
        totalPay: Math.round(totalPay * 100) / 100,
        workingDays
      });
      setError('');
    } catch (error) {
      setError('Error calculating rate');
      console.error('Rate calculation error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NCompass Admin</h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'attendance'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Attendance Records
            </button>
            <button
              onClick={() => setActiveTab('rates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rates'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rate Calculator
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Users ({users.length})</h2>
              <button
                onClick={() => setShowAddUser(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add New User
              </button>
            </div>

            {/* Add User Modal */}
            {showAddUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Add New User</h3>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        {error}
                      </div>
                    )}
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        Add User
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddUser(false);
                          setError('');
                          setNewUser({ name: '', email: '', password: '' });
                        }}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit User Modal */}
            {showEditUser && editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Edit User</h3>
                  <form onSubmit={handleEditUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editUser.name}
                        onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={editUser.email}
                        onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password (leave blank to keep current)
                      </label>
                      <input
                        type="password"
                        value={editUser.password}
                        onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        {error}
                      </div>
                    )}
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        Update User
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditUser(false);
                          setEditingUser(null);
                          setError('');
                          setEditUser({ name: '', email: '', password: '' });
                        }}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* QR Code Modal */}
            {showQRCode && qrUserName && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
                  <h3 className="text-lg font-semibold mb-4">QR Code for {qrUserName}</h3>
                  <div className="flex justify-center mb-4">
                    <QRCodeWithLogo value={qrUserName} size={256} />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Scan this QR code to get the user's name: <strong>{qrUserName}</strong>
                  </p>
                  <button
                    onClick={() => {
                      setShowQRCode(false);
                      setQrUserName('');
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <button
                          onClick={() => showUserQRCode(user.name)}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        >
                          {user.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found. Add your first user to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Attendance Records</h2>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record) => (
                    <tr key={record._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.userName}</div>
                          <div className="text-sm text-gray-500">{record.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.action === 'clock-in' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.action === 'clock-in' ? 'Clock In' : 'Clock Out'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(record.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {attendance.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No attendance records found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rate Calculator Tab */}
        {activeTab === 'rates' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Employee Rate Calculator</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Input Form */}
              <div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Employee
                    </label>
                    <select
                      id="user-select"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Choose an employee...</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="start-date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="end-date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="hourly-rate" className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly Rate (PHP)
                    </label>
                    <input
                      type="number"
                      id="hourly-rate"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Results */}
              <div>
                {rateCalculation && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Calculation Results</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-600">Working Days:</span>
                        <span className="text-lg font-semibold text-gray-900">{rateCalculation.workingDays}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-600">Total Hours:</span>
                        <span className="text-lg font-semibold text-gray-900">{rateCalculation.totalHours.toFixed(2)} hrs</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-600">Hourly Rate:</span>
                        <span className="text-lg font-semibold text-gray-900">PHP {parseFloat(hourlyRate).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 bg-purple-50 rounded-lg px-4 mt-4">
                        <span className="text-lg font-bold text-purple-800">Total Pay:</span>
                        <span className="text-2xl font-bold text-purple-900">{rateCalculation.totalPay.toFixed(2)} PHP</span>
                      </div>
                    </div>

                    <div className="mt-6 text-xs text-gray-500">
                      <p>Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                      <p>Employee: {users.find(u => u._id === selectedUser)?.name}</p>
                    </div>
                  </div>
                )}

                {!rateCalculation && (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">Fill in all fields to see automatic rate calculation</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
