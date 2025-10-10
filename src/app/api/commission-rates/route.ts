import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// GET - Fetch active commission rates (public endpoint)
export async function GET() {
  try {
    const commissionSettings = await prisma.commissionSettings.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' },
      select: {
        level: true,
        rate: true,
        description: true,
      }
    })

    return NextResponse.json(commissionSettings)
  } catch (error) {
    console.error('Error fetching commission rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
