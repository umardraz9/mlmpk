'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Plus, 
  RefreshCw, 
  Eye, 
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

interface ReturnRequest {
  id: string;
  returnNumber: string;
  status: string;
  reason: string;
  description: string;
  requestedAmount: number;
  refundAmount?: number;
  returnType: string;
  createdAt: string;
  processedAt?: string;
  adminNotes?: string;
  order: {
    orderNumber: string;
    totalPkr: number;
  };
}

export default function ReturnsPage() {
  const { data: session } = useSession();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/support/returns?page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch return requests');
      }

      const data = await response.json();
      setReturns(data.returns);
      setTotalPages(data.pagination.totalPages);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchReturns();
    }
  }, [session, page]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'processing': return <RefreshCw className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please log in to view your return requests.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Returns & Refunds</h1>
            <p className="text-gray-600">Manage your return requests and refunds</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchReturns} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Link href="/support/returns/new">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                New Return Request
              </Button>
            </Link>
          </div>
        </div>

        {/* Return Policy Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Return Policy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Return Window</h4>
                <p className="text-gray-600">30 days from delivery date</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Processing Time</h4>
                <p className="text-gray-600">3-5 business days</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Refund Method</h4>
                <p className="text-gray-600">Original payment method or wallet</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Returns List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2 text-lg">Loading return requests...</span>
          </div>
        ) : returns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Return Requests
              </h3>
              <p className="text-gray-600 mb-4">
                You haven't submitted any return requests yet.
              </p>
              <Link href="/support/returns/new">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Return Request
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {returns.map((returnRequest) => (
              <Card key={returnRequest.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {returnRequest.returnNumber}
                        </h3>
                        <Badge className={`${getStatusColor(returnRequest.status)} text-white`}>
                          {getStatusIcon(returnRequest.status)}
                          <span className="ml-1">{returnRequest.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Order:</span>
                          <p className="font-medium">{returnRequest.order.orderNumber}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Reason:</span>
                          <p className="font-medium">{returnRequest.reason}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Requested Amount:</span>
                          <p className="font-medium flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            PKR {returnRequest.requestedAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Submitted:</span>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(returnRequest.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {returnRequest.description && (
                        <div className="mt-3">
                          <span className="text-gray-500 text-sm">Description:</span>
                          <p className="text-sm text-gray-700 mt-1">{returnRequest.description}</p>
                        </div>
                      )}

                      {returnRequest.adminNotes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <span className="text-blue-700 text-sm font-medium">Admin Notes:</span>
                          <p className="text-sm text-blue-600 mt-1">{returnRequest.adminNotes}</p>
                        </div>
                      )}

                      {returnRequest.refundAmount && returnRequest.status === 'COMPLETED' && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <span className="text-green-700 text-sm font-medium">Refund Processed:</span>
                          <p className="text-sm text-green-600 mt-1">
                            PKR {returnRequest.refundAmount.toLocaleString()} has been added to your wallet
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Link href={`/support/returns/${returnRequest.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
