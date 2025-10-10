'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import Link from 'next/link';

interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
  courierService?: string;
}

interface ShippingInfo {
  trackingNumber: string;
  courierService: string;
  status: string;
  estimatedDelivery: string | null;
  trackingEvents: TrackingEvent[];
  lastUpdated: string;
}

interface OrderInfo {
  id: string;
  orderNumber: string;
  status: string;
  trackingNumber: string | null;
  totalPkr: number;
  createdAt: string;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackingInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${params.id}/shipping`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tracking information');
      }

      const data = await response.json();
      setOrderInfo(data.order);
      setShippingInfo(data.shipping);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchTrackingInfo();
    }
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'processing': return 'bg-purple-500';
      case 'shipped': return 'bg-green-500';
      case 'delivered': return 'bg-emerald-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2 text-lg">Loading tracking information...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchTrackingInfo} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
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
            <Link href="/orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-gray-600">Track your package delivery status</p>
            </div>
          </div>
          <Button onClick={fetchTrackingInfo} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Order Information */}
        {orderInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order {orderInfo.orderNumber}
              </CardTitle>
              <CardDescription>
                Placed on {new Date(orderInfo.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(orderInfo.status)} text-white`}>
                    {getStatusIcon(orderInfo.status)}
                    <span className="ml-1">{orderInfo.status}</span>
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Total:</strong> PKR {orderInfo.totalPkr.toLocaleString()}
                </div>
                {orderInfo.trackingNumber && (
                  <div className="text-sm text-gray-600">
                    <strong>Tracking:</strong> {orderInfo.trackingNumber}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shipping Information */}
        {shippingInfo ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Courier Service</h4>
                    <p className="text-gray-600">{shippingInfo.courierService}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Tracking Number</h4>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                      {shippingInfo.trackingNumber}
                    </p>
                  </div>
                  {shippingInfo.estimatedDelivery && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Estimated Delivery</h4>
                      <p className="text-gray-600 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(shippingInfo.estimatedDelivery).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Last Updated</h4>
                    <p className="text-gray-600">
                      {new Date(shippingInfo.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Tracking Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shippingInfo.trackingEvents.map((event, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        index === 0 ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900">{event.status}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{event.description}</p>
                        {event.location && (
                          <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Shipping Information Not Available
              </h3>
              <p className="text-gray-600 mb-4">
                Your order is being processed. Tracking information will be available once shipped.
              </p>
              <Button onClick={fetchTrackingInfo} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Again
              </Button>
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
