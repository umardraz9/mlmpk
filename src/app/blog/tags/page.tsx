import { Metadata } from 'next';
import Link from 'next/link';
import { getBlogTags } from '@/lib/blog';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TagIcon, ArrowRightIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog Tags | Partnership Program',
  description: 'Browse blog posts by tags',
};

export default async function BlogTagsPage() {
  const tags = await getBlogTags();

  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Tags</h1>
          <Link href="/blog" legacyBehavior>
            <a>← Back to Blog</a>
          </Link>
        </div>
        <p className="text-lg text-muted-foreground">
          Browse our blog posts by tags to find the specific topics you're interested in
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <Card key={tag.id} className="flex flex-col overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TagIcon className="h-5 w-5 text-muted-foreground" />
                <CardTitle>{tag.name}</CardTitle>
              </div>
              <CardDescription>
                {tag._count.posts} {tag._count.posts === 1 ? 'post' : 'posts'}
              </CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto border-t p-4">
              <Link 
                href={`/blog/tags/${tag.slug}`}
                className="flex items-center gap-1 text-sm font-medium hover:underline"
              >
                Browse posts <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {tags.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
          <h2 className="text-xl font-medium">No tags found</h2>
          <p className="mt-2 text-muted-foreground">
            There are no tags available yet.
          </p>
          <Link href="/blog" legacyBehavior>
            <a className="mt-4">← Back to Blog</a>
          </Link>
        </div>
      )}
    </div>
  );
} 