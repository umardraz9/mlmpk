'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  Gift, 
  Copy, 
  Share2, 
  UserPlus,
  Award,
  BarChart3,
  Eye,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface NetworkNode {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  avatar: string | null;
  isActive: boolean;
  role: string;
  referralCode: string;
  balance: number;
  totalEarnings: number;
  pendingCommission: number;
  referralCount: number;
  teamEarnings: number;
  children: NetworkNode[];
  level: number;
  joinedAt: string;
  lastActive: string;
}

interface ReferralStats {
  totalReferrals: number;
  directReferrals: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level4Count: number;
  level5Count: number;
  totalEarnings: number;
  level1Earnings: number;
  level2Earnings: number;
  level3Earnings: number;
  level4Earnings: number;
  level5Earnings: number;
  pendingCommissions: number;
  referralCode: string;
}

interface ReferralHistory {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  referredBy: string;
  level: number;
  status: 'active' | 'pending' | 'inactive';
  earnings: number;
  avatar?: string;
}

export default function UserMLMNetwork() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [networkData, setNetworkData] = useState<NetworkNode | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralHistory, setReferralHistory] = useState<ReferralHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('network');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchNetworkData();
      fetchReferralStats();
      fetchReferralHistory();
    }
  }, [status, router]);

  const fetchNetworkData = async () => {
    try {
      const response = await fetch('/api/user/mlm-network');
      const data = await response.json();
      setNetworkData(data);
    } catch (error) {
      console.error('Error fetching network data:', error);
    }
  };

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/user/referral-stats');
      const data = await response.json();
      setReferralStats(data);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
  };

  const fetchReferralHistory = async () => {
    try {
      const response = await fetch('/api/user/referral-history');
      const data = await response.json();
      setReferralHistory(data);
    } catch (error) {
      console.error('Error fetching referral history:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shareReferralLink = (code: string) => {
    const referralUrl = `${window.location.origin}/register?ref=${code}`;
    const text = `Join Partnership Program with my referral code: ${code} and start earning!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join Partnership Program',
        text: text,
        url: referralUrl,
      });
    } else {
      navigator.clipboard.writeText(`${text} ${referralUrl}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const renderNetworkNode = (node: NetworkNode, level: number = 0) => {
    const maxLevel = 5;
    const levelColors = [
      'bg-green-500',
      'bg-blue-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500'
    ];

    return (
      <div key={node.id} className={`${level > 0 ? 'ml-8 mt-4' : ''}`}>
        <Card className={`border-l-4 ${levelColors[level] || 'bg-gray-500'} border-opacity-50`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={node.avatar || undefined} />
                  <AvatarFallback className={`${levelColors[level]} text-white`}>
                    {node.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-gray-900">{node.name || 'Anonymous'}</div>
                  <div className="text-sm text-gray-600">{node.email}</div>
                  <Badge 
                    variant={node.isActive ? "default" : "secondary"}
                    className={node.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {node.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">PKR {node.totalEarnings}</div>
                <div className="text-sm text-gray-600">Total Earnings</div>
                <div className="text-sm font-medium text-blue-600">Level {node.level}</div>
              </div>
            </div>
            
            {node.children.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Direct Referrals: {node.children.length}
                </div>
                <div className="space-y-2">
                  {node.children.map(child => renderNetworkNode(child, level + 1))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My MLM Network</h1>
          <p className="text-gray-600">Track your referrals, earnings, and network growth</p>
        </div>

        {/* Stats Cards */}
        {referralStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                    <p className="text-2xl font-bold text-gray-900">{referralStats.totalReferrals}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Direct Referrals</p>
                    <p className="text-2xl font-bold text-gray-900">{referralStats.directReferrals}</p>
                  </div>
                  <UserPlus className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">PKR {referralStats.totalEarnings}</p>
                  </div>
                  <Wallet className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Referral Code</p>
                    <p className="text-lg font-bold text-gray-900">{referralStats.referralCode}</p>
                  </div>
                  <Gift className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyReferralCode(referralStats.referralCode)}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareReferralLink(referralStats.referralCode)}
                    className="text-xs"
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="network" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="network">Network Tree</TabsTrigger>
            <TabsTrigger value="referrals">Referral History</TabsTrigger>
            <TabsTrigger value="earnings">Earnings Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="space-y-6">
            {networkData && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Network Tree</CardTitle>
                  <CardDescription>Visual representation of your referral network</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderNetworkNode(networkData)}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Referral History</CardTitle>
                <CardDescription>All users who joined through your referral</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referralHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No referrals yet. Start sharing your code!</p>
                    </div>
                  ) : (
                    referralHistory.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={referral.avatar} />
                            <AvatarFallback>{referral.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{referral.name}</div>
                            <div className="text-sm text-gray-600">{referral.email}</div>
                            <div className="text-sm text-gray-500">Joined: {new Date(referral.joinedAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={referral.status === 'active' ? "default" : "secondary"}
                            className={referral.status === 'active' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {referral.status}
                          </Badge>
                          <div className="text-sm font-medium">Level {referral.level}</div>
                          <div className="text-sm text-green-600">PKR {referral.earnings}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            {referralStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Breakdown by Level</CardTitle>
                  <CardDescription>Detailed commission earnings from your network</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const earnings = referralStats[`level${level}Earnings` as keyof ReferralStats] as number;
                      const count = referralStats[`level${level}Count` as keyof ReferralStats] as number;
                      const percentage = [20, 15, 10, 8, 7][level - 1];
                      
                      return (
                        <div key={level} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Level {level} ({percentage}% commission)</span>
                            <span className="text-green-600 font-bold">PKR {earnings}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>{count} referrals</span>
                            <span>{count > 0 ? `${Math.round((earnings / (count * 1000)) * 100)}% effective rate` : 'No earnings'}</span>
                          </div>
                          <Progress value={Math.min((earnings / Math.max(referralStats.totalEarnings, 1)) * 100, 100)} className="h-2" />
                        </div>
                      );
                    })}
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center font-bold">
                        <span>Total Earnings</span>
                        <span className="text-green-600">PKR {referralStats.totalEarnings}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Pending Commissions</span>
                        <span className="text-orange-600">PKR {referralStats.pendingCommissions}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
