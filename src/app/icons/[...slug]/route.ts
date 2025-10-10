import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Ensure this route runs on Node.js runtime (not Edge)
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await context.params
    const iconName = slug.join('/')
    
    // Map PNG requests to SVG files
    const svgName = iconName.replace('.png', '.svg')
    const iconPath = join(process.cwd(), 'public', 'icons', svgName)
    
    try {
      const svgContent = await readFile(iconPath, 'utf-8')
      
      // Return SVG with proper headers
      return new NextResponse(svgContent, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch {
      // Fallback: generate a simple SVG icon
      const size = iconName.includes('32x32') ? 32 : 
                   iconName.includes('144x144') ? 144 :
                   iconName.includes('192x192') ? 192 : 512
      
      const fallbackSvg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" rx="${size/8}" fill="#10B981"/>
        <path d="M${size/4} ${size/2}L${size*5/8} ${size*11/16}L${size*3/4} ${size*5/16}" stroke="white" stroke-width="${size/16}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
      
      return new NextResponse(fallbackSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }
  } catch (error) {
    console.error('Error serving icon:', error)
    return new NextResponse('Icon not found', { status: 404 })
  }
}
