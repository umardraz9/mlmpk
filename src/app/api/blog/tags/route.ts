import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public: GET /api/blog/tags
export async function GET() {
  try {
    const tags = await db.blogTag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { posts: true } },
      },
    });
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching public blog tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
