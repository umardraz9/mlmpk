import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'You must be logged in to upload files' 
      }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const type = data.get('type') as string || 'image' // 'image', 'video', or 'audio'
    
    if (!file) {
      console.warn('Upload attempt without file', { userId: session.user.id })
      return NextResponse.json({ 
        error: 'No file uploaded', 
        message: 'Please select a file to upload' 
      }, { status: 400 })
    }
    
    // Additional security: Validate that the file is actually a file
    if (!(file instanceof File)) {
      console.warn('Invalid file object in upload', { userId: session.user.id })
      return NextResponse.json({ 
        error: 'Invalid file', 
        message: 'The uploaded object is not a valid file' 
      }, { status: 400 })
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
    const allowedAudioTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
    
    if (type === 'image' && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid image type', 
        message: 'Allowed image types: JPEG, PNG, GIF, WebP',
        receivedType: file.type
      }, { status: 400 })
    }
    
    if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid video type', 
        message: 'Allowed video types: MP4, WebM, OGG, MOV',
        receivedType: file.type
      }, { status: 400 })
    }

    if (type === 'audio' && !allowedAudioTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid audio type', 
        message: 'Allowed audio types: WebM, MP4, MP3, WAV, OGG',
        receivedType: file.type
      }, { status: 400 })
    }

    // Validate file size (10MB for images, 100MB for videos, 50MB for audio)
    const maxImageSize = 10 * 1024 * 1024 // 10MB
    const maxVideoSize = 100 * 1024 * 1024 // 100MB
    const maxAudioSize = 50 * 1024 * 1024 // 50MB
    
    if (type === 'image' && file.size > maxImageSize) {
      return NextResponse.json({ 
        error: 'Image too large', 
        message: `Maximum image size is 10MB. Your file is ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`,
        maxSize: '10MB',
        fileSize: file.size
      }, { status: 400 })
    }
    
    if (type === 'video' && file.size > maxVideoSize) {
      return NextResponse.json({ 
        error: 'Video too large', 
        message: `Maximum video size is 100MB. Your file is ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`,
        maxSize: '100MB',
        fileSize: file.size
      }, { status: 400 })
    }

    if (type === 'audio' && file.size > maxAudioSize) {
      return NextResponse.json({ 
        error: 'Audio too large', 
        message: `Maximum audio size is 50MB. Your file is ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`,
        maxSize: '50MB',
        fileSize: file.size
      }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Create upload directory structure
    const uploadDir = join(process.cwd(), 'public', 'uploads', 
      type === 'image' ? 'images' : 
      type === 'video' ? 'videos' : 
      type === 'audio' ? 'audio' : 'files'
    )
    const userDir = join(uploadDir, session.user.id)
    
    try {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }
      
      if (!existsSync(userDir)) {
        await mkdir(userDir, { recursive: true })
      }
    } catch (dirError: any) {
      console.error('Directory creation error:', {
        message: dirError?.message,
        code: dirError?.code,
        path: userDir
      })
      return NextResponse.json({ 
        error: 'Failed to create upload directory', 
        message: 'Please try again later',
        details: dirError?.message
      }, { status: 500 })
    }

    // Generate unique filename with hash for security
    const timestamp = Date.now()
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex').substring(0, 16)
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}_${fileHash}_${originalName}`
    const filepath = join(userDir, filename)

    // Save file
    try {
      console.log('Writing file to:', filepath)
      await writeFile(filepath, buffer)
      console.log('File written successfully')
    } catch (writeError: any) {
      console.error('File write error:', {
        message: writeError?.message,
        code: writeError?.code,
        path: filepath,
        bufferSize: buffer.length
      })
      return NextResponse.json({ 
        error: 'Failed to save file', 
        message: 'Please try again later',
        details: writeError?.message
      }, { status: 500 })
    }

    // Return public URL (respect requested type)
    const folder =
      type === 'image' ? 'images' :
      type === 'video' ? 'videos' :
      type === 'audio' ? 'audio' : 'files'
    const publicUrl = `/uploads/${folder}/${session.user.id}/${filename}`
    
    console.log('File uploaded successfully', { 
      userId: session.user.id, 
      filename, 
      fileSize: file.size, 
      type: file.type 
    })

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type,
      message: 'File uploaded successfully'
    })

  } catch (error: any) {
    console.error('File upload error:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name
    })
    return NextResponse.json({ 
      error: 'Failed to upload file',
      message: 'An unexpected error occurred during upload. Please try again later.',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

// GET - List user's uploaded files
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in to list files'
      }, { status: 401 })
    }

    // const { searchParams } = new URL(request.url)
    // const type = searchParams.get('type') || 'all' // 'image', 'video', or 'all'

    // This is a simple implementation - in production, you'd want to store file metadata in database
    return NextResponse.json({
      message: 'File listing not implemented - files are stored locally'
    })

  } catch (error) {
    console.error('File listing error:', error)
    return NextResponse.json({ 
      error: 'Failed to list files',
      message: 'An unexpected error occurred while listing files. Please try again later.'
    }, { status: 500 })
  }
}
