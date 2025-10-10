'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, SlidersHorizontal, Users as UsersIcon, Settings as SettingsIcon, CheckCircle, XCircle, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface TaskSettings {
  renewalFee: number;
  dailyTaskLimit: number;
  taskReward?: number;
  currency?: string;
}

interface UserTaskStatus {
  id: string;
  name: string | null;
  email: string | null;
  balance: number;
  totalPoints: number;
  totalEarnings: number;
  tasksCompleted: number;
  tasksEnabled: boolean;
}

export default function TaskControlsPage() {
  const [settings, setSettings] = useState<TaskSettings>({
    renewalFee: 300,
    dailyTaskLimit: 5
  });
  const [users, setUsers] = useState<UserTaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'status' | 'earnings' | 'tasksCompleted'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/task-controls');
      const data = await response.json();
      setSettings({
        renewalFee: data?.settings?.renewalFee ?? 300,
        dailyTaskLimit: data?.settings?.dailyTaskLimit ?? 5,
        taskReward: data?.settings?.taskReward,
        currency: data?.settings?.currency
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/task-controls');
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
    setLoading(false);
  };

  const updateSettings = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/task-controls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renewalFee: settings.renewalFee,
          dailyTaskLimit: settings.dailyTaskLimit
        })
      });
      
      if (response.ok) {
        setMessage('Settings updated successfully');
      } else {
        const err = await response.json().catch(() => ({}));
        setError(err?.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      setError('Network error while updating settings');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 2500);
    }
  };

  const toggleUserTaskAccess = async (userId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/task-access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (response.ok) {
        console.log('User access updated');
        fetchUsers();
      } else {
        console.error('Failed to update user');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const bulkToggle = async (enabled: boolean) => {
    setBulkLoading(true);
    try {
      await Promise.allSettled(
        users.map(u => 
          fetch(`/api/admin/users/${u.id}/task-access`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
          })
        )
      );
      await fetchUsers();
      setMessage(`All users ${enabled ? 'enabled' : 'disabled'} for task access`);
    } catch (e) {
      setError('Bulk update failed. Please try again.');
    } finally {
      setBulkLoading(false);
      setTimeout(() => setMessage(''), 2500);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const enabledCount = useMemo(() => users.filter(u => u.tasksEnabled).length, [users]);
  const disabledCount = useMemo(() => users.length - enabledCount, [users, enabledCount]);

  const statusFilteredUsers = useMemo(() => {
    if (statusFilter === 'all') return filteredUsers;
    return filteredUsers.filter(u => (statusFilter === 'enabled' ? u.tasksEnabled : !u.tasksEnabled));
  }, [filteredUsers, statusFilter]);

  const sortedUsers = useMemo(() => {
    const arr = [...statusFilteredUsers];
    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'name') {
        const av = (a.name || '').toLowerCase();
        const bv = (b.name || '').toLowerCase();
        return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
      }
      if (sortBy === 'email') {
        const av = (a.email || '').toLowerCase();
        const bv = (b.email || '').toLowerCase();
        return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
      }
      if (sortBy === 'status') {
        // Enabled first when asc
        const av = a.tasksEnabled ? 1 : 0;
        const bv = b.tasksEnabled ? 1 : 0;
        return (av - bv) * dir;
      }
      if (sortBy === 'earnings') {
        const av = (a.balance + a.totalPoints) || 0;
        const bv = (b.balance + b.totalPoints) || 0;
        return (av - bv) * dir;
      }
      if (sortBy === 'tasksCompleted') {
        const av = a.tasksCompleted || 0;
        const bv = b.tasksCompleted || 0;
        return (av - bv) * dir;
      }
      return 0;
    });
    return arr;
  }, [statusFilteredUsers, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, currentPage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy, sortDir, pageSize]);

  const exportCsv = () => {
    const rows = sortedUsers.map(u => ({
      id: u.id,
      name: u.name || '',
      email: u.email || '',
      status: u.tasksEnabled ? 'Active' : 'Disabled',
      tasksCompleted: u.tasksCompleted ?? 0,
      balance: u.balance,
      totalPoints: u.totalPoints,
      totalEarnings: (u.balance + u.totalPoints)
    }));
    const header = ['id','name','email','status','tasksCompleted','balance','totalPoints','totalEarnings'];
    const csv = [header.join(','), ...rows.map(r => header.map(k => JSON.stringify((r as any)[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `task-users-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task System Controls</h1>
          <p className="text-gray-600">Manage global task settings and user access</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/admin/tasks'}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Admin Tasks
          </Button>
          <Button
            variant="outline"
            onClick={() => { setLoading(true); Promise.all([fetchSettings(), fetchUsers()]).finally(() => setLoading(false)); }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Badge variant="outline">Admin Panel</Badge>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Total Users</div>
            <div className="text-2xl font-semibold flex items-center gap-2"><UsersIcon className="w-5 h-5" /> {users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Enabled</div>
            <div className="text-2xl font-semibold text-green-600 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {enabledCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Disabled</div>
            <div className="text-2xl font-semibold text-red-600 flex items-center gap-2"><XCircle className="w-5 h-5" /> {disabledCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Renewal Fee / Daily Limit</div>
            <div className="text-lg font-medium">PKR {settings.renewalFee} • {settings.dailyTaskLimit} tasks/day</div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Task System Settings</CardTitle>
          <CardDescription>Control task system parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className="rounded-md bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Renewal Fee (PKR)</Label>
              <Input
                type="number"
                value={settings.renewalFee}
                onChange={(e) => setSettings(prev => ({ ...prev, renewalFee: parseInt(e.target.value) || 300 }))}
              />
            </div>
            <div>
              <Label>Daily Task Limit</Label>
              <Input
                type="number"
                value={settings.dailyTaskLimit}
                onChange={(e) => setSettings(prev => ({ ...prev, dailyTaskLimit: parseInt(e.target.value) || 5 }))}
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={settings.currency || 'PKR'} disabled />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={updateSettings} disabled={saving}>
              {saving && <span className="w-4 h-4 mr-2 inline-block animate-spin rounded-full border-2 border-white border-t-transparent" />}Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Task Access Management</CardTitle>
          <CardDescription>Control individual user task access</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="Search users by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:max-w-sm"
              />
              <div className="hidden md:flex items-center gap-1 rounded-lg border p-1">
                <button onClick={() => setStatusFilter('all')} className={`px-2 py-1 text-sm rounded ${statusFilter==='all' ? 'bg-gray-900 text-white' : 'text-gray-700'}`}>All</button>
                <button onClick={() => setStatusFilter('enabled')} className={`px-2 py-1 text-sm rounded ${statusFilter==='enabled' ? 'bg-green-600 text-white' : 'text-gray-700'}`}>Enabled</button>
                <button onClick={() => setStatusFilter('disabled')} className={`px-2 py-1 text-sm rounded ${statusFilter==='disabled' ? 'bg-red-600 text-white' : 'text-gray-700'}`}>Disabled</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Sort users by"
                title="Sort users by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'email' | 'status' | 'earnings' | 'tasksCompleted')}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="name">Sort: Name</option>
                <option value="email">Sort: Email</option>
                <option value="status">Sort: Status</option>
                <option value="earnings">Sort: Earnings</option>
                <option value="tasksCompleted">Sort: Tasks Completed</option>
              </select>
              <select
                aria-label="Sort direction"
                title="Sort direction"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
              <select
                aria-label="Rows per page"
                title="Rows per page"
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value) || 10)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
              <Button variant="outline" onClick={exportCsv}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <Button variant="outline" onClick={() => bulkToggle(true)} disabled={bulkLoading || sortedUsers.length === 0}>Enable All</Button>
              <Button variant="outline" onClick={() => bulkToggle(false)} disabled={bulkLoading || sortedUsers.length === 0}>Disable All</Button>
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {pagedUsers.map((user) => (
              <div key={user.id} className="p-4 border rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{user.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                  <div className="text-xs text-gray-500 mt-1">Tasks completed: {user.tasksCompleted ?? 0}</div>
                  <div className="text-sm mt-1">Earnings: PKR {(user.balance + user.totalPoints).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={user.tasksEnabled ? 'default' : 'secondary'}>
                    {user.tasksEnabled ? 'Active' : 'Disabled'}
                  </Badge>
                  <Switch
                    checked={user.tasksEnabled}
                    onCheckedChange={(checked) => toggleUserTaskAccess(user.id, checked)}
                  />
                </div>
              </div>
            ))}
            {sortedUsers.length === 0 && (
              <div className="p-4 text-center text-gray-500 border rounded-lg">No users found</div>
            )}
          </div>

          {/* Pagination */}
          {sortedUsers.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedUsers.length)} of {sortedUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Renewal System</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Users can renew task access for PKR {settings.renewalFee}/week. Adjust the daily limit to control task volume.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Daily Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {settings.dailyTaskLimit} tasks per day maximum
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
