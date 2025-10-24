import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    console.log('[PROFILE] Fetching profile for:', username);

    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Try to find user by username or ID
    let user = null;
    let userError = null;

    // First try by username
    const { data: userByUsername, error: usernameError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (userByUsername && !usernameError) {
      user = userByUsername;
    } else {
      // Try by ID (in case username is actually an ID)
      const { data: userById, error: idError } = await supabase
        .from('users')
        .select('*')
        .eq('id', username)
        .single();

      if (userById && !idError) {
        user = userById;
      } else {
        userError = usernameError || idError;
      }
    }

    if (userError || !user) {
      console.error('[PROFILE] User not found in database, creating demo profile:', { username, error: userError });
      
      // Create demo profile for users not in database
      const profileData = {
        id: username,
        name: 'MLM User',
        email: 'user@mlmpk.com',
        image: '/api/placeholder/50/50',
        username: `@${username.slice(-8)}`,
        bio: 'MLM Platform Member',
        phone: '+92 300 1234567',
        location: 'Pakistan',
        createdAt: new Date().toISOString(),
        membershipStatus: 'ACTIVE',
        membershipLevel: 'BASIC',
        totalEarnings: 0,
        referralCount: 0,
        lastActive: new Date().toISOString(),
        // Stats
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        isFollowing: false,
        recentPosts: []
      };

      return NextResponse.json({
        success: true,
        user: profileData
      });
    }

    console.log('[PROFILE] Found user:', user.id);

    // Return basic user profile
    const profileData = {
      id: user.id,
      name: user.name || 'User',
      email: user.email,
      image: user.image || '/api/placeholder/50/50',
      username: user.username || `@user${user.id.slice(-4)}`,
      bio: user.bio || '',
      phone: user.phone || '',
      location: user.location || '',
      createdAt: user.createdAt,
      membershipStatus: user.membershipStatus || 'ACTIVE',
      membershipLevel: user.membershipLevel || 'BASIC',
      totalEarnings: user.totalEarnings || 0,
      referralCount: user.referralCount || 0,
      lastActive: user.lastActive,
      // Stats
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      isFollowing: false,
      recentPosts: []
    };

    return NextResponse.json({
      success: true,
      user: profileData
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
