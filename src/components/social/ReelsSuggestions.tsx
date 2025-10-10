'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Heart, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Reel {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  author: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
  likes: number;
  comments: number;
  shares: number;
  duration: number;
  createdAt: string;
}

export function ReelsSuggestions() {
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social/reels');
      if (res.ok) {
        const data = await res.json();
        setReels(data.reels?.slice(0, 2) || []);
      }
    } catch (error) {
      console.error('Failed to load reels:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse border border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="aspect-[9/16] max-h-80 bg-gray-200 rounded-lg"></div>
          <div className="aspect-[9/16] max-h-80 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Always show the component, even with no data
  // if (reels.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Video className="h-5 w-5 text-purple-600" />
          Trending Reels
        </h3>
      </div>

      <div className="p-6">
        {reels.length === 0 ? (
          <div className="text-center py-8">
            <Video className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No reels available right now</p>
            <p className="text-gray-400 text-xs mt-1">Be the first to create a reel!</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">Watch what&apos;s trending now:</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {reels.map((reel) => (
            <div key={reel.id} className="bg-gray-900 rounded-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative aspect-[9/16] max-h-80">
                <video
                  src={reel.videoUrl}
                  poster={reel.thumbnailUrl}
                  className="w-full h-full object-cover"
                  controls
                  muted
                />
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {Math.floor(reel.duration / 60)}:{(reel.duration % 60).toString().padStart(2, '0')}
                </div>
              </div>

              <div className="p-3 bg-gray-900">
                <p className="text-white text-sm mb-2 line-clamp-2">{reel.caption}</p>
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{reel.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{reel.comments}</span>
                    </div>
                  </div>
                  <span className="text-gray-400">@{reel.author.username}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/social/reels')}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            View All Reels
          </Button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
