"use client";

import { useState } from 'react';
import { Camera, Save, X } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';

interface ProfileSettingsProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    bio?: string;
    phone?: string;
    location?: string;
  };
  onUpdate: (updates: Partial<typeof user>) => Promise<void>;
}

export default function ProfileSettings({ user, onUpdate }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio || '',
    phone: user.phone || '',
    location: user.location || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      bio: user.bio || '',
      phone: user.phone || '',
      location: user.location || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Profile Header */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative">
          <UserAvatar
            user={user}
            size="xl"
            showUpload={true}
            onImageUpdate={(imageUrl) => onUpdate({ image: imageUrl })}
          />
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {user.name}
          </h1>
          <p className="text-gray-600 mb-2">{user.email}</p>
          {user.bio && (
            <p className="text-gray-700 text-sm">{user.bio}</p>
          )}
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors text-sm font-medium"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter your display name"
            />
          ) : (
            <p className="text-gray-900 py-2">{user.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          {isEditing ? (
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p className="text-gray-900 py-2 min-h-20">
              {user.bio || 'No bio added yet.'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            ) : (
              <p className="text-gray-900 py-2">{user.phone || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="City, Country"
              />
            ) : (
              <p className="text-gray-900 py-2">{user.location || 'Not provided'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Image Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
        <div className="flex items-center gap-4">
          <UserAvatar
            user={user}
            size="lg"
            showUpload={true}
            onImageUpdate={(imageUrl) => onUpdate({ image: imageUrl })}
          />
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Upload a new profile picture. Recommended size: 400x400px, max 5MB.
            </p>
            <p className="text-xs text-gray-500">
              JPG, PNG, or GIF format
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
