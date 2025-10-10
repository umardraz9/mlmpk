'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import BackToDashboard from '@/components/BackToDashboard';
import { profileService, type ProfileData } from '@/lib/profile-service';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  Pencil as Edit,
  Camera,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Crown,
  Trophy,
  DollarSign,
  Users,
  Star,
  Settings,
  Bell,
  Lock,
  Download,
  Share2,
  Copy,
  QrCode,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<{ totalEarnings: number; totalReferrals: number; voucherBalance: number; teamSize: number; membershipStatus?: string; planDisplayName?: string }>({ totalEarnings: 0, totalReferrals: 0, voucherBalance: 0, teamSize: 0 });

  const [profileData, setProfileData] = useState<ProfileData>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    joinDate: '',
    referralCode: '',
    image: ''
  });

  // Demo stats removed to avoid unused lints

  const [achievements, setAchievements] = useState<Array<{ id: string | number; name: string; earned: boolean; type?: string }>>([]);

  // Generate QR Code using canvas
  const generateQRCode = () => {
    if (!qrCanvasRef.current) return;
    
    const canvas = qrCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 200;
    canvas.height = 200;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 200, 200);

    // Generate a simple QR-like pattern (in real app, use a QR library)
    
    // Simple grid pattern for demonstration
    ctx.fillStyle = 'black';
    const size = 8;
    const margin = 20;
    
    // Create a simple pattern
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        // Create a pseudo-random pattern based on referral code
        const hash = (profileData.referralCode.charCodeAt(i % profileData.referralCode.length) + i + j) % 3;
        if (hash === 0) {
          ctx.fillRect(margin + i * size, margin + j * size, size, size);
        }
      }
    }

    // Add corner markers
    const cornerSize = 3 * size;
    
    // Top-left corner
    ctx.fillRect(margin, margin, cornerSize, cornerSize);
    ctx.fillStyle = 'white';
    ctx.fillRect(margin + size, margin + size, size, size);
    
    // Top-right corner
    ctx.fillStyle = 'black';
    ctx.fillRect(200 - margin - cornerSize, margin, cornerSize, cornerSize);
    ctx.fillStyle = 'white';
    ctx.fillRect(200 - margin - cornerSize + size, margin + size, size, size);
    
    // Bottom-left corner
    ctx.fillStyle = 'black';
    ctx.fillRect(margin, 200 - margin - cornerSize, cornerSize, cornerSize);
    ctx.fillStyle = 'white';
    ctx.fillRect(margin + size, 200 - margin - cornerSize + size, size, size);
  };

  // Copy referral code to clipboard
  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(profileData.referralCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setError('Failed to copy referral code');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Load profile and stats on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) return;
      setLoading(true);
      try {
        const profile = await profileService.fetchProfile();
        if (profile) {
          setProfileData({
            ...profile,
            referralCode: profile.referralCode ?? session?.user?.referralCode ?? ''
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    const loadStats = async () => {
      try {
        const res = await fetch('/api/user/stats', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setStats(prev => ({
            ...prev,
            totalEarnings: Number(data?.totalEarnings ?? 0),
            totalReferrals: Number(data?.totalReferrals ?? 0),
            voucherBalance: Number(data?.voucherBalance ?? 0),
            teamSize: Number(data?.totalReferrals ?? 0),
            membershipStatus: data?.membershipStatus,
            planDisplayName: data?.membershipPlan?.displayName || data?.membershipPlan?.name
          }));
        }
        // Fetch deeper team counts
        const refRes = await fetch('/api/user/referral-stats', { cache: 'no-store' });
        if (refRes.ok) {
          const refData = await refRes.json();
          setStats(prev => ({ ...prev, teamSize: Number(refData?.totalReferrals ?? prev.teamSize) }));
        }
      } catch {
        // Silently ignore, UI will show zeros
      }
    };

    const loadAchievements = async () => {
      try {
        const res = await fetch('/api/social/achievements', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          type ApiAchievement = { id: string | number; title?: string; type?: string };
          const list = (data.achievements || []).map((a: ApiAchievement) => ({ id: a.id, name: a.title ?? 'Achievement', earned: true, type: a.type }));
          setAchievements(list);
        }
      } catch {}
    };

    if (session?.user) {
      loadProfile();
      loadStats();
      loadAchievements();
    }

    // Subscribe to profile updates
    const unsubscribe = profileService.onProfileUpdate((updatedProfile) => {
      setProfileData(updatedProfile);
    });

    return unsubscribe;
  }, [session]);

  // Handle image upload using profile service
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const imageUrl = await profileService.uploadImage(file, 'profile');
      if (imageUrl) {
        // Optimistically update local state too
        setProfileData(prev => ({ ...prev, image: imageUrl || prev.image }));
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2000);
      } else {
        setError('Failed to upload image');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      setError('Failed to upload image');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Share referral link
  const shareReferralLink = async () => {
    const referralUrl = `https://mlm-pak.com/register?ref=${profileData.referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join MLM-Pak',
          text: `Join MLM-Pak using my referral code: ${profileData.referralCode}`,
          url: referralUrl,
        });
      } catch {
        // Fallback to clipboard
        copyToClipboard(referralUrl);
      }
    } else {
      // Fallback to clipboard
      copyToClipboard(referralUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setError('Failed to copy link');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    if (!qrCanvasRef.current) return;
    
    const canvas = qrCanvasRef.current;
    const link = document.createElement('a');
    link.download = `MLM-Pak-Referral-${profileData.referralCode}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Show/Hide QR Code
  const toggleQRCode = () => {
    setShowQrCode(!showQrCode);
    if (!showQrCode) {
      setTimeout(generateQRCode, 100);
    }
  };

  const saveProfile = async () => {
    try {
      setError('');
      type UpdatePayload = Partial<ProfileData> & { location?: string | null };
      const payload: UpdatePayload = {
        name: profileData.name || '',
        phone: profileData.phone || '',
        bio: profileData.bio || '',
        address: profileData.address || '',
        email: profileData.email || '',
        // include legacy 'location' for backend compatibility
        location: profileData.address ?? null,
      };
      const updated = await profileService.updateProfile(payload);
      if (!updated) throw new Error('Update failed');
      setProfileData(updated);
      setIsEditing(false);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch {
      setError('Failed to save profile changes');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData({
      ...profileData,
      [field]: value
    });
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back to Dashboard Button */}
        <BackToDashboard />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            My Profile
          </h1>
          <p className="text-xl text-gray-700">
            Manage your profile and track your MLM journey
          </p>
        </div>

        {/* Success/Error Messages */}
        {copySuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <Check className="h-5 w-5 mr-2" />
            Successfully copied to clipboard!
          </div>
        )}
        
        {uploadSuccess && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <Check className="h-5 w-5 mr-2" />
            Profile updated successfully!
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1 border-gray-200">
            <CardHeader className="text-center">
              <div className="relative mx-auto mb-4">
                <Image
                  src={profileData.image || '/images/default-avatar.png'}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                  unoptimized
                />
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full p-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-3 w-3" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              <div className="space-y-2">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="text-center font-bold"
                      placeholder="Full name"
                      aria-label="Full name"
                    />
                  </div>
                ) : (
                <h2 className="text-xl font-bold text-gray-900">{profileData.name}</h2>
                )}
                
                <div className="flex items-center justify-center gap-2">
                  <Badge className="bg-yellow-500 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    {stats.planDisplayName || 'Member'}
                  </Badge>
                  <Badge variant="outline">
                    {stats.membershipStatus ? `Status ${stats.membershipStatus}` : 'Status —'}
                  </Badge>
                </div>
                
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none"
                    rows={3}
                  />
                ) : (
                <p className="text-sm text-gray-600">{profileData.bio}</p>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                {isEditing ? (
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="text-sm"
                    placeholder="Email address"
                    aria-label="Email address"
                  />
                ) : (
                <span className="text-sm text-gray-700">{profileData.email}</span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                {isEditing ? (
                  <Input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="text-sm"
                    placeholder="Phone number"
                    aria-label="Phone number"
                  />
                ) : (
                <span className="text-sm text-gray-700">{profileData.phone}</span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                {isEditing ? (
                  <Input
                    value={profileData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="text-sm"
                    placeholder="Address"
                    aria-label="Address"
                  />
                ) : (
                <span className="text-sm text-gray-700">{profileData.address}</span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {profileData.joinDate ? `Joined ${new Date(profileData.joinDate).toLocaleDateString()}` : 'Joined —'}
                </span>
              </div>
              
              <Button
                className="w-full mt-4"
                variant={isEditing ? "default" : "outline"}
                onClick={() => isEditing ? saveProfile() : setIsEditing(true)}
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
              
              {isEditing && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Stats & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* MLM Stats */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  MLM Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      PKR {Number(stats.totalEarnings).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.totalReferrals}
                    </div>
                    <div className="text-sm text-gray-600">Total Referrals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.teamSize}
                    </div>
                    <div className="text-sm text-gray-600">Team Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      PKR {Number(stats.voucherBalance).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Voucher Balance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral Code */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Share2 className="h-5 w-5" />
                  Your Referral Code
                </CardTitle>
                <CardDescription className="text-green-700">
                  Share this code to invite new members and earn commissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 p-3 bg-white border border-green-300 rounded-lg">
                    <code className="text-lg font-mono font-bold text-green-800">
                      {profileData.referralCode}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyReferralCode}
                    className="border-green-600 text-green-700 hover:bg-green-100"
                    title="Copy referral code"
                  >
                    {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleQRCode}
                    className="border-green-600 text-green-700 hover:bg-green-100"
                    title="Show/Hide QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* QR Code Display */}
                {showQrCode && (
                  <div className="mb-4 p-4 bg-white border border-green-300 rounded-lg text-center">
                    <div className="mb-2">
                      <canvas
                        ref={qrCanvasRef}
                        className="mx-auto border border-gray-200 rounded"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Scan this QR code to join with your referral
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadQRCode}
                      className="border-green-600 text-green-700 hover:bg-green-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={shareReferralLink}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Link
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-green-600 text-green-700 hover:bg-green-100"
                    onClick={downloadQRCode}
                    disabled={!showQrCode}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  Your MLM milestones and accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {achievements.length === 0 ? (
                    <p className="text-sm text-gray-600">No achievements yet</p>
                  ) : (
                    achievements.map((a) => (
                      <div
                        key={a.id}
                        className={`p-4 rounded-lg border text-center transition-all hover:scale-105 ${
                          a.earned ? 'bg-yellow-50 border-yellow-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-50'
                        }`}
                      >
                        <Trophy className={`h-8 w-8 mx-auto mb-2 ${a.earned ? 'text-yellow-600' : 'text-gray-400'}`} />
                        <h4 className={`font-semibold text-sm ${a.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                          {a.name}
                        </h4>
                        {a.earned && (
                          <Badge className="text-xs mt-1 bg-green-100 text-green-800">✓ Earned</Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50"
                    onClick={() => window.location.href = '/notifications'}
                  >
                    <Bell className="h-6 w-6 text-blue-600" />
                    <span className="text-sm">Notifications</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-green-50"
                    onClick={() => window.location.href = '/settings'}
                  >
                    <Lock className="h-6 w-6 text-green-600" />
                    <span className="text-sm">Privacy</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50"
                    onClick={() => window.location.href = '/settings'}
                  >
                    <Download className="h-6 w-6 text-purple-600" />
                    <span className="text-sm">Download Data</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-gray-50"
                    onClick={() => window.location.href = '/settings'}
                  >
                    <Settings className="h-6 w-6 text-gray-600" />
                    <span className="text-sm">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6 border-gray-200">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <Users className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">New referral joined</p>
                  <p className="text-sm text-gray-600">Fatima Ali joined using your referral code</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              
              <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Commission earned</p>
                  <p className="text-sm text-gray-600">Earned PKR 200 from Level 1 referral</p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
              
              <div className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Achievement unlocked</p>
                  <p className="text-sm text-gray-600">Reached Gold member status</p>
                </div>
                <span className="text-sm text-gray-500">3 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 