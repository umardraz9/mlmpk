'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  ArrowLeft, 
  Send,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: string;
  orderNumber: string;
  totalPkr: number;
  createdAt: string;
  status: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      images: string[];
    };
  }[];
}

export default function NewReturnRequestPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [returnType, setReturnType] = useState('REFUND');
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const returnReasons = [
    'Defective/Damaged Product',
    'Wrong Item Received',
    'Item Not as Described',
    'Size/Fit Issues',
    'Quality Issues',
    'Changed Mind',
    'Late Delivery',
    'Other'
  ];

  useEffect(() => {
    if (session?.user) {
      fetchEligibleOrders();
    }
  }, [session]);

  const fetchEligibleOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await fetch('/api/orders?status=DELIVERED&limit=50');
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      
      // Filter orders within 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const eligibleOrders = data.orders.filter((order: Order) => 
        new Date(order.createdAt) >= thirtyDaysAgo
      );
      
      setOrders(eligibleOrders);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrderId || !reason || !description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/support/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrderId,
          reason,
          description,
          requestedAmount: requestedAmount ? parseFloat(requestedAmount) : undefined,
          returnType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit return request');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/support/returns/${data.returnRequest.id}`);
      }, 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedOrder = orders.find(order => order.id === selectedOrderId);

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please log in to submit a return request.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Return Request Submitted!
              </h2>
              <p className="text-gray-600 mb-4">
                Your return request has been submitted successfully. You will receive a confirmation email shortly.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to request details...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/support/returns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Returns
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Return Request</h1>
            <p className="text-gray-600">Submit a return request for your order</p>
          </div>
        </div>

        {/* Return Policy Reminder */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>Return Policy:</strong> Items can be returned within 30 days of delivery. 
            Please ensure items are in original condition with all packaging.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Select Order
              </CardTitle>
              <CardDescription>
                Choose the order you want to return items from
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">Loading eligible orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Eligible Orders
                  </h3>
                  <p className="text-gray-600">
                    You don't have any delivered orders within the 30-day return window.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label htmlFor="order-select">Select Order *</Label>
                  <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an order..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{order.orderNumber}</span>
                            <span className="text-sm text-gray-500 ml-4">
                              PKR {order.totalPkr.toLocaleString()} • {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedOrder && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Order Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Order Number:</span>
                          <p className="font-medium">{selectedOrder.orderNumber}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Amount:</span>
                          <p className="font-medium">PKR {selectedOrder.totalPkr.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Order Date:</span>
                          <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Items:</span>
                          <p className="font-medium">{selectedOrder.items.length} item(s)</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Return Details */}
          <Card>
            <CardHeader>
              <CardTitle>Return Details</CardTitle>
              <CardDescription>
                Provide details about your return request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reason">Return Reason *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {returnReasons.map((reasonOption) => (
                      <SelectItem key={reasonOption} value={reasonOption}>
                        {reasonOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide detailed information about the issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <Label htmlFor="return-type">Return Type</Label>
                <Select value={returnType} onValueChange={setReturnType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REFUND">Refund</SelectItem>
                    <SelectItem value="EXCHANGE">Exchange</SelectItem>
                    <SelectItem value="STORE_CREDIT">Store Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="requested-amount">Requested Refund Amount (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="requested-amount"
                    type="number"
                    placeholder="Leave empty for full refund"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    className="pl-10"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  If not specified, full order amount will be requested
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || !selectedOrderId || !reason || !description}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Return Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
