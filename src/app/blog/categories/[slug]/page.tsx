import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderIcon, ClockIcon, ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.blogCategory.findUnique({
    where: { slug },
  });
  
  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The requested blog category could not be found',
    };
  }
  
  return {
    title: `${category.name} | Blog Categories | Partnership Program`,
    description: category.description || `Browse all blog posts in the ${category.name} category`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await db.blogCategory.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        include: {
          author: true,
          tags: true,
        },
      },
    },
  });
  
  if (!category) {
    notFound();
  }

  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="mb-8">
        <Link href="/blog/categories" legacyBehavior>
          <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            ← Back to Categories
          </a>
        </Link>
      </div>
      
      <div className="mb-10 space-y-4">
        <div className="flex items-center gap-2">
          <FolderIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{category.name}</h1>
        </div>
        
        {category.description && (
          <p className="text-lg text-muted-foreground">{category.description}</p>
        )}
        
        <p className="text-sm text-muted-foreground">
          {category.posts.length} {category.posts.length === 1 ? 'post' : 'posts'} in this category
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {category.posts.map((post) => (
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
                  {category.name}
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
                    Read More
                  </a>
                </Link>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {category.posts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-xl font-medium">No posts found</h2>
          <p className="mt-2 text-muted-foreground">
            There are no published posts in this category yet.
          </p>
          <Link href="/blog" legacyBehavior>
            <a className="mt-4">← Back to Blog</a>
          </Link>
        </div>
      )}
    </div>
  );
}
 