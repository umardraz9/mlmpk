import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TagIcon, ClockIcon, ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';

type TagPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await db.blogTag.findUnique({
    where: { slug },
  });
  
  if (!tag) {
    return {
      title: 'Tag Not Found',
      description: 'The requested blog tag could not be found',
    };
  }
  
  return {
    title: `${tag.name} | Blog Tags | Partnership Program`,
    description: `Browse all blog posts tagged with ${tag.name}`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const tag = await db.blogTag.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        include: {
          category: true,
          author: true,
        },
      },
    },
  });
  
  if (!tag) {
    notFound();
  }

  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="mb-8">
        <Link href="/blog/tags" legacyBehavior>
          <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            ← Back to Tags
          </a>
        </Link>
      </div>
      
      <div className="mb-10 space-y-4">
        <div className="flex items-center gap-2">
          <TagIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tag.name}</h1>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {tag.posts.length} {tag.posts.length === 1 ? 'post' : 'posts'} with this tag
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tag.posts.map((post) => (
          <Card key={post.id} className="flex flex-col overflow-hidden transition-all hover:shadow-md">
            {post.featuredImage && (
              <div className="aspect-video overflow-hidden">
                <img 
                  src={post.featuredImage} 
                  alt={post.title} 
                  className="h-full w-full object-cover transition-all hover:scale-105"
                />
              </div>
            )}
            <CardHeader className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Link href={`/blog/categories/${post.category.slug}`} legacyBehavior>
                    <a>{post.category.name}</a>
                  </Link>
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ClockIcon className="h-3 w-3" />
                  {formatDate(post.publishedAt)}
                </span>
              </div>
              <CardTitle className="line-clamp-2 text-xl">
                <Link href={`/blog/${post.slug}`} legacyBehavior>
                  <a className="hover:underline">{post.title}</a>
                </Link>
              </CardTitle>
              <CardDescription className="line-clamp-3">
                {post.excerpt}
              </CardDescription>
            </CardHeader>
            <CardFooter className="border-t p-4">
              <div className="flex w-full items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  By {post.author.name}
                </div>
                <Link href={`/blog/${post.slug}`} legacyBehavior>
                  <a className="flex items-center gap-1 text-sm font-medium hover:underline">
                    Read more <ArrowRightIcon className="h-3 w-3" />
                  </a>
                </Link>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {tag.posts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-xl font-medium">No posts found</h2>
          <p className="mt-2 text-muted-foreground">
            There are no published posts with this tag yet.
          </p>
          <Link href="/blog" legacyBehavior>
            <a className="mt-4">← Back to Blog</a>
          </Link>
        </div>
      )}
    </div>
  );
} 