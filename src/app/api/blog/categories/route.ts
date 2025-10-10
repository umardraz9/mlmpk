import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public: GET /api/blog/categories
export async function GET() {
  try {
    const categories = await db.blogCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { posts: true } },
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching public blog categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
