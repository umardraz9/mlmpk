'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, Gift, UserPlus, ArrowRight, Users } from 'lucide-react';

interface RegistrationForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
  agreeToTerms: boolean;
}

interface RegistrationErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  referralCode?: string;
  agreeToTerms?: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState<RegistrationForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear specific error when user starts typing
    if (errors[name as keyof RegistrationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: RegistrationErrors = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format';
    
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^(\+92|0)?[0-9]{10}$/.test(form.phone.replace(/\s|-/g, ''))) {
      newErrors.phone = 'Invalid Pakistani phone number';
    }
    
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!form.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.toLowerCase().trim(),
          phone: form.phone.trim(),
          password: form.password,
          referralCode: form.referralCode?.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created successfully! Please sign in.');
        router.push('/auth/login');
      } else {
        // Handle registration errors
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ email: data.message || 'Registration failed' });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // More specific error handling
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrors({ email: 'Unable to connect to server. Please check your internet connection and try again.' });
      } else if (error instanceof Error && error.message.includes('timeout')) {
        setErrors({ email: 'Request timed out. Please try again.' });
      } else {
        setErrors({ email: 'Network error. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Side - Registration Form */}
      <div className="flex-1 lg:flex-[0.6] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-6 xl:px-8 py-8 lg:py-12">
        <div className="w-full max-w-md lg:max-w-md xl:max-w-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-green-600 hover:text-green-700 transition-colors mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span>MCNmart</span>
            </Link>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h2>
            
            {/* User Avatars */}
            <div className="flex justify-center -space-x-1.5 mb-3 flex-wrap sm:flex-nowrap">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" 
                alt="Ahmed Khan" 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
              <img 
                src="https://images.unsplash.com/photo-1494790108755-2616b612b647?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" 
                alt="Fatima Ali" 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" 
                alt="Muhammad Hassan" 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
              <img 
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" 
                alt="Sara Ahmed" 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
              <img 
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" 
                alt="Ravi Kumar" 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
              <img 
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80" 
                alt="Nadia Begum" 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover shadow-sm"
              />
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              Join <span className="font-semibold text-green-600">5000+</span> successful entrepreneurs
            </p>
          </div>

          {/* Registration Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-4 py-3.5 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Full name"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-4 py-3.5 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Email address"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="sr-only">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-4 py-3.5 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Phone number (+92 or 03XX)"
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 py-3.5 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Password (min. 8 characters)"
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
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={form.confirmPassword}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 pr-10 py-3.5 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Referral Code Field (Optional) */}
            <div>
              <label htmlFor="referralCode" className="sr-only">Referral Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  value={form.referralCode}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-4 py-3.5 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Referral code (optional)"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Optional. Have a referral code? Enter it here. If left empty, you'll automatically be registered under <span className="font-semibold text-green-600">Admin (admin123)</span>.
              </p>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={form.agreeToTerms}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link href="/terms" className="text-green-600 hover:text-green-500">
                  Terms & Conditions
                </Link>
              </label>
            </div>
            {errors.agreeToTerms && <p className="text-sm text-red-600">{errors.agreeToTerms}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all min-h-[52px] ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black hover:bg-gray-800 hover:shadow-lg active:bg-gray-900'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-black hover:text-green-600 transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Features Section */}
      <div className="flex-1 lg:flex-[0.4] bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-4 xl:px-6 py-8 lg:py-12">
        <div className="w-full max-w-md lg:max-w-md xl:max-w-lg">
          <div className="text-center mb-5 lg:mb-6">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 leading-tight">
              Start your journey with Partnership Program.
            </h2>
          </div>

          <div className="space-y-4 lg:space-y-5">
            {/* Feature 1 */}
            <div className="flex items-start space-x-3 lg:space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-11 lg:h-11 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl lg:text-2xl">🎁</span>
                </div>
              </div>
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                  Instant PKR 500 voucher.
                </h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                  Get PKR 500 in product vouchers immediately upon registration. Start shopping and building your business right away.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start space-x-3 lg:space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-11 lg:h-11 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl lg:text-2xl">💰</span>
                </div>
              </div>
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                  Start with just PKR 1,000.
                </h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                  Low investment barrier with high earning potential. Turn your PKR 1,000 into PKR 3,000 through our commission system.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start space-x-3 lg:space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 lg:w-11 lg:h-11 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl lg:text-2xl">👥</span>
                </div>
              </div>
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
                  Join 5000+ entrepreneurs.
                </h3>
                <p className="text-sm lg:text-base text-gray-600 leading-relaxed">
                  Be part of Pakistan's largest partnership community with proven success stories and ongoing support from experienced mentors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 