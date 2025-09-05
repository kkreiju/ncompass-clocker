'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userType', 'admin');
        router.push('/admin-dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'var(--background)'}}>
      <div className="max-w-md w-full rounded-xl shadow-lg p-8" style={{backgroundColor: 'var(--surface)'}}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{color: 'var(--text-primary)'}}>NCompass</h1>
          <p style={{color: 'var(--text-secondary)'}}>Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 rounded-lg focus:ring-2 outline-none transition-colors"
              style={{
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)'
              }}
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{color: 'var(--text-primary)'}}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg focus:ring-2 outline-none transition-colors"
              style={{
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)'
              }}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--error)'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: loading ? 'var(--secondary)' : 'var(--primary)',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
              }
            }}
          >
            {loading ? 'Signing In...' : 'Admin Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6" style={{borderTop: '1px solid var(--border)'}}>
          <div className="text-center">
            <a
              href="/"
              className="text-sm font-medium"
              style={{color: 'var(--primary)'}}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--primary-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--primary)';
              }}
            >
              ← Back to Employee Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
