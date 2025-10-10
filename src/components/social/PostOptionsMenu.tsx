'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, Heart, HeartOff, Bookmark, BookmarkCheck,
  Bell, BellOff, EyeOff, UserX, Flag, Trash2, Pencil,
  Pin, PinOff, Users, Globe, Lock, Clock, Archive,
  Share, Copy, Download, Settings, AlertTriangle, CalendarDays
} from 'lucide-react';

interface PostOptionsMenuProps {
  postId: string;
  isOwner: boolean;
  isFollowing?: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  isPinned?: boolean;
  isNotificationsOn?: boolean;
  authorName?: string;
  onAction: (action: string, data?: any) => void;
}

interface OptionItem {
  icon: any;
  label: string;
  description: string;
  action: string;
  destructive?: boolean;
  show?: boolean;
}

export default function PostOptionsMenu({ 
  postId, 
  isOwner, 
  isFollowing = false,
  isLiked = false,
  isSaved = false,
  isPinned = false,
  isNotificationsOn = true,
  authorName = 'User',
  onAction 
}: PostOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: string, data?: any) => {
    onAction(action, { postId, ...data });
    setIsOpen(false);
  };

  // Options for post viewers (not owners)
  const viewerOptions: OptionItem[] = [
    {
      icon: isLiked ? HeartOff : Heart,
      label: isLiked ? 'Not interested' : 'Interested',
      description: isLiked ? 'Less of your posts will be like this.' : 'More of your posts will be like this.',
      action: 'toggle-interest'
    },
    {
      icon: isSaved ? BookmarkCheck : Bookmark,
      label: isSaved ? 'Unsave post' : 'Save post',
      description: 'Add this to your saved items.',
      action: 'toggle-save'
    },
    {
      icon: isNotificationsOn ? BellOff : Bell,
      label: isNotificationsOn ? 'Turn off notifications for this post' : 'Turn on notifications for this post',
      description: '',
      action: 'toggle-notifications'
    },
    {
      icon: EyeOff,
      label: 'Hide post',
      description: 'See fewer posts like this.',
      action: 'hide-post'
    },
    {
      icon: Clock,
      label: `Snooze ${authorName} for 30 days`,
      description: 'Temporarily stop seeing posts.',
      action: 'snooze-user'
    },
    {
      icon: UserX,
      label: `Unfollow ${authorName}`,
      description: 'Stop seeing posts but stay friends.',
      action: 'unfollow-user',
      show: isFollowing
    },
    {
      icon: Flag,
      label: 'Report post',
      description: `We won't let ${authorName} know who reported this.`,
      action: 'report-post',
      destructive: true
    },
    {
      icon: AlertTriangle,
      label: `Block ${authorName}'s profile`,
      description: "You won't be able to see or contact each other.",
      action: 'block-user',
      destructive: true
    }
  ];

  // Options for post owners
  const ownerOptions: OptionItem[] = [
    {
      icon: isPinned ? PinOff : Pin,
      label: isPinned ? 'Unpin post' : 'Pin post',
      description: '',
      action: 'toggle-pin'
    },
    {
      icon: isSaved ? BookmarkCheck : Bookmark,
      label: isSaved ? 'Unsave post' : 'Save post',
      description: 'Add this to your saved items.',
      action: 'toggle-save'
    },
    {
      icon: Pencil,
      label: 'Edit post',
      description: '',
      action: 'edit-post'
    },
    {
      icon: Users,
      label: 'Edit audience',
      description: '',
      action: 'edit-audience'
    },
    {
      icon: isNotificationsOn ? BellOff : Bell,
      label: isNotificationsOn ? 'Turn off notifications for this post' : 'Turn on notifications for this post',
      description: '',
      action: 'toggle-notifications'
    },
    {
      icon: Share,
      label: 'Share partnership ad code',
      description: '',
      action: 'share-ad-code'
    },
    {
      icon: Globe,
      label: 'Turn off translations',
      description: '',
      action: 'toggle-translations'
    },
    {
      icon: CalendarDays,
      label: 'Edit date',
      description: '',
      action: 'edit-date'
    },
    {
      icon: Archive,
      label: 'Move to archive',
      description: '',
      action: 'archive-post'
    },
    {
      icon: Trash2,
      label: 'Move to trash',
      description: 'Items in your trash are deleted after 30 days.',
      action: 'delete-post',
      destructive: true
    }
  ];

  const options = isOwner ? ownerOptions : viewerOptions;

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
            {options.map((option, index) => {
              if (option.show === false) return null;
              
              const Icon = option.icon;
              const isDestructive = option.destructive;
              
              return (
                <div key={option.action}>
                  <button
                    onClick={() => handleAction(option.action)}
                    className={`w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors ${
                      isDestructive ? 'text-red-600 hover:bg-red-50' : 'text-gray-900'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      isDestructive ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </button>
                  {((index === 2 || index === 5) && !isOwner) || ((index === 2 || index === 7) && isOwner) ? (
                    <div className="border-t border-gray-200 mx-3" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
