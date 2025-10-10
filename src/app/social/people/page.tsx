"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Send, Eye, Check, X, Loader2 } from "lucide-react";

interface SimpleUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  avatar?: string;
}

interface FriendRequestItem {
  id: string;
  status: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
  sender?: { id: string; name?: string; email?: string; image?: string };
  recipient?: { id: string; name?: string; email?: string; image?: string };
}

export default function PeoplePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState<string | null>(null);
  const [requestedUsers, setRequestedUsers] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"people" | "requests">("people");
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const requestedTab = searchParams.get("tab");

  useEffect(() => {
    if (requestedTab === "requests") setTab("requests");
  }, [requestedTab]);

  useEffect(() => {
    const uid = (session?.user as { id?: string })?.id;
    if (!uid) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/users");
        const data = await res.json();
        if (data?.success) {
          setUsers(data.users || []);
        } else {
          setUsers([]);
        }
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  useEffect(() => {
    const uid = (session?.user as { id?: string })?.id;
    if (!uid || tab !== "requests") return;
    (async () => {
      try {
        setRequestsLoading(true);
        const res = await fetch("/api/social/friend-requests?type=received", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.success) setRequests(data.friendRequests || []);
        }
      } catch {
        // silently ignore if backend is not configured
        setRequests([]);
      } finally {
        setRequestsLoading(false);
      }
    })();
  }, [session, tab]);

  const filtered = useMemo(() => {
    if (!search) return users;
    return users.filter((u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const onFollowToggle = async (userId: string) => {
    setFollowLoading(userId);
    try {
      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update follow");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setFollowLoading(null);
    }
  };

  const onSendFriendRequest = async (recipientId: string) => {
    setRequestLoading(recipientId);
    try {
      const res = await fetch('/api/social/friend-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setRequestedUsers((prev) => ({ ...prev, [recipientId]: true }));
      } else {
        alert(data?.error || 'Failed to send friend request');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setRequestLoading(null);
    }
  };

  const onAccept = async (requestId: string) => {
    try {
      const res = await fetch(`/api/social/friend-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        alert(data?.error || "Failed to accept request");
      }
    } catch {
      alert("Friend requests may not be configured yet.");
    }
  };

  const onReject = async (requestId: string) => {
    try {
      const res = await fetch(`/api/social/friend-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      } else {
        alert(data?.error || "Failed to reject request");
      }
    } catch {
      alert("Friend requests may not be configured yet.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-semibold mb-3">Sign in required</h2>
          <Button onClick={() => signIn()}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">People</h1>
          <div className="flex gap-2">
            <Button
              variant={tab === "people" ? "default" : "outline"}
              onClick={() => setTab("people")}
            >
              Discover
            </Button>
            <Button
              variant={tab === "requests" ? "default" : "outline"}
              onClick={() => setTab("requests")}
            >
              Friend Requests
            </Button>
          </div>
        </div>

        {tab === "people" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search people by name or email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-gray-500">Loading people...</div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-gray-500">No people found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map((u) => (
                    <div key={u.id} className="p-4 border rounded-lg bg-white flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={u.image || u.avatar || "/api/placeholder/48/48"} />
                        <AvatarFallback>{(u.name || u.email)?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{u.name || u.email}</p>
                          <Badge variant="secondary">Member</Badge>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{u.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/social/profile/${u.id}`)}
                          title="View profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/messages?userId=${u.id}`)}
                          title="Message"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => onSendFriendRequest(u.id)}
                          disabled={requestLoading === u.id || requestedUsers[u.id]}
                          title={requestedUsers[u.id] ? 'Request Sent' : 'Add Friend'}
                        >
                          {requestedUsers[u.id] ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          onClick={() => onFollowToggle(u.id)}
                          disabled={followLoading === u.id}
                          title="Follow / Unfollow"
                        >
                          {followLoading === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === "requests" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Friend Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="py-12 text-center text-gray-500">Loading requests...</div>
              ) : requests.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  No pending requests. If this feature is not active in your database, it will appear empty.
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((r) => {
                    const from = r.sender || { id: r.senderId, name: "User" };
                    return (
                      <div key={r.id} className="p-4 border rounded-lg bg-white flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={from.image || "/api/placeholder/40/40"} />
                          <AvatarFallback>{(from.name || "U")[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{from.name || from.email || "User"}</p>
                          <p className="text-sm text-gray-500 truncate">wants to connect</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="default" onClick={() => onAccept(r.id)} title="Accept">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" onClick={() => onReject(r.id)} title="Reject">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
