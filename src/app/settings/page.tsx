'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import BackToDashboard from '@/components/BackToDashboard';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Smartphone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Save,
  AlertCircle,
  Check,
  Moon,
  Sun,
  Languages,
  CreditCard,
  Download,
  Trash2,
  HelpCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [emailError, setEmailError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [settings, setSettings] = useState({
    // Account Settings
    email: session?.user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    commissionAlerts: true,
    referralNotifications: true,
    
    // Privacy Settings
    profileVisibility: 'public',
    showEarnings: false,
    showReferrals: true,
    allowMessages: true,
    
    // App Settings
    language: 'en',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
    
    // Security Settings
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30'
  });

  const [originalSettings, setOriginalSettings] = useState(settings);

  // Load user settings on component mount
  useEffect(() => {
    loadUserSettings();
  }, [session]);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasUnsavedChanges(hasChanges);
  }, [settings, originalSettings]);

  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      
      const userSettings = {
        email: data.user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        ...data.settings
      };
      
      setSettings(userSettings);
      setOriginalSettings(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      setSaveError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear errors when user starts typing
    if (key === 'email') {
      setEmailError('');
    }
    if (key.includes('Password')) {
      setPasswordErrors([]);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    return errors;
  };

  const saveToLocalStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(key, value.toString());
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSaveError('');
    setSaveSuccess(false);
    setPasswordErrors([]);
    setEmailError('');

    try {
      // Validate email
      if (settings.email && !validateEmail(settings.email)) {
        setEmailError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }

      // Validate password if provided
      if (settings.newPassword) {
        const errors = validatePassword(settings.newPassword);
        if (errors.length > 0) {
          setPasswordErrors(errors);
          setIsLoading(false);
          return;
        }

        if (settings.newPassword !== settings.confirmPassword) {
          setPasswordErrors(['Passwords do not match']);
          setIsLoading(false);
          return;
        }

        if (!settings.currentPassword) {
          setPasswordErrors(['Current password is required to set a new password']);
          setIsLoading(false);
          return;
        }
      }

      // Save settings to localStorage for immediate use
      Object.entries(settings).forEach(([key, value]) => {
        if (key !== 'email' && key !== 'currentPassword' && key !== 'newPassword' && key !== 'confirmPassword') {
          saveToLocalStorage(key, value);
        }
      });

      // Save to API
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: settings.email,
          currentPassword: settings.currentPassword,
          newPassword: settings.newPassword,
          settings: settings
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      // Update session if email changed
      if (settings.email !== session?.user?.email) {
        await update({ email: settings.email });
      }

      setSaveSuccess(true);
      setOriginalSettings(settings);
      
      // Clear password fields
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      // Auto-hide success message
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to their original values?')) {
      setSettings(originalSettings);
      setPasswordErrors([]);
      setEmailError('');
      setSaveError('');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = 'DELETE';
    const userInput = prompt(
      `This action cannot be undone. All your data will be permanently deleted.\n\nTo confirm, please type "${confirmText}" below:`
    );
    
    if (userInput === confirmText) {
      setIsLoading(true);
      try {
        // In a real app, this would call your API to delete the account
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Clear all localStorage data
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('mcnmart_') || ['emailNotifications', 'pushNotifications', 'smsNotifications', 'marketingEmails', 'commissionAlerts', 'referralNotifications', 'profileVisibility', 'showEarnings', 'showReferrals', 'allowMessages', 'language', 'currency', 'timezone', 'twoFactorAuth', 'loginAlerts', 'sessionTimeout'].includes(key)) {
            localStorage.removeItem(key);
          }
        });
        
        alert('Your account has been scheduled for deletion. You will be logged out now.');
        router.push('/auth/login');
      } catch (error) {
        console.error('Failed to delete account:', error);
        alert('Failed to delete account. Please contact support.');
      } finally {
        setIsLoading(false);
      }
    } else if (userInput !== null) {
      alert('Account deletion cancelled. The confirmation text did not match.');
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      
      // Call the export API
      const response = await fetch('/api/user/export');
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `mcnmart-data-export-${new Date().toISOString().split('T')[0]}.json`;
      
      // Create blob and download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      setSaveError('Failed to export data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <BackToDashboard />
      
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Account Settings</h1>
          <p className={`text-lg ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>Manage your account preferences and security settings</p>
        </div>

        {saveSuccess && (
          <div className={`rounded-lg p-4 flex items-center gap-3 transition-colors ${
            isDark ? 'bg-green-900/50 border border-green-800' : 'bg-green-50 border border-green-200'
          }`}>
            <Check className="h-5 w-5 text-green-600" />
            <span className={`font-medium ${
              isDark ? 'text-green-400' : 'text-green-800'
            }`}>Settings saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className={`rounded-lg p-4 flex items-center gap-3 transition-colors ${
            isDark ? 'bg-red-900/50 border border-red-800' : 'bg-red-50 border border-red-200'
          }`}>
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className={`font-medium ${
              isDark ? 'text-red-400' : 'text-red-800'
            }`}>{saveError}</span>
          </div>
        )}

        {hasUnsavedChanges && (
          <div className={`rounded-lg p-4 flex items-center gap-3 transition-colors ${
            isDark ? 'bg-yellow-900/50 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className={`font-medium ${
              isDark ? 'text-yellow-400' : 'text-yellow-800'
            }`}>You have unsaved changes</span>
          </div>
        )}

        {/* Account Information */}
        <Card className={`transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Update your account details and login credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className={isDark ? 'text-gray-300' : 'text-gray-700'}>Full Name</Label>
                <Input
                  id="name"
                  value={session?.user?.name || ''}
                  disabled
                  className={`mt-1 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50'
                  }`}
                />
              </div>
              <div>
                <Label htmlFor="email" className={isDark ? 'text-gray-300' : 'text-gray-700'}>Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleSettingChange('email', e.target.value)}
                  className={`mt-1 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : ''
                  } ${emailError ? 'border-red-500' : ''}`}
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Change Password</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currentPassword" className={isDark ? 'text-gray-300' : 'text-gray-700'}>Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={settings.currentPassword}
                      onChange={(e) => handleSettingChange('currentPassword', e.target.value)}
                      className={`mt-1 pr-10 ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : ''
                      }`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-1 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword" className={isDark ? 'text-gray-300' : 'text-gray-700'}>New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={settings.newPassword}
                    onChange={(e) => handleSettingChange('newPassword', e.target.value)}
                    className={`mt-1 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : ''
                    }`}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className={isDark ? 'text-gray-300' : 'text-gray-700'}>Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={settings.confirmPassword}
                    onChange={(e) => handleSettingChange('confirmPassword', e.target.value)}
                    className={`mt-1 ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : ''
                    } ${passwordErrors.length > 0 ? 'border-red-500' : ''}`}
                  />
                </div>
              </div>
              {passwordErrors.length > 0 && (
                <div className="mt-2">
                  {passwordErrors.map((error, index) => (
                    <p key={index} className="text-red-500 text-sm flex items-center gap-1 mb-1">
                      <AlertCircle className="h-3 w-3" />
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className={`transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Choose how you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Communication</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Email Notifications</Label>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Receive updates via email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Push Notifications</Label>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Browser push notifications</p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>SMS Notifications</Label>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Text message alerts</p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Content</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Commission Alerts</Label>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>When you earn commissions</p>
                    </div>
                    <Switch
                      checked={settings.commissionAlerts}
                      onCheckedChange={(checked) => handleSettingChange('commissionAlerts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Referral Notifications</Label>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>New referral activity</p>
                    </div>
                    <Switch
                      checked={settings.referralNotifications}
                      onCheckedChange={(checked) => handleSettingChange('referralNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Marketing Emails</Label>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Promotional content</p>
                    </div>
                    <Switch
                      checked={settings.marketingEmails}
                      onCheckedChange={(checked) => handleSettingChange('marketingEmails', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className={`transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Control your privacy and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Privacy</h4>
                <div className="space-y-3">
                  <div>
                    <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Profile Visibility</Label>
                    <Select value={settings.profileVisibility} onValueChange={(value) => handleSettingChange('profileVisibility', value)}>
                      <SelectTrigger className={`mt-1 ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : ''
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="team">Team Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Earnings</Label>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Display earnings publicly</p>
                    </div>
                    <Switch
                      checked={settings.showEarnings}
                      onCheckedChange={(checked) => handleSettingChange('showEarnings', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show Referrals</Label>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Display referral count</p>
                    </div>
                    <Switch
                      checked={settings.showReferrals}
                      onCheckedChange={(checked) => handleSettingChange('showReferrals', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Security</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Two-Factor Authentication</Label>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Extra security for login</p>
                    </div>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Login Alerts</Label>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Notify on new logins</p>
                    </div>
                    <Switch
                      checked={settings.loginAlerts}
                      onCheckedChange={(checked) => handleSettingChange('loginAlerts', checked)}
                    />
                  </div>
                  <div>
                    <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Session Timeout (minutes)</Label>
                    <Select value={settings.sessionTimeout} onValueChange={(value) => handleSettingChange('sessionTimeout', value)}>
                      <SelectTrigger className={`mt-1 ${
                        isDark ? 'bg-gray-700 border-gray-600 text-white' : ''
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card className={`transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Smartphone className="h-5 w-5" />
              App Preferences
            </CardTitle>
            <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Customize your app experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Theme</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant={isDark ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      toggleTheme();
                      handleSettingChange('theme', !isDark ? 'dark' : 'light');
                    }}
                    className="flex items-center gap-2"
                    disabled={isLoading}
                  >
                    {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </Button>
                </div>
              </div>
              <div>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Language</Label>
                <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                  <SelectTrigger className={`mt-1 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : ''
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ur">اردو (Urdu)</SelectItem>
                    <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={isDark ? 'text-gray-300' : 'text-gray-700'}>Currency</Label>
                <Select value={settings.currency} onValueChange={(value) => handleSettingChange('currency', value)}>
                  <SelectTrigger className={`mt-1 ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : ''
                  }`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKR">PKR (Pakistani Rupee)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className={`transition-colors duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <Download className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Export your data or manage your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleExportData}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <Download className="h-4 w-4" />
                Export My Data
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('/help/privacy-policy', '_blank')}
                className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Privacy Policy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleSave} 
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading || !hasUnsavedChanges}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={isLoading || !hasUnsavedChanges}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')} disabled={isLoading}>
              Cancel
            </Button>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
