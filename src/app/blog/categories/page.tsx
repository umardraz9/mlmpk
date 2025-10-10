import { Metadata } from 'next';
import Link from 'next/link';
import { getBlogCategories } from '@/lib/blog';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderIcon, ArrowRightIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog Categories | Partnership Program',
  description: 'Browse blog posts by category',
};

export default async function BlogCategoriesPage() {
  const categories = await getBlogCategories();

  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Categories</h1>
          <Link href="/blog" legacyBehavior>
            <a>← Back to Blog</a>
          </Link>
        </div>
        <p className="text-lg text-muted-foreground">
          Browse our blog posts by category to find the information you're looking for
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="flex flex-col overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{category.name}</CardTitle>
              </div>
              <CardDescription>
                {category._count.posts} {category._count.posts === 1 ? 'post' : 'posts'}
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto border-t p-4">
              <Link 
                href={`/blog/categories/${category.slug}`}
                className="flex items-center gap-1 text-sm font-medium hover:underline"
              >
                Browse posts <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 