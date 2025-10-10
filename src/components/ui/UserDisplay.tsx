"use client";

import UserAvatar from '@/components/ui/UserAvatar';

interface UserDisplayProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showEmail?: boolean;
  className?: string;
}

export default function UserDisplay({
  user,
  size = 'md',
  showEmail = false,
  className = ''
}: UserDisplayProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <UserAvatar user={user} size={size} />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {user.name}
        </p>
        {showEmail && (
          <p className="text-sm text-gray-500 truncate">
            {user.email}
          </p>
        )}
      </div>
    </div>
  );
}
