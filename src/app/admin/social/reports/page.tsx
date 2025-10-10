"use client";

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Eye, ShieldAlert, Trash2 } from 'lucide-react'

interface ReportItem {
  id: string
  reason?: string | null
  createdAt: string
  reporter: { id: string; name?: string | null; username?: string | null; avatar?: string | null }
  post: {
    id: string
    content: string
    status: string
    coverUrl?: string | null
    author: { id: string; name?: string | null; username?: string | null; avatar?: string | null }
  }
}

export default function AdminSocialReportsPage() {
  const { data: session, status } = useSession()
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/social/reports')
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to load reports')
      setReports(data.reports || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.isAdmin) {
      load()
    }
  }, [status, session])

  if (status === 'loading') return <div className="p-6">Loading…</div>
  if (!session?.user || !(session.user as any).isAdmin) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-2 text-red-600"><ShieldAlert className="h-5 w-5" /> Admin access required</div>
        <p className="text-sm text-gray-600 mt-2">You must be an admin to view this page.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Social Reports Moderation</h1>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>
      )}

      {loading ? (
        <div>Loading…</div>
      ) : reports.length === 0 ? (
        <div className="text-sm text-gray-600">No reports.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-3">
              <div className="flex gap-3">
                <div className="w-20 h-32 rounded overflow-hidden bg-gray-200 shrink-0 relative">
                  {r.post.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.post.coverUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">No cover</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold truncate">Post by {r.post.author.name || 'Anonymous'} {r.post.author.username && (<span className="text-gray-500 font-normal">(@{r.post.author.username})</span>)}</div>
                    <div className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{r.post.status}</div>
                  </div>
                  <div className="text-sm text-gray-800 mt-1 line-clamp-3">{r.post.content}</div>
                  <div className="text-xs text-gray-500 mt-2">Reported by {r.reporter.name || 'User'} {r.reason ? `• ${r.reason}` : ''} • {new Date(r.createdAt).toLocaleString()}</div>

                  <div className="mt-3 flex items-center gap-2">
                    <Link href={`/social/reels?id=${r.post.id}`} className="inline-flex">
                      <Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" /> View Reel</Button>
                    </Link>
                    <Button size="sm" variant="destructive" onClick={async () => {
                      try {
                        await fetch(`/api/admin/social/posts/${r.post.id}/hide`, { method: 'POST' })
                        await load()
                      } catch {}
                    }}><Trash2 className="h-4 w-4 mr-1" /> Hide Post</Button>
                    <Button size="sm" onClick={async () => {
                      try {
                        await fetch(`/api/admin/social/reports/${r.id}/resolve`, { method: 'POST' })
                        setReports(prev => prev.filter(x => x.id !== r.id))
                      } catch {}
                    }}><CheckCircle className="h-4 w-4 mr-1" /> Resolve</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
