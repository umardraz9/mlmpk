'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BackToDashboard from '@/components/BackToDashboard';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  Star,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  CreditCard,
  MapPin,
  Gift,
  ShoppingBag,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber?: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  voucherUsed: number;
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  shippingAddress: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

// TODO: Replace mock data with real API mapping from GET /api/orders

export default function OrdersPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const limit = 10;

  useEffect(() => {
    let ignore = false;
    const load = async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/orders?page=${page}&limit=${limit}`, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Failed to load orders');
        }
        const data = await res.json();
        const list = Array.isArray(data.orders) ? data.orders : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: Order[] = list.map((o: any) => {
          const rawStatus = String(o.status || '').toLowerCase();
          const payStatus = String(o.paymentStatus || '').toLowerCase();
          const valid = ['pending','processing','shipped','delivered','cancelled'];
          const status: Order['status'] = (valid.includes(rawStatus) ? rawStatus : (payStatus === 'paid' ? 'processing' : 'pending')) as Order['status'];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items = Array.isArray(o.items) ? o.items.map((it: any, i: number) => {
            const p = it.product || {};
            const imgs = p.images;
            let firstImg = '/api/placeholder/80/80';
            
            // Handle different image formats
            if (Array.isArray(imgs) && imgs.length > 0 && imgs[0]) {
              firstImg = imgs[0];
            } else if (typeof imgs === 'string' && imgs.length > 0 && imgs !== '[]') {
              // Try to parse JSON string, fallback to string itself
              try {
                const parsed = JSON.parse(imgs);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
                  firstImg = parsed[0];
                } else {
                  firstImg = imgs;
                }
              } catch {
                firstImg = imgs;
              }
            }
            
            // Ensure we have a valid image URL
            if (!firstImg || firstImg === '[]' || firstImg === '' || firstImg === 'undefined') {
              firstImg = '/api/placeholder/80/80';
            }
            
            // Additional validation for next/image
            if (!firstImg.startsWith('/') && !firstImg.startsWith('http')) {
              firstImg = '/api/placeholder/80/80';
            }
            
            return {
              id: typeof it.id === 'number' ? it.id : (Number(it.id) || i + 1),
              name: p.name || it.productName || 'Item',
              quantity: it.quantity || 1,
              price: it.price || it.totalPrice || 0,
              image: firstImg,
            };
          }) : [];
          const total = Number(o.totalPkr ?? o.totalAmount ?? 0);
          const voucherUsed = Number(o.voucherUsedPkr ?? o.voucherUsed ?? 0);
          const created = o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString();
          const address = o.shippingAddress || [o.city, o.province, o.postalCode].filter(Boolean).join(', ');
          return {
            id: o.id,
            orderNumber: o.orderNumber,
            date: created,
            status,
            total,
            voucherUsed,
            items,
            shippingAddress: address,
            trackingNumber: o.trackingNumber,
            estimatedDelivery: o.estimatedDelivery,
          };
        });
        if (!ignore) {
          setOrders(mapped);
          setCurrentPage(data.pagination?.page || 1);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalCount(data.pagination?.totalCount || 0);
        }
      } catch (e: unknown) {
        if (!ignore) {
          setError(e instanceof Error ? e.message : 'Failed to load orders');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    load(currentPage);
    return () => { ignore = true };
  }, [currentPage]);
  

  const filteredOrders = orders.filter(order => {
    if (filter === 'pending') return order.status === 'pending' || order.status === 'processing';
    if (filter === 'delivered') return order.status === 'delivered';
    return true;
  });

  const orderStats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    pending: orders.filter(o => o.status === 'pending' || o.status === 'processing').length,
    totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
    vouchersSaved: orders.reduce((sum, o) => sum + o.voucherUsed, 0)
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'shipped': return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <RefreshCw className="h-4 w-4 text-red-500" />;
      default: return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'default';
      case 'shipped': return 'secondary';
      case 'delivered': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back to Dashboard Button */}
        <BackToDashboard />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            My Orders
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            Track your purchases and order history
          </p>
          {totalCount > 0 && (
            <p className="text-sm text-gray-600">
              Showing {orders.length} of {totalCount} orders
            </p>
          )}
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{orderStats.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-gray-900">{orderStats.delivered}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold text-gray-900">{orderStats.pending}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <span className="text-xl font-bold text-gray-900">PKR {orderStats.totalSpent.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Vouchers Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-600" />
                <span className="text-xl font-bold text-gray-900">PKR {orderStats.vouchersSaved.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Orders
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'delivered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('delivered')}
          >
            Delivered
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading orders...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}. <Button variant="link" className="p-0 h-auto" onClick={() => window.location.reload()}>Try again</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">You haven&apos;t placed any orders. Start shopping to see your orders here.</p>
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        )}

        {/* Orders List */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
            <Card key={order.id} className="border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Order #{order.orderNumber || order.id}</h3>
                      <p className="text-sm text-gray-600">
                        Placed on {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Badge variant={getStatusColor(order.status) as any} className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">PKR {order.total.toLocaleString()}</p>
                    {order.voucherUsed > 0 && (
                      <p className="text-sm text-green-600">
                        <Gift className="h-3 w-3 inline mr-1" />
                        PKR {order.voucherUsed} voucher used
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="relative w-16 h-16">
                        <Image
                          src={item.image || '/api/placeholder/80/80'}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/api/placeholder/80/80';
                          }}
                        />
                      </div>

                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">PKR {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping Info */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Shipping Address</p>
                        <p className="text-sm text-gray-600">{order.shippingAddress}</p>
                      </div>
                    </div>
                    
                    {order.trackingNumber && (
                      <div className="flex items-start gap-2">
                        <Truck className="h-4 w-4 text-gray-500 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Tracking Number</p>
                          <p className="text-sm text-blue-600 font-mono">{order.trackingNumber}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {order.estimatedDelivery && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Estimated Delivery: </span>
                        <span className="text-sm text-gray-600">
                          {new Date(order.estimatedDelivery).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <Link href={`/orders/${order.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  {order.trackingNumber && (
                    <Button size="sm" variant="outline">
                      <Truck className="h-4 w-4 mr-2" />
                      Track Package
                    </Button>
                  )}
                  {order.status === 'delivered' && (
                    <Button size="sm" variant="outline">
                      <Star className="h-4 w-4 mr-2" />
                      Rate & Review
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Order History Summary */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <ShoppingBag className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Regular Shopper</h3>
              <p className="text-gray-700 text-sm">You have placed {orderStats.total} orders and saved PKR {orderStats.vouchersSaved} with vouchers</p>

            </div>
            <div className="text-center">
              <Gift className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Voucher Benefits</h3>
              <p className="text-gray-700 text-sm">Keep using your MLM vouchers to save money on purchases</p>
            </div>
            <div className="text-center">
              <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Rate Products</h3>
              <p className="text-gray-700 text-sm">Help other MLM members by rating and reviewing products</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 