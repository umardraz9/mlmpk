// Profile service for syncing profile data across different profile pages
// This ensures /profile and /social/profile stay in sync

export interface ProfileData {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  image?: string | null;
  coverImage?: string | null;
  address?: string | null;
  referralCode?: string | null;
  joinDate?: string | null;
}

class ProfileService {
  private cacheKey = 'user-profile-cache';
  private cacheTimeKey = 'user-profile-cache-time';
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  // Get cached profile data
  private getCachedProfile(): ProfileData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(this.cacheKey);
      const cacheTime = localStorage.getItem(this.cacheTimeKey);
      
      if (!cached || !cacheTime) return null;
      
      const isExpired = Date.now() - parseInt(cacheTime) > this.cacheDuration;
      if (isExpired) {
        this.clearCache();
        return null;
      }
      
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }

  // Set profile data in cache
  private setCachedProfile(profile: ProfileData): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(profile));
      localStorage.setItem(this.cacheTimeKey, Date.now().toString());
    } catch (error) {
      console.warn('Failed to cache profile data:', error);
    }
  }

  // Clear cached profile data
  private clearCache(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.cacheKey);
    localStorage.removeItem(this.cacheTimeKey);
  }

  // Fetch profile data from API
  async fetchProfile(userId?: string): Promise<ProfileData | null> {
    try {
      // Try cache first if no specific user ID
      if (!userId) {
        const cached = this.getCachedProfile();
        if (cached) return cached;
      }

      const url = userId ? `/api/profile/${userId}` : '/api/profile';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const data = await response.json();
      const profile: ProfileData = data.user || data;
      
      // Cache only for current user
      if (!userId) {
        this.setCachedProfile(profile);
      }
      
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  // Update profile data
  async updateProfile(updates: Partial<ProfileData>): Promise<ProfileData | null> {
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }
      
      const data = await response.json();
      const raw = data.user || data;
      const updatedProfile: ProfileData = {
        id: raw.id,
        name: raw.name ?? null,
        email: raw.email ?? null,
        phone: raw.phone ?? null,
        bio: raw.bio ?? null,
        image: raw.image ?? null,
        coverImage: raw.coverImage ?? null,
        address: (raw.address ?? raw.location) ?? null,
        referralCode: raw.referralCode ?? null,
        joinDate: (raw.joinDate ?? (raw.createdAt ? new Date(raw.createdAt).toISOString() : null)) ?? null,
      };
      
      // Update cache
      this.setCachedProfile(updatedProfile);
      
      // Trigger custom event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: updatedProfile 
        }));
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }

  // Upload profile image
  async uploadImage(file: File, type: 'profile' | 'cover' = 'profile'): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.status}`);
      }
      
      const data = await response.json();
      const imageUrl = data.imageUrl;
      
      // Update cached profile with new image
      const cached = this.getCachedProfile();
      if (cached) {
        const updatedProfile = {
          ...cached,
          [type === 'profile' ? 'image' : 'coverImage']: imageUrl
        };
        this.setCachedProfile(updatedProfile);
        
        // Trigger update event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profileUpdated', { 
            detail: updatedProfile 
          }));
        }
      }
      
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  }

  // Subscribe to profile updates
  onProfileUpdate(callback: (profile: ProfileData) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };
    
    window.addEventListener('profileUpdated', handler as EventListener);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('profileUpdated', handler as EventListener);
    };
  }

  // Force refresh profile from server
  async refreshProfile(): Promise<ProfileData | null> {
    this.clearCache();
    return this.fetchProfile();
  }
}

// Export singleton instance
export const profileService = new ProfileService();
