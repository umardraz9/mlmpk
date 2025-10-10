'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Star, Award } from 'lucide-react';

interface Author {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  verified: boolean;
  level: number;
}

interface BlogAuthorCardProps {
  author: Author;
}

export default function BlogAuthorCard({ author }: BlogAuthorCardProps) {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback className="text-lg font-semibold">
              {author.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{author.name}</h3>
              {author.verified && (
                <Badge className="bg-blue-500 text-white text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              <Badge className="bg-yellow-500 text-white text-xs">
                <Award className="h-3 w-3 mr-1" />
                Level {author.level}
              </Badge>
            </div>
            
            <p className="text-gray-700 mb-4 leading-relaxed">{author.bio}</p>
            
            <div className="flex items-center gap-4">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Users className="h-4 w-4 mr-2" />
                Follow
              </Button>
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 