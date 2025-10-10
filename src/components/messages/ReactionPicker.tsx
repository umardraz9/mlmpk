'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Heart, 
  ThumbsUp, 
  ThumbsDown, 
  Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ReactionPickerProps {
  onReactionSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
  className?: string;
  position?: 'top' | 'bottom';
}

// Comprehensive reaction categories like WhatsApp
const REACTION_CATEGORIES = {
  quick: {
    name: 'Quick Reactions',
    reactions: [
      { emoji: '👍', name: 'Like', icon: ThumbsUp },
      { emoji: '👎', name: 'Dislike', icon: ThumbsDown },
      { emoji: '❤️', name: 'Love', icon: Heart },
      { emoji: '😂', name: 'Laugh' },
      { emoji: '😮', name: 'Wow' },
      { emoji: '😢', name: 'Sad' },
      { emoji: '😡', name: 'Angry' },
      { emoji: '🔥', name: 'Fire' },
      { emoji: '💯', name: '100' },
      { emoji: '🎉', name: 'Party' }
    ]
  },
  emotions: {
    name: 'Emotions',
    reactions: [
      { emoji: '😀', name: 'Happy' },
      { emoji: '😃', name: 'Grin' },
      { emoji: '😄', name: 'Smile' },
      { emoji: '😁', name: 'Beam' },
      { emoji: '😆', name: 'Laugh' },
      { emoji: '😅', name: 'Sweat' },
      { emoji: '😂', name: 'Joy' },
      { emoji: '🤣', name: 'Rofl' },
      { emoji: '😊', name: 'Blush' },
      { emoji: '😇', name: 'Innocent' },
      { emoji: '🙂', name: 'Slight Smile' },
      { emoji: '🙃', name: 'Upside Down' },
      { emoji: '😉', name: 'Wink' },
      { emoji: '😌', name: 'Relieved' },
      { emoji: '😍', name: 'Heart Eyes' },
      { emoji: '🥰', name: 'Smiling Hearts' },
      { emoji: '😘', name: 'Kiss' },
      { emoji: '😗', name: 'Kissing' },
      { emoji: '😙', name: 'Kiss Smile' },
      { emoji: '😚', name: 'Kiss Closed' },
      { emoji: '😋', name: 'Yum' },
      { emoji: '😛', name: 'Tongue' },
      { emoji: '😝', name: 'Squint Tongue' },
      { emoji: '😜', name: 'Wink Tongue' }
    ]
  },
  gestures: {
    name: 'Hand Gestures',
    reactions: [
      { emoji: '👍', name: 'Thumbs Up' },
      { emoji: '👎', name: 'Thumbs Down' },
      { emoji: '👌', name: 'OK' },
      { emoji: '✌️', name: 'Victory' },
      { emoji: '🤞', name: 'Crossed Fingers' },
      { emoji: '🤟', name: 'Love You' },
      { emoji: '🤘', name: 'Rock On' },
      { emoji: '🤙', name: 'Call Me' },
      { emoji: '👈', name: 'Point Left' },
      { emoji: '👉', name: 'Point Right' },
      { emoji: '👆', name: 'Point Up' },
      { emoji: '👇', name: 'Point Down' },
      { emoji: '☝️', name: 'Index Up' },
      { emoji: '✋', name: 'Raised Hand' },
      { emoji: '🤚', name: 'Raised Back' },
      { emoji: '🖐️', name: 'Hand Splayed' },
      { emoji: '🖖', name: 'Vulcan' },
      { emoji: '👋', name: 'Wave' },
      { emoji: '🤏', name: 'Pinch' },
      { emoji: '💪', name: 'Muscle' },
      { emoji: '🙏', name: 'Pray' },
      { emoji: '👏', name: 'Clap' },
      { emoji: '🤝', name: 'Handshake' },
      { emoji: '👐', name: 'Open Hands' }
    ]
  },
  hearts: {
    name: 'Hearts & Love',
    reactions: [
      { emoji: '❤️', name: 'Red Heart' },
      { emoji: '🧡', name: 'Orange Heart' },
      { emoji: '💛', name: 'Yellow Heart' },
      { emoji: '💚', name: 'Green Heart' },
      { emoji: '💙', name: 'Blue Heart' },
      { emoji: '💜', name: 'Purple Heart' },
      { emoji: '🖤', name: 'Black Heart' },
      { emoji: '🤍', name: 'White Heart' },
      { emoji: '🤎', name: 'Brown Heart' },
      { emoji: '💔', name: 'Broken Heart' },
      { emoji: '❣️', name: 'Heart Exclamation' },
      { emoji: '💕', name: 'Two Hearts' },
      { emoji: '💞', name: 'Revolving Hearts' },
      { emoji: '💓', name: 'Beating Heart' },
      { emoji: '💗', name: 'Growing Heart' },
      { emoji: '💖', name: 'Sparkling Heart' },
      { emoji: '💘', name: 'Heart Arrow' },
      { emoji: '💝', name: 'Heart Gift' },
      { emoji: '💟', name: 'Heart Decoration' },
      { emoji: '♥️', name: 'Heart Suit' },
      { emoji: '💋', name: 'Kiss Mark' },
      { emoji: '💌', name: 'Love Letter' }
    ]
  },
  symbols: {
    name: 'Symbols & Objects',
    reactions: [
      { emoji: '🔥', name: 'Fire' },
      { emoji: '💯', name: 'Hundred' },
      { emoji: '⭐', name: 'Star' },
      { emoji: '🌟', name: 'Glowing Star' },
      { emoji: '✨', name: 'Sparkles' },
      { emoji: '💫', name: 'Dizzy' },
      { emoji: '⚡', name: 'Lightning' },
      { emoji: '💥', name: 'Boom' },
      { emoji: '💢', name: 'Anger' },
      { emoji: '💦', name: 'Sweat Drops' },
      { emoji: '💨', name: 'Dash' },
      { emoji: '🎉', name: 'Party' },
      { emoji: '🎊', name: 'Confetti' },
      { emoji: '🎈', name: 'Balloon' },
      { emoji: '🎁', name: 'Gift' },
      { emoji: '🏆', name: 'Trophy' },
      { emoji: '🥇', name: 'Gold Medal' },
      { emoji: '🥈', name: 'Silver Medal' },
      { emoji: '🥉', name: 'Bronze Medal' },
      { emoji: '🎯', name: 'Target' },
      { emoji: '🎪', name: 'Circus' },
      { emoji: '🎭', name: 'Theater' },
      { emoji: '🎨', name: 'Art' },
      { emoji: '🎵', name: 'Music' }
    ]
  }
};

export const ReactionPicker: React.FC<ReactionPickerProps> = memo(({
  onReactionSelect,
  onClose,
  isOpen,
  className,
  position = 'top'
}) => {
  const [selectedCategory, setSelectedCategory] = useState('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredReactions = searchQuery
    ? Object.values(REACTION_CATEGORIES)
        .flatMap(category => category.reactions)
        .filter(reaction => 
          reaction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reaction.emoji.includes(searchQuery)
        )
    : REACTION_CATEGORIES[selectedCategory as keyof typeof REACTION_CATEGORIES]?.reactions || [];

  const handleReactionClick = (emoji: string) => {
    onReactionSelect(emoji);
    onClose();
  };

  return (
    <div className={cn(
      "absolute z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
      "rounded-xl shadow-2xl overflow-hidden min-w-80 max-w-96",
      position === 'top' ? "bottom-12" : "top-12",
      "left-1/2 transform -translate-x-1/2",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">Add Reaction</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={searchInputRef}
            placeholder="Search reactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {Object.entries(REACTION_CATEGORIES).map(([key, category]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className={cn(
                "flex-shrink-0 px-3 py-2 text-xs rounded-none border-b-2 border-transparent whitespace-nowrap",
                selectedCategory === key 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}

      {/* Reactions Grid */}
      <div className="max-h-64 overflow-y-auto p-3">
        {filteredReactions.length > 0 ? (
          <div className="grid grid-cols-6 gap-2">
            {filteredReactions.map((reaction, index) => {
              const IconComponent = reaction.icon;
              
              return (
                <Button
                  key={`${reaction.emoji}-${index}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReactionClick(reaction.emoji)}
                  className="h-12 w-12 p-0 text-2xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-110 flex flex-col items-center justify-center group relative"
                  title={reaction.name}
                >
                  {IconComponent ? (
                    <IconComponent className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  ) : (
                    <span className="text-xl">{reaction.emoji}</span>
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {reaction.name}
                  </div>
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No reactions found for "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {/* Quick Access Footer */}
      {!searchQuery && selectedCategory === 'quick' && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Most Used:</span>
            {REACTION_CATEGORIES.quick.reactions.slice(0, 5).map((reaction) => (
              <Button
                key={reaction.emoji}
                variant="ghost"
                size="sm"
                onClick={() => handleReactionClick(reaction.emoji)}
                className="h-8 w-8 p-0 text-lg hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                title={reaction.name}
              >
                {reaction.emoji}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ReactionPicker.displayName = 'ReactionPicker';
