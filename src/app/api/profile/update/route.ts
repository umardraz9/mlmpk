import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
    }

    const data = await req.json();
    console.log('Received profile update data:', data);
    console.log('User ID:', session.user.id);

    // Prepare update data with only defined fields
    const updateData: any = {};
    
    // Basic Info - with validation
    if (data.name !== undefined && data.name !== null) updateData.name = String(data.name).trim() || null;
    if (data.username !== undefined && data.username !== null) updateData.username = String(data.username).trim() || null;
    if (data.email !== undefined && data.email !== null) updateData.email = String(data.email).trim() || null;
    if (data.phone !== undefined && data.phone !== null) updateData.phone = String(data.phone).trim() || null;
    if (data.bio !== undefined && data.bio !== null) updateData.bio = String(data.bio).trim() || null;
    if (data.location !== undefined && data.location !== null) updateData.location = String(data.location).trim() || null;
    if (data.website !== undefined && data.website !== null) updateData.website = String(data.website).trim() || null;
    if (data.birthdate !== undefined) {
      if (data.birthdate && data.birthdate !== '') {
        try {
          updateData.birthdate = new Date(data.birthdate);
        } catch (e) {
          updateData.birthdate = null;
        }
      } else {
        updateData.birthdate = null;
      }
    }
    
    // Privacy settings - with boolean validation
    if (data.profileVisibility !== undefined) updateData.profileVisibility = String(data.profileVisibility) || 'public';
    if (data.showEmail !== undefined) updateData.showEmail = Boolean(data.showEmail);
    if (data.showPhone !== undefined) updateData.showPhone = Boolean(data.showPhone);
    if (data.showBirthdate !== undefined) updateData.showBirthdate = Boolean(data.showBirthdate);
    if (data.allowMessages !== undefined) updateData.allowMessages = Boolean(data.allowMessages);
    if (data.allowFollows !== undefined) updateData.allowFollows = Boolean(data.allowFollows);
    if (data.showOnlineStatus !== undefined) updateData.showOnlineStatus = Boolean(data.showOnlineStatus);
    
    // Notification settings - with boolean validation
    if (data.emailNotifications !== undefined) updateData.emailNotifications = Boolean(data.emailNotifications);
    if (data.pushNotifications !== undefined) updateData.pushNotifications = Boolean(data.pushNotifications);
    if (data.postLikes !== undefined) updateData.postLikes = Boolean(data.postLikes);
    if (data.postComments !== undefined) updateData.postComments = Boolean(data.postComments);
    if (data.newFollowers !== undefined) updateData.newFollowers = Boolean(data.newFollowers);
    if (data.directMessages !== undefined) updateData.directMessages = Boolean(data.directMessages);
    if (data.partnershipUpdates !== undefined) updateData.partnershipUpdates = Boolean(data.partnershipUpdates);
    if (data.weeklyDigest !== undefined) updateData.weeklyDigest = Boolean(data.weeklyDigest);
    
    // Partnership settings - with validation
    if (data.partnerLevel !== undefined && data.partnerLevel !== null) updateData.partnerLevel = String(data.partnerLevel) || 'Bronze';
    if (data.teamRole !== undefined && data.teamRole !== null) updateData.teamRole = String(data.teamRole) || 'Member';
    if (data.mentorId !== undefined) updateData.mentorId = data.mentorId || null;
    if (data.specializations !== undefined) {
      try {
        updateData.specializations = Array.isArray(data.specializations) 
          ? JSON.stringify(data.specializations) 
          : JSON.stringify([]);
      } catch (e) {
        updateData.specializations = JSON.stringify([]);
      }
    }
    if (data.achievements !== undefined) {
      try {
        updateData.achievements_list = Array.isArray(data.achievements) 
          ? JSON.stringify(data.achievements) 
          : JSON.stringify([]);
      } catch (e) {
        updateData.achievements_list = JSON.stringify([]);
      }
    }

    console.log('Update data to be saved:', updateData);

    // Validate required fields and remove any invalid ones
    const validatedData: any = {};
    
    // Only include fields that exist in the User model
    const validFields = [
      'name', 'username', 'email', 'phone', 'bio', 'location', 'website', 'birthdate', 'coverImage',
      'profileVisibility', 'showEmail', 'showPhone', 'showBirthdate', 'allowMessages', 'allowFollows', 'showOnlineStatus',
      'emailNotifications', 'pushNotifications', 'postLikes', 'postComments', 'newFollowers', 'directMessages', 'partnershipUpdates', 'weeklyDigest',
      'partnerLevel', 'teamRole', 'mentorId', 'specializations', 'achievements_list'
    ];

    for (const field of validFields) {
      if (updateData[field] !== undefined) {
        validatedData[field] = updateData[field];
      }
    }

    console.log('Validated data to be saved:', validatedData);

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData
    });

    console.log('Profile updated successfully for user:', session.user.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ 
      error: error.message || 'Update failed', 
      success: false,
      details: error.toString()
    }, { status: 500 });
  }
}
