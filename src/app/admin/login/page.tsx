'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Shield, LogIn, ArrowLeft, Users, BarChart3, Settings, Database } from 'lucide-react';

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    email: 'admin@mcnmart.com',
    password: 'admin123'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Check if user is already authenticated as admin
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (session?.user?.isAdmin) {
          console.log('Already authenticated as admin, redirecting to dashboard');
          router.replace('/admin');
        }
      } catch (error) {
        console.log('Session check error:', error);
      }
    };
    
    checkSession();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting admin login...', formData.email);
      
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        loginType: 'admin',
      });

      console.log('SignIn result:', result);

      if (result?.error) {
        console.log('Sign in error:', result.error);
        setError('Invalid admin credentials. Please check your email and password.');
      } else if (result?.ok) {
        console.log('Sign in successful, checking session...');
        
        // Wait for session to be established
        setTimeout(async () => {
          try {
            const session = await getSession();
            console.log('Session:', session);
            
            if (session?.user?.isAdmin) {
              console.log('Admin authenticated successfully');
              setError('✅ Login successful! Redirecting to admin dashboard...');
              setTimeout(() => {
                router.push('/admin');
              }, 1000);
            } else {
              console.log('User is not an admin:', session?.user);
              setError('Access denied. Admin privileges required.');
            }
          } catch (sessionError) {
            console.error('Session error:', sessionError);
            setError('Session error. Please try again.');
          }
        }, 500);
      } else {
        console.log('Unknown signin result:', result);
        setError('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-red-600 hover:text-red-700 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span>MCNmart.com Admin</span>
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Admin Access
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to access the administrator panel
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${
                  error.includes('✅') 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    error.includes('✅') 
                      ? 'bg-green-100' 
                      : 'bg-red-100'
                  }`}>
                    <span className={`text-xs ${
                      error.includes('✅') 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {error.includes('✅') ? '✓' : '!'}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    error.includes('✅') 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {error}
                  </p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="admin@mcnmart.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Access Admin Panel
                    <Shield className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 text-center font-medium mb-2">
                ✅ Admin Test Credentials (Already filled):
              </p>
              <p className="text-xs text-green-600 text-center font-mono">
                Email: admin@mcnmart.com<br />
                Password: admin123
              </p>
              <p className="text-xs text-green-600 text-center mt-2">
                Just click "Access Admin Panel" to login!
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="text-center space-y-4">
            <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-500 transition-colors">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Main Site
            </Link>
            
            <div className="flex justify-center space-x-4 text-sm">
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 transition-colors">
                User Login
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/admin/register" className="text-purple-600 hover:text-purple-500 transition-colors">
                Admin Register
              </Link>
            </div>
          </div>

          {/* Admin Features Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="mr-2 h-5 w-5 text-red-600" />
              Admin Panel Features
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">User Management</p>
                  <p className="text-xs text-gray-500">Manage all platform users</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-500">View platform statistics</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">System Settings</p>
                  <p className="text-xs text-gray-500">Configure platform</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Security</p>
                  <p className="text-xs text-gray-500">Manage access & permissions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
