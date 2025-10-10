import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import BlogPostForm from '@/components/blog/blog-post-form';

type BlogPostEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: 'Edit Blog Post | Admin Dashboard',
  description: 'Edit an existing blog post',
};

export default async function BlogPostEditPage({ params }: BlogPostEditPageProps) {
  // Await params in Next.js 15
  const { id } = await params;
  
  // Get the blog post, categories, and tags
  const [rawPost, categories, tags] = await Promise.all([
    id === 'new'
      ? null
      : db.blogPost.findUnique({
          where: { id },
          include: {
            tags: true,
          },
        }),
    db.blogCategory.findMany({
      orderBy: { name: 'asc' },
    }),
    db.blogTag.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  // Transform date fields to strings for the form
  const post = rawPost ? {
    ...rawPost,
    publishedAt: rawPost.publishedAt?.toISOString() || '',
    scheduledAt: rawPost.scheduledAt?.toISOString() || '',
    createdAt: rawPost.createdAt.toISOString(),
    updatedAt: rawPost.updatedAt.toISOString(),
  } : null;

  // If editing and post not found, 404
  if (id !== 'new' && !post) {
    notFound();
  }

  // Get the selected tag IDs if editing
  const selectedTagIds = post?.tags.map((tag) => tag.id) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {id === 'new' ? 'Create New Blog Post' : 'Edit Blog Post'}
        </h1>
        <p className="text-muted-foreground">
          {id === 'new'
            ? 'Create a new blog post to publish on your site'
            : 'Edit and update an existing blog post'}
        </p>
      </div>

      <BlogPostForm
        post={post}
        categories={categories}
        tags={tags}
        selectedTagIds={selectedTagIds}
      />
    </div>
  );
} 