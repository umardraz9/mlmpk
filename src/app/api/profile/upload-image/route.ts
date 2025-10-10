import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    console.log('Upload request received');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Unauthorized upload attempt');
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
    }

    console.log('User authenticated:', session.user.id);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'profile' or 'cover'

    console.log('File received:', file?.name, 'Type:', type, 'Size:', file?.size);

    if (!file) {
      console.log('No file provided');
      return NextResponse.json({ error: 'No file provided', success: false }, { status: 400 });
    }

    if (!['profile', 'cover'].includes(type)) {
      console.log('Invalid image type:', type);
      return NextResponse.json({ error: 'Invalid image type', success: false }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type);
      return NextResponse.json({ error: 'File must be an image', success: false }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.log('File too large:', file.size);
      return NextResponse.json({ error: 'File size must be less than 5MB', success: false }, { status: 400 });
    }

    console.log('File validation passed');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles');
    console.log('Creating directory:', uploadsDir);
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${session.user.id}_${type}_${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    console.log('Saving file to:', filepath);

    // Save file
    await writeFile(filepath, buffer);
    console.log('File saved successfully');

    // Update user profile in database
    const imageUrl = `/uploads/profiles/${filename}`;
    
    console.log('Updating database with image URL:', imageUrl, 'Type:', type);

    let updateData: any = {};
    if (type === 'profile') {
      updateData.image = imageUrl;
    } else if (type === 'cover') {
      updateData.coverImage = imageUrl;
    }

    console.log('Final update data:', updateData);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData
    });

    console.log('Database updated successfully');

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      message: `${type === 'profile' ? 'Profile' : 'Cover'} image updated successfully`
    });

  } catch (error) {
    console.error('Upload error details:', error);
    return NextResponse.json({ 
      error: error.message || 'Upload failed', 
      success: false,
      details: error.toString()
    }, { status: 500 });
  }
}
