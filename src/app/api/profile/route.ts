import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        phone,
        bio,
        image,
        coverImage,
        address,
        referralCode,
        createdAt
      `)
      .eq('id', session.user.id)
      .single();

    if (error || !user) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const mapped = {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      bio: user.bio || '',
      image: user.image || '',
      coverImage: user.coverImage || '',
      address: user.address || '',
      referralCode: user.referralCode || session?.user?.referralCode || '',
      joinDate: user.createdAt || '',
    };

    return NextResponse.json({ user: mapped });
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
