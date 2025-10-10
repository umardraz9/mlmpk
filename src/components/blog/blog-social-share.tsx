'use client';

import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Linkedin, MessageCircle, Copy, Mail } from 'lucide-react';

interface BlogSocialShareProps {
  title: string;
  url: string;
  excerpt?: string;
}

export default function BlogSocialShare({ title, url, excerpt }: BlogSocialShareProps) {
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(excerpt || '' + '\n\n' + url)}`
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  return (
    <div className="py-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareLinks.facebook)}
          className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareLinks.twitter)}
          className="flex items-center gap-2 text-sky-600 border-sky-600 hover:bg-sky-50"
        >
          <Twitter className="h-4 w-4" />
          Twitter
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareLinks.linkedin)}
          className="flex items-center gap-2 text-blue-700 border-blue-700 hover:bg-blue-50"
        >
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => openShareWindow(shareLinks.whatsapp)}
          className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = shareLinks.email}
          className="flex items-center gap-2 text-gray-600 border-gray-600 hover:bg-gray-50"
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="flex items-center gap-2 text-purple-600 border-purple-600 hover:bg-purple-50"
        >
          <Copy className="h-4 w-4" />
          Copy Link
        </Button>
      </div>
    </div>
  );
} 