'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  MessageCircle, 
  Gift, 
  ClipboardList, 
  DollarSign,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminMorePage() {
  const router = useRouter();

  const adminFeatures = [
    {
      title: 'Social Platform',
      description: 'Manage social platform users, posts, and reports',
      icon: MessageCircle,
      href: '/admin/social-platform',
      color: 'text-blue-600'
    },
    {
      title: 'Vouchers',
      description: 'Create and manage Rs 500 product vouchers',
      icon: Gift,
      href: '/admin/vouchers',
      color: 'text-green-600'
    },
    {
      title: 'Tasks',
      description: 'Manage content engagement tasks and rewards',
      icon: ClipboardList,
      href: '/admin/tasks',
      color: 'text-purple-600'
    },
    {
      title: 'Withdrawals',
      description: 'Process user withdrawal requests',
      icon: DollarSign,
      href: '/admin/withdrawals',
      color: 'text-orange-600'
    },
    {
      title: 'Commission Settings',
      description: 'Configure 5-level partnership program rates',
      icon: Settings,
      href: '/admin/commission-settings',
      color: 'text-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">More Admin Features</h1>
          <p className="text-gray-600 mt-1">Access all administrative tools</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-8 w-8 ${feature.color}`} />
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>All admin features are now mobile-responsive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Navigation</span>
              <span className="text-green-600">Mobile-optimized</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Layout</span>
              <span className="text-green-600">Responsive</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Touch-friendly</span>
              <span className="text-green-600">Optimized</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Performance</span>
              <span className="text-green-600">Fast loading</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
