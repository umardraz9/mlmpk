'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  ArrowLeft, 
  RefreshCw, 
  Calendar,
  DollarSign,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  Phone
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
  refundMethod?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  order: {
    id: string;
    orderNumber: string;
    totalPkr: number;
    createdAt: string;
    items: {
      id: string;
      quantity: number;
      price: number;
      product: {
        name: string;
        price: number;
        images: string[];
      };
    }[];
  };
}

export default function ReturnRequestDetailsPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [returnRequest, setReturnRequest] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReturnRequest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/support/returns/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch return request details');
      }

      const data = await response.json();
      setReturnRequest(data.returnRequest);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchReturnRequest();
    }
  }, [params.id]);

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

  const getStatusDescription = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Your return request is being reviewed by our team.';
      case 'approved': return 'Your return request has been approved. Processing will begin shortly.';
      case 'rejected': return 'Your return request has been rejected. Please see admin notes for details.';
      case 'processing': return 'Your return is being processed. Refund will be issued soon.';
      case 'completed': return 'Your return has been completed and refund has been processed.';
      default: return 'Status unknown.';
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please log in to view return request details.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2 text-lg">Loading return request details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !returnRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Return request not found'}</AlertDescription>
          </Alert>
          <Link href="/support/returns">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Returns
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/support/returns">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Returns
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Return Request Details</h1>
              <p className="text-gray-600">{returnRequest.returnNumber}</p>
            </div>
          </div>
          <Button onClick={fetchReturnRequest} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className={`${getStatusColor(returnRequest.status)} text-white`}>
                {getStatusIcon(returnRequest.status)}
                <span className="ml-1">{returnRequest.status}</span>
              </Badge>
              <span className="text-lg">Return Status</span>
            </CardTitle>
            <CardDescription>
              {getStatusDescription(returnRequest.status)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Submitted:</span>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(returnRequest.createdAt).toLocaleString()}
                </p>
              </div>
              {returnRequest.processedAt && (
                <div>
                  <span className="text-gray-500">Processed:</span>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(returnRequest.processedAt).toLocaleString()}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Return Type:</span>
                <p className="font-medium">{returnRequest.returnType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Return Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Return Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Return Reason</h4>
                <p className="text-gray-600">{returnRequest.reason}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Requested Amount</h4>
                <p className="text-gray-600 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  PKR {returnRequest.requestedAmount.toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                {returnRequest.description}
              </p>
            </div>

            {returnRequest.adminNotes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Admin Notes</h4>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-blue-700">{returnRequest.adminNotes}</p>
                </div>
              </div>
            )}

            {returnRequest.refundAmount && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Refund Information</h4>
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700 font-medium">Refund Amount:</span>
                      <p className="text-green-600">PKR {returnRequest.refundAmount.toLocaleString()}</p>
                    </div>
                    {returnRequest.refundMethod && (
                      <div>
                        <span className="text-green-700 font-medium">Refund Method:</span>
                        <p className="text-green-600">{returnRequest.refundMethod}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Related Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Order Number:</span>
                  <p className="font-medium">{returnRequest.order.orderNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Order Total:</span>
                  <p className="font-medium">PKR {returnRequest.order.totalPkr.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Order Date:</span>
                  <p className="font-medium">{new Date(returnRequest.order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                <div className="space-y-2">
                  {returnRequest.order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.product.images && item.product.images.length > 0 && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium text-gray-900">
                        PKR {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Link href={`/orders/${returnRequest.order.id}`}>
                  <Button variant="outline" size="sm">
                    View Full Order
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information (Admin View) */}
        {session.user.isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <p className="font-medium">{returnRequest.user.name}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {returnRequest.user.email}
                  </p>
                </div>
                {returnRequest.user.phone && (
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {returnRequest.user.phone}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" />
                <span className="text-sm">Call: +92 300 1234567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-600" />
                <span className="text-sm">Email: support@mcnmart.com</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
