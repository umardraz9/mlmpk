"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Loader2, ArrowLeft, X, MoreVertical, Plus, Upload, Video, Play } from "lucide-react";
import { createYouTubePlayer } from "@/lib/youtube-api";

interface ReelPost {
  id: string;
  content: string;
  videoUrl: string;
  coverUrl?: string | null;
  reelMeta?: any;
  author?: {
    id?: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
  isLiked?: boolean;
  likes?: number;
  comments?: number;
  shares?: number;
  createdAt?: string | Date;
}

function ReelsPageContent() {
  const { data: session } = useSession();
  const [reels, setReels] = useState<ReelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [youtubeAPILoaded, setYoutubeAPILoaded] = useState(false);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const [reportOpenFor, setReportOpenFor] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ 
    content: "", 
    videoUrl: "", 
    coverUrl: "", 
    platform: "direct" as string 
  });
  const [videoPreview, setVideoPreview] = useState<{
    type: string;
    embedUrl: string;
    thumbnail?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const youtubePlayers = useRef<Record<string, any>>({});
  const lastTapTimeRef = useRef<number>(0);
  const prevIndexRef = useRef<number>(0);
  const resumeSecondsRef = useRef<Record<string, number>>({});
  const touchStartYRef = useRef<number | null>(null);
  const touchDeltaYRef = useRef<number>(0);
  const searchParams = useSearchParams();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  // Load YouTube API using our utility
  useEffect(() => {
    // Import and use the YouTube API utility
    import('@/lib/youtube-api').then(({ loadYouTubeAPI }) => {
      loadYouTubeAPI().then(() => {
        setYoutubeAPILoaded(true);
      }).catch(error => {
        console.error('Failed to load YouTube API:', error);
      });
    });
    
    // Cleanup function
    return () => {
      // Clean up any YouTube players when component unmounts
      Object.values(youtubePlayers.current).forEach((player: any) => {
        if (player && typeof player.destroy === 'function') {
          player.destroy();
        }
      });
      youtubePlayers.current = {};
    };
  }, []);
  
  // Initialize YouTube players when API is loaded and current post changes
  useEffect(() => {
    if (typeof window === 'undefined' || !reels || reels.length === 0 || !youtubeAPILoaded) return;

    const currentPost = reels[currentIndex];
    if (!currentPost) return;

    const videoInfo = parseVideoUrl(currentPost.mediaUrl || currentPost.videoUrl);
    if (!videoInfo || videoInfo.platform !== 'youtube') return;

    // Dynamically import the YouTube API utility
    import('@/lib/youtube-api').then(({ createYouTubePlayer }) => {
      // Create YouTube player if it doesn't exist
      if (!youtubePlayers.current[currentPost.id]) {
        const playerDiv = document.getElementById(`youtube-player-${currentPost.id}`);
        if (!playerDiv) return;

        // Use our utility to create the player
        createYouTubePlayer(playerDiv.id, videoInfo.videoId, {
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            mute: 1,
          },
          events: {
            onReady: (event: any) => {
              // Set mute state
              if (muted) {
                event.target.mute();
              } else {
                event.target.unMute();
              }
              
              // Play the video
              event.target.playVideo();
            },
            onStateChange: (event: any) => {
              // Auto-pause if not current video
              if (event.data === 1) { // 1 = YT.PlayerState.PLAYING
                // Update progress tracking
                const duration = event.target.getDuration();
                const interval = setInterval(() => {
                  if (youtubePlayers.current[currentPost.id]) {
                    const currentTime = event.target.getCurrentTime();
                    setProgress(prev => ({
                      ...prev,
                      [currentPost.id]: (currentTime / duration) * 100
                    }));
                  } else {
                    clearInterval(interval);
                  }
                }, 1000);
              }
            }
          }
        }).then(player => {
          youtubePlayers.current[currentPost.id] = player;
        }).catch(error => {
          console.error('Failed to create YouTube player:', error);
        });
      } else {
        // Player exists, play it
        const player = youtubePlayers.current[currentPost.id];
        if (player && typeof player.playVideo === 'function') {
          player.playVideo();
        }
      }

      // Pause other YouTube videos
      Object.entries(youtubePlayers.current).forEach(([id, player]) => {
        if (id !== currentPost.id && player && typeof player.pauseVideo === 'function') {
          player.pauseVideo();
        }
      });
    }).catch(error => {
      console.error('Failed to import YouTube API utility:', error);
    });
  }, [reels, currentIndex, youtubeAPILoaded, muted]);

  const toggleFollow = useCallback(async (authorId?: string) => {
    if (!authorId) return;
    setFollowing((prev) => ({ ...prev, [authorId]: !prev[authorId] }));
    try {
      await fetch(`/api/social/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authorId }),
      });
      setToast({ id: Date.now(), msg: `Updated follow status` });
    } catch {
      // revert on failure
      setFollowing((prev) => ({ ...prev, [authorId]: !prev[authorId] }));
      setToast({ id: Date.now(), msg: `Failed to update follow` });
    }
  }, []);

  const loadPage = useCallback(async (p: number) => {
    if (!session?.user?.id) return;
    const limit = 10;
    try {
      if (p === 1) setLoading(true);
      setError("");
      const params = new URLSearchParams({ limit: String(limit), type: "reel", page: String(p) });
      const res = await fetch(`/api/social/posts?${params.toString()}`);
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || "Failed to load reels");
      const newPosts: ReelPost[] = data.posts || [];
      setHasMore(newPosts.length >= limit);
      setReels(prev => (p === 1 ? newPosts : [...prev, ...newPosts]));
      setPage(p);
    } catch (e: any) {
      setError(e.message || "Failed to load reels");
      setHasMore(false);
    } finally {
      if (p === 1) setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  // Infinite scroll observer
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && hasMore && !loading) {
          loadPage(page + 1);
        }
      });
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, page, loadPage]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLDivElement;
          const vid = target.querySelector("video") as HTMLVideoElement | null;
          if (!vid) return;
          const idx = Number(target.getAttribute("data-index"));
          if (entry.isIntersecting && entry.intersectionRatio > 0.8) {
            setCurrentIndex(idx);
            // resume position if we have it
            const postId = target.getAttribute("data-id");
            if (postId && resumeSecondsRef.current[postId] && !isNaN(resumeSecondsRef.current[postId])) {
              try { vid.currentTime = resumeSecondsRef.current[postId]; } catch {}
            }
            vid.play().catch(() => {});
          } else {
            // store resume time when leaving
            const postId = target.getAttribute("data-id");
            if (postId) {
              resumeSecondsRef.current[postId] = vid.currentTime || 0;
            }
            vid.pause();
          }
        });
      },
      { threshold: [0, 0.5, 0.8, 1] }
    );

    const children = containerRef.current.querySelectorAll("[data-reel-item]");
    children.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reels]);

  // Smooth scroll to index helper
  const scrollToIndex = useCallback((idx: number) => {
    if (!containerRef.current) return;
    const item = containerRef.current.querySelector(`[data-reel-item][data-index="${idx}"]`) as HTMLElement | null;
    if (!item) return;
    item.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!reels.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(currentIndex + 1, reels.length - 1);
        scrollToIndex(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(currentIndex - 1, 0);
        scrollToIndex(prev);
      } else if (e.key.toLowerCase() === 'm') {
        setMuted(m => !m);
      } else if (e.key.toLowerCase() === 'l') {
        const post = reels[currentIndex];
        if (post) toggleLike(post);
      } else if (e.key.toLowerCase() === 'c') {
        const post = reels[currentIndex];
        if (post) openComments(post);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reels, currentIndex]);

  const playVideo = useCallback((postId: string) => {
    const video = videoRefs.current[postId];
    const youtubePlayer = youtubePlayers.current[postId];
    
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else if (youtubePlayer && typeof youtubePlayer.playVideo === 'function') {
      youtubePlayer.seekTo(0);
      youtubePlayer.playVideo();
    }
  }, []);

  const pauseVideo = useCallback((postId: string) => {
    const video = videoRefs.current[postId];
    const youtubePlayer = youtubePlayers.current[postId];
    
    if (video) {
      video.pause();
    } else if (youtubePlayer && typeof youtubePlayer.pauseVideo === 'function') {
      youtubePlayer.pauseVideo();
    }
  }, []);

  const parseVideoUrl = (url: string) => {
    if (!url) return null;
    
    // YouTube Shorts and regular YouTube detection
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return {
        platform: 'youtube',
        videoId,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        originalUrl: url
      };
    }
    
    // Instagram Reels detection (improved to handle query parameters)
    const instagramPatterns = [
      /(?:www\.)?instagram\.com\/reel\/([a-zA-Z0-9_-]+)(?:\?.*)?/,
      /(?:www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+)(?:\?.*)?/,
      /(?:www\.)?instagram\.com\/tv\/([a-zA-Z0-9_-]+)(?:\?.*)?/
    ];
    
    for (const pattern of instagramPatterns) {
      const match = url.match(pattern);
      if (match) {
        const videoId = match[1];
        // Multiple Instagram thumbnail strategies
        const thumbnailStrategies = [
          `https://www.instagram.com/p/${videoId}/media/?size=l`,
          `https://scontent.cdninstagram.com/v/t51.2885-15/e35/${videoId}_n.jpg`,
          `https://instagram.com/p/${videoId}/media/?size=m`
        ];
        
        return {
          platform: 'instagram',
          videoId: videoId,
          embedUrl: `https://www.instagram.com/p/${videoId}/embed/`,
          thumbnail: thumbnailStrategies[0], // Primary strategy
          thumbnailFallbacks: thumbnailStrategies.slice(1), // Backup strategies
          originalUrl: url
        };
      }
    }
    
    // TikTok detection (improved patterns)
    const tiktokPatterns = [
      /(?:www\.)?tiktok\.com\/@[^/]+\/video\/(\d+)/,
      /(?:vm|vt)\.tiktok\.com\/([a-zA-Z0-9]+)/,
      /tiktok\.com.*\/(\d+)/
    ];
    
    for (const pattern of tiktokPatterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          platform: 'tiktok',
          videoId: match[1],
          embedUrl: url,
          thumbnail: null,
          originalUrl: url
        };
      }
    }
    
    // Direct video URL
    if (url.match(/\.(mp4|webm|mov|avi|m4v)$/i)) {
      return {
        platform: 'direct',
        embedUrl: url,
        thumbnail: null,
        originalUrl: url
      };
    }
    
    return null;
  };

  const handleVideoUrlChange = (url: string) => {
    setUploadForm(prev => ({ ...prev, videoUrl: url }));
    
    const parsed = parseVideoUrl(url);
    if (parsed) {
      setVideoPreview({
        type: parsed.platform,
        embedUrl: parsed.embedUrl,
        thumbnail: parsed.thumbnail
      });
      
      // Auto-set cover image for YouTube and Instagram
      if ((parsed.platform === 'youtube' || parsed.platform === 'instagram') && parsed.thumbnail && !uploadForm.coverUrl) {
        setUploadForm(prev => ({ ...prev, coverUrl: parsed.thumbnail || '', platform: parsed.platform }));
      } else {
        setUploadForm(prev => ({ ...prev, platform: parsed.platform }));
      }
    } else {
      setVideoPreview(null);
      setUploadForm(prev => ({ ...prev, platform: 'direct' }));
    }
  };

  const handleUploadReel = async () => {
    if (!uploadForm.content.trim() || !uploadForm.videoUrl.trim()) {
      setToast({ id: Date.now(), msg: 'Content and video URL are required' });
      return;
    }
    setUploading(true);
    try {
      // Prepare reel data with platform info
      const reelData = {
        type: 'reel',
        content: uploadForm.content,
        videoUrl: uploadForm.videoUrl,
        coverUrl: uploadForm.coverUrl || null,
        reelMeta: {
          platform: uploadForm.platform,
          embedUrl: videoPreview?.embedUrl,
          originalUrl: uploadForm.videoUrl
        }
      };
      
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reelData),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ id: Date.now(), msg: 'Reel uploaded successfully!' });
        setShowUploadModal(false);
        setUploadForm({ content: '', videoUrl: '', coverUrl: '', platform: 'direct' });
        setVideoPreview(null);
        loadPage(1); // Refresh reels
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (e: any) {
      setToast({ id: Date.now(), msg: e.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  // Auto-play current video when index changes
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < reels.length) {
      // Pause all first
      Object.values(videoRefs.current).forEach(video => {
        if (video) video.pause();
      });
      Object.values(youtubePlayers.current).forEach(player => {
        if (player && player.pauseVideo) player.pauseVideo();
      });

      // Play current
      const currentPost = reels[currentIndex];
      if (currentPost) {
        playVideo(currentPost.id);
      }
    }
  }, [currentIndex, reels, playVideo]);

  // Touch navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const onTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0]?.clientY ?? null;
      touchDeltaYRef.current = 0;
    };
    
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current == null) return;
      touchDeltaYRef.current = (e.touches[0]?.clientY ?? 0) - touchStartYRef.current;
    };
    
    const onTouchEnd = () => {
      if (touchStartYRef.current == null) return;
      const threshold = 60; // px to trigger navigation
      if (touchDeltaYRef.current < -threshold) {
        const next = Math.min(currentIndex + 1, reels.length - 1);
        scrollToIndex(next);
      } else if (touchDeltaYRef.current > threshold) {
        const prev = Math.max(currentIndex - 1, 0);
        scrollToIndex(prev);
      }
      touchStartYRef.current = null;
      touchDeltaYRef.current = 0;
    };
    
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    
    return () => {
      el.removeEventListener('touchstart', onTouchStart as any);
      el.removeEventListener('touchmove', onTouchMove as any);
      el.removeEventListener('touchend', onTouchEnd as any);
    };
  }, [currentIndex, reels, scrollToIndex]);

  // Deep link by id (?id=...) on initial load
  useEffect(() => {
    const id = searchParams?.get('id');
    if (!id || !reels.length) return;
    const idx = reels.findIndex(r => r.id === id);
    if (idx >= 0) {
      // slight delay to ensure layout
      setTimeout(() => scrollToIndex(idx), 50);
    }
  }, [searchParams, reels, scrollToIndex]);

  // Persist mute setting
  useEffect(() => {
    try {
      const saved = localStorage.getItem("reels_muted");
      if (saved != null) setMuted(saved === "1");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("reels_muted", muted ? "1" : "0");
    } catch {}
  }, [muted]);

  const toggleMute = () => setMuted((m) => !m);

  const onTimeUpdate = (postId: string) => {
    const v = videoRefs.current[postId];
    if (!v || !v.duration) return;
    setProgress((p) => ({ ...p, [postId]: (v.currentTime / v.duration) * 100 }));
  };

  const handleDoubleTapLike = async (post: ReelPost) => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 300) {
      // double tap detected
      await toggleLike(post);
    }
    lastTapTimeRef.current = now;
  };

  const toggleLike = useCallback(async (post: ReelPost) => {
    if (!session?.user?.id) return;
    const newLiked = !post.isLiked;
    // Optimistic update
    setReels(prev => prev.map(p => p.id === post.id ? { ...p, isLiked: newLiked, likes: (p.likes || 0) + (newLiked ? 1 : -1) } : p));
    try {
      await fetch(`/api/social/posts/${post.id}/like`, { method: 'POST' });
    } catch {
      // Revert on failure
      setReels(prev => prev.map(p => p.id === post.id ? { ...p, isLiked: !newLiked, likes: (p.likes || 0) + (newLiked ? -1 : 1) } : p));
    }
  }, [session?.user?.id]);

  const openComments = useCallback(async (post: ReelPost) => {
    setIsCommentsOpen(true);
    setActivePostId(post.id);
    setCommentLoading(true);
    try {
      const res = await fetch(`/api/social/posts/${post.id}/comments`);
      const data = await res.json();
      setComments(data?.comments || []);
    } catch {
      setComments([]);
    } finally {
      setCommentLoading(false);
    }
  }, []);

  const submitComment = async () => {
    if (!activePostId || !commentText.trim()) return;
    const text = commentText.trim();
    setCommentText("");
    try {
      const res = await fetch(`/api/social/posts/${activePostId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (res.ok && data?.comment) {
        setComments((c) => [data.comment, ...c]);
        // also bump comment count in list
        setReels((prev) => prev.map((p) => (p.id === activePostId ? { ...p, comments: p.comments + 1 } : p)));
      }
    } catch {}
  };

  if (!session?.user?.id) {
    return (
      <div className="p-4">
        <Card className="p-6">
          <p className="text-sm">Please sign in to view Reels.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] bg-black text-white">
      <div className="absolute top-3 left-3 z-20">
        <Link href="/social" className="inline-flex items-center gap-2 text-white">
          <ArrowLeft className="h-5 w-5" /> Back
        </Link>
      </div>

      <div className="absolute top-3 right-3 z-20 flex items-center space-x-2">
        <Button variant="secondary" size="sm" onClick={() => setShowUploadModal(true)} className="bg-white/20 hover:bg-white/30 text-white">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={toggleMute} className="bg-white/20 hover:bg-white/30 text-white">
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>

      {loading ? (
        <div className="h-full w-full flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-400">{error}</div>
      ) : reels.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/80">
          <p className="text-lg font-semibold">No Reels yet</p>
          <p className="text-sm mt-1">Be the first to create a Reel from the Social page.</p>
        </div>
      ) : (
        <div ref={containerRef} className="h-full w-full overflow-y-scroll snap-y snap-mandatory">
          {reels.map((post, idx) => (
            <div
              key={post.id}
              data-reel-item
              data-id={post.id}
              data-index={idx}
              className="h-[100dvh] w-full flex items-center justify-center snap-start relative"
            >
              <div className="relative w-full max-w-[480px] h-full">
                {/* Top progress bar for active item */}
                {currentIndex === idx && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 z-20">
                    <div
                      className="h-full bg-white/90 transition-[width] duration-100 linear"
                      style={{ width: `${Math.min(100, Math.max(0, progress[post.id] || 0))}%` }}
                    />
                  </div>
                )}
                {/* Render video based on platform */}
                {(() => {
                  const reelMeta = post.reelMeta;
                  const platform = reelMeta?.platform || 'direct';
                  
                  if (platform === 'youtube') {
                    const videoId = post.videoUrl?.match(/(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1];
                    const isCurrentVideo = currentIndex === idx;
                    
                    return (
                      <div 
                        id={`youtube-player-${post.id}`}
                        className="h-full w-full bg-black"
                        onClick={() => handleDoubleTapLike(post)}
                      />
                    );
                  } else if (platform === 'instagram') {
                    // Instagram Reel display with enhanced UX
                    const videoId = reelMeta?.videoId;
                    return (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 relative">
                        {/* Background pattern for visual interest */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="w-full h-full" style={{
                            backgroundImage: 'radial-gradient(circle at 25% 25%, white 2px, transparent 2px)',
                            backgroundSize: '50px 50px'
                          }} />
                        </div>
                        
                        <div className="text-center p-6 relative z-10">
                          <div className="mb-6">
                            <div className="relative animate-pulse">
                              <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                                <Video className="h-12 w-12 text-white" />
                              </div>
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-sm font-bold text-purple-600">IG</span>
                              </div>
                            </div>
                          </div>
                          
                          <h3 className="text-white text-2xl font-bold mb-2">Instagram Reel</h3>
                          <p className="text-white/90 text-sm mb-2 font-medium">by {post.author?.name || 'User'}</p>
                          <p className="text-white/70 text-sm mb-6 max-w-sm mx-auto leading-relaxed">{post.content}</p>
                          
                          <div className="space-y-3">
                            <p className="text-white/60 text-xs">Instagram videos open in the Instagram app for the best experience</p>
                            <a 
                              href={post.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 font-bold text-lg shadow-xl"
                            >
                              <Play className="h-6 w-6" />
                              Open in Instagram
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (platform === 'tiktok') {
                    // Enhanced TikTok display with better UX
                    const videoId = reelMeta?.videoId;
                    return (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-pink-900 via-purple-900 to-black relative">
                        {/* TikTok-style background pattern */}
                        <div className="absolute inset-0 opacity-5">
                          <div className="w-full h-full" style={{
                            backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                            backgroundSize: '20px 20px',
                            animation: 'slide 3s linear infinite'
                          }} />
                        </div>
                        
                        <div className="text-center p-6 relative z-10">
                          <div className="mb-6">
                            <div className="relative">
                              <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500">
                                <Video className="h-12 w-12 text-white" />
                              </div>
                              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-sm font-bold text-pink-600">TT</span>
                              </div>
                            </div>
                          </div>
                          
                          <h3 className="text-white text-2xl font-bold mb-2">TikTok Video</h3>
                          <p className="text-white/90 text-sm mb-2 font-medium">by {post.author?.name || 'User'}</p>
                          <p className="text-white/70 text-sm mb-6 max-w-sm mx-auto leading-relaxed">{post.content}</p>
                          
                          <div className="space-y-3">
                            <p className="text-white/60 text-xs">TikTok videos open in the TikTok app for the full experience</p>
                            <a 
                              href={post.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-2xl hover:from-pink-700 hover:to-purple-700 transition-all transform hover:scale-105 font-bold text-lg shadow-xl"
                            >
                              <Play className="h-6 w-6" />
                              Open in TikTok
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  
                  } else {
                    // Direct video URL
                    return (
                      <video
                        ref={(el) => {
                          videoRefs.current[post.id] = el;
                        }}
                        src={post.videoUrl}
                        poster={post.coverUrl || undefined}
                        className="h-full w-full object-cover"
                        playsInline
                        loop
                        muted={muted}
                        controls={false}
                        onTimeUpdate={() => onTimeUpdate(post.id)}
                        onClick={() => handleDoubleTapLike(post)}
                      />
                    );
                  }
                })()}

                {/* Overlay UI */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/40" />
                {/* Author block */}
                <div className="absolute bottom-24 left-3 right-20 flex flex-col gap-2 pointer-events-none">
                  <div className="flex items-center gap-3 pointer-events-auto">
                    {post.author?.id ? (
                      <Link href={`/social/profile/${post.author.id}`} className="shrink-0">
                        <img
                          src={post.author?.avatar || '/api/placeholder/40/40'}
                          alt={post.author?.name || 'User'}
                          className="h-9 w-9 rounded-full object-cover border border-white/20"
                        />
                      </Link>
                    ) : (
                      <img
                        src={post.author?.avatar || '/api/placeholder/40/40'}
                        alt={post.author?.name || 'User'}
                        className="h-9 w-9 rounded-full object-cover border border-white/20"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      {post.author?.id ? (
                        <Link href={`/social/profile/${post.author.id}`} className="block">
                          <div className="text-sm font-semibold truncate">{post.author?.name || "Anonymous"}</div>
                          {post.author?.username && (
                            <div className="text-xs text-white/80 truncate">@{post.author.username}</div>
                          )}
                        </Link>
                      ) : (
                        <>
                          <div className="text-sm font-semibold truncate">{post.author?.name || "Anonymous"}</div>
                          {post.author?.username && (
                            <div className="text-xs text-white/80 truncate">@{post.author.username}</div>
                          )}
                        </>
                      )}
                    </div>
                    {post.author?.id && (
                      <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white"
                        onClick={() => toggleFollow(post.author!.id)}>
                        {following[post.author.id] ? 'Following' : 'Follow'}
                      </Button>
                    )}
                    <div className="relative">
                      <Button size="icon" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white"
                        onClick={() => setMenuOpenFor(m => (m === post.id ? null : post.id))}>
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                      {menuOpenFor === post.id && (
                        <div className="absolute right-0 mt-2 w-40 bg-white text-gray-800 rounded shadow-lg overflow-hidden z-30 pointer-events-auto">
                          <button className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm" onClick={() => {
                            navigator.clipboard?.writeText(`${location.origin}/social/reels?id=${post.id}`).catch(() => {});
                            setMenuOpenFor(null);
                            setToast({ id: Date.now(), msg: 'Link copied' });
                          }}>Copy link</button>
                          <button className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm" onClick={() => {
                            setReels(prev => prev.filter(r => r.id !== post.id));
                            setMenuOpenFor(null);
                            setToast({ id: Date.now(), msg: 'Reel hidden' });
                          }}>Hide this reel</button>
                          <button className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm" onClick={() => {
                            setReportOpenFor(post.id);
                            setMenuOpenFor(null);
                          }}>Report</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm opacity-90 line-clamp-3 pointer-events-auto">{post.content}</div>
                </div>

                {/* Action buttons on the right */}
                <div className="absolute bottom-24 right-4 flex flex-col space-y-4">
                  {/* Like Button */}
                  <button 
                    onClick={() => toggleLike(post)}
                    className="flex flex-col items-center space-y-1 group"
                  >
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                      <Heart className={`h-6 w-6 ${post.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </div>
                    <span className="text-xs font-medium">{post.likes || 0}</span>
                  </button>

                  {/* Comment Button */}
                  <button 
                    onClick={() => openComments(post)}
                    className="flex flex-col items-center space-y-1 group"
                  >
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-medium">{post.comments || 0}</span>
                  </button>

                  {/* Share Button */}
                  <button className="flex flex-col items-center space-y-1 group">
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                      <Share2 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-medium">{post.shares || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments Overlay */}
      {isCommentsOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 flex items-end justify-center">
          <div className="w-full max-w-[600px] bg-white rounded-t-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="font-semibold">Comments</div>
              <button className="p-1" onClick={() => setIsCommentsOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-3 space-y-3">
              {commentLoading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-gray-500">No comments yet</div>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="text-sm">
                    <div className="font-medium">{c.author?.name || 'User'}</div>
                    <div className="text-gray-700">{c.content}</div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input
                type="text"
                className="flex-1 border rounded px-3 py-2 text-sm"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitComment();
                }}
              />
              <Button onClick={submitComment}>Post</Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportOpenFor && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="font-semibold">Report Reel</div>
              <button className="p-1" onClick={() => setReportOpenFor(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-3 space-y-3">
              <div className="text-sm text-gray-700">Tell us why you are reporting this reel:</div>
              <textarea className="w-full border rounded p-2 text-sm min-h-[100px]" value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Optional reason (spam, inappropriate, etc.)" />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setReportOpenFor(null)}>Cancel</Button>
                <Button onClick={async () => {
                  try {
                    await fetch('/api/social/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: reportOpenFor, reason: reportReason }) });
                    setToast({ id: Date.now(), msg: 'Report submitted' });
                    setReportReason('');
                    setReportOpenFor(null);
                  } catch {
                    setToast({ id: Date.now(), msg: 'Failed to submit report' });
                  }
                }}>Submit</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload Reel</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-full hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={uploadForm.content}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Describe your reel..."
                  className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Video URL</label>
                <input
                  type="url"
                  value={uploadForm.videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="YouTube Shorts, TikTok, Instagram Reels, or direct video URL"
                  className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Supports: YouTube Shorts, TikTok videos, Instagram Reels, or direct .mp4/.webm links
                </p>
                {videoPreview && (
                  <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
                    <span className="text-green-400">✓ Detected: </span>
                    <span className="capitalize">{videoPreview.type}</span> video
                    {videoPreview.type === 'youtube' && ' (YouTube Short) - Plays directly'}
                    {videoPreview.type === 'tiktok' && ' (TikTok) - Opens in TikTok app'}
                    {videoPreview.type === 'instagram' && ' (Instagram Reel) - Opens in Instagram app'}
                    {videoPreview.thumbnail && (
                      <div className="mt-2">
                        <span className="text-blue-400"> • Auto-thumbnail generated</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cover Image URL (optional)</label>
                <input
                  type="url"
                  value={uploadForm.coverUrl}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, coverUrl: e.target.value }))}
                  placeholder="Auto-filled for YouTube & Instagram, or paste custom thumbnail"
                  className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
                {videoPreview?.thumbnail && (
                  <div className="mt-2">
                    <img 
                      src={videoPreview.thumbnail} 
                      alt="Video thumbnail" 
                      className="w-20 h-12 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        // For Instagram, try alternative thumbnail approach
                        if (videoPreview.type === 'instagram') {
                          console.log('Instagram thumbnail failed, using fallback');
                        }
                      }}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Auto-generated thumbnail
                      {videoPreview.type === 'instagram' && ' (Instagram)'}
                      {videoPreview.type === 'youtube' && ' (YouTube)'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadReel}
                  disabled={uploading || !uploadForm.content.trim() || !uploadForm.videoUrl.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded bg-black/80 text-white text-sm shadow">
            {toast.msg}
          </div>
        </div>
      )}
      {/* Sentinel for infinite scroll */}
      <div ref={loadMoreRef} className="h-1 w-full" />
    </div>
  );
}

export default function ReelsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ReelsPageContent />
    </Suspense>
  );
}
