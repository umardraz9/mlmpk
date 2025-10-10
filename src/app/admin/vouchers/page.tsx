'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Gift, 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Download,
  Upload,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';

interface Voucher {
  id: string;
  code: string;
  amount: number;
  type: 'welcome' | 'referral' | 'promotional' | 'loyalty' | 'compensation';
  status: 'active' | 'used' | 'expired' | 'cancelled';
  createdBy: string;
  usedBy?: string;
  user?: {
    username: string;
    email: string;
  };
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
  description?: string;
  minOrderAmount?: number;
  maxUsage?: number;
  currentUsage: number;
}

interface VoucherStats {
  totalVouchers: number;
  activeVouchers: number;
  usedVouchers: number;
  totalAmount: number;
  usedAmount: number;
  pendingAmount: number;
}

export default function VoucherManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [stats, setStats] = useState<VoucherStats>({
    totalVouchers: 0,
    activeVouchers: 0,
    usedVouchers: 0,
    totalAmount: 0,
    usedAmount: 0,
    pendingAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    amount: 500,
    type: 'promotional' as const,
    description: '',
    expiresAt: '',
    minOrderAmount: 0,
    maxUsage: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vouchersResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/vouchers'),
        fetch('/api/admin/vouchers/stats')
      ]);

      const [vouchersData, statsData] = await Promise.all([
        vouchersResponse.json(),
        statsResponse.json()
      ]);

      setVouchers(vouchersData.vouchers || []);
      setStats(statsData.stats || stats);
    } catch (error) {
      console.error('Error fetching voucher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoucher = async () => {
    try {
      const response = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVoucher)
      });

      if (response.ok) {
        fetchData();
        setShowCreateModal(false);
        setNewVoucher({
          amount: 500,
          type: 'promotional',
          description: '',
          expiresAt: '',
          minOrderAmount: 0,
          maxUsage: 1
        });
      }
    } catch (error) {
      console.error('Error creating voucher:', error);
    }
  };

  const handleVoucherAction = async (voucherId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/vouchers/${voucherId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error performing voucher action:', error);
    }
  };

  const generateVoucherCode = () => {
    const prefix = 'MLM';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
  };

  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || voucher.status === statusFilter;
    const matchesType = typeFilter === 'all' || voucher.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voucher Management</h1>
          <p className="text-gray-600">Manage Rs 500 vouchers and promotional codes</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Vouchers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVouchers}</div>
              <p className="text-xs text-gray-600">All vouchers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Vouchers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeVouchers}</div>
              <p className="text-xs text-gray-600">Available to use</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Used Vouchers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.usedVouchers}</div>
              <p className="text-xs text-gray-600">Already redeemed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
              <p className="text-xs text-gray-600">Total voucher value</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search vouchers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
                <SelectItem value="loyalty">Loyalty</SelectItem>
                <SelectItem value="compensation">Compensation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Voucher
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Voucher</DialogTitle>
                <DialogDescription>
                  Configure the details for the new voucher. Click create when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (PKR)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newVoucher.amount}
                      onChange={(e) => setNewVoucher({...newVoucher, amount: parseInt(e.target.value) || 0})}
                      placeholder="e.g., 500"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newVoucher.type}
                      onValueChange={(value) => setNewVoucher({...newVoucher, type: value as any})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="loyalty">Loyalty</SelectItem>
                        <SelectItem value="compensation">Compensation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newVoucher.description}
                    onChange={(e) => setNewVoucher({...newVoucher, description: e.target.value})}
                    placeholder="Enter a brief description for this voucher"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expires At</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={newVoucher.expiresAt}
                      onChange={(e) => setNewVoucher({...newVoucher, expiresAt: e.target.value})}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minOrderAmount">Minimum Order (PKR)</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      value={newVoucher.minOrderAmount}
                      onChange={(e) => setNewVoucher({...newVoucher, minOrderAmount: parseInt(e.target.value) || 0})}
                      placeholder="e.g., 1000"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUsage">Maximum Usage</Label>
                    <Input
                      id="maxUsage"
                      type="number"
                      value={newVoucher.maxUsage}
                      onChange={(e) => setNewVoucher({...newVoucher, maxUsage: parseInt(e.target.value) || 1})}
                      placeholder="e.g., 1"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button onClick={handleCreateVoucher}>
                  <Plus className="mr-2 h-4 w-4" /> Create Voucher
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {filteredVouchers.map(voucher => (
            <Card key={voucher.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Gift className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">{voucher.code}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(voucher.amount)} • {voucher.type}</p>
                      {voucher.user && (
                        <p className="text-sm text-gray-500">Used by: {voucher.user.username}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Badge variant={
                        voucher.status === 'active' ? 'default' :
                        voucher.status === 'used' ? 'secondary' :
                        voucher.status === 'expired' ? 'destructive' : 'outline'
                      }>
                        {voucher.status}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        Created: {formatDate(voucher.createdAt)}
                      </p>
                      {voucher.usedAt && (
                        <p className="text-sm text-gray-600">
                          Used: {formatDate(voucher.usedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {voucher.status === 'active' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleVoucherAction(voucher.id, 'cancel')}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
