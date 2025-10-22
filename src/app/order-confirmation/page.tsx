'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Clock, 
  Mail, 
  Phone, 
  MapPin,
  CreditCard,
  ArrowRight,
  Download,
  Share2,
  Home
} from 'lucide-react';
import { 
  MobileLayout, 
  MobilePageContainer, 
  MobileSection, 
  MobileCard 
} from '@/components/layout/mobile-layout';
import { TouchButton } from '@/components/ui/mobile-touch';
import { MobileLoading } from '@/components/ui/mobile-loading';
import { MobileError } from '@/components/ui/mobile-error';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  shippingCost: number;
  voucherDiscount: number;
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    phone: string;
    email: string;
  };
  items: OrderItem[];
  createdAt: string;
  estimatedDelivery: string;
  trackingNumber?: string;
}

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!orderId) {
      router.push('/orders');
      return;
    }

    fetchOrderDetails();
  }, [orderId, session]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      
      if (data.success) {
        setOrder(data.order);
        // Send notifications
        await sendNotifications(data.order);
      } else {
        throw new Error(data.error || 'Order not found');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const sendNotifications = async (orderData: Order) => {
    try {
      // Send email notification
      const emailResponse = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order_confirmation',
          orderId: orderData.id,
          email: orderData.shippingAddress.email
        })
      });

      if (emailResponse.ok) {
        setEmailSent(true);
      }

      // Send SMS notification
      const smsResponse = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order_confirmation',
          orderId: orderData.id,
          phone: orderData.shippingAddress.phone
        })
      });

      if (smsResponse.ok) {
        setSmsSent(true);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'COD':
        return 'Cash on Delivery';
      case 'JAZZCASH':
        return 'JazzCash';
      case 'EASYPAISA':
        return 'EasyPaisa';
      case 'BANK_TRANSFER':
        return 'Bank Transfer';
      case 'CREDIT_CARD':
        return 'Credit/Debit Card';
      default:
        return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'text-green-600 bg-green-100';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-100';
      case 'SHIPPED':
        return 'text-purple-600 bg-purple-100';
      case 'DELIVERED':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/receipt`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MCNmart-Order-${order?.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const handleShareOrder = async () => {
    if (navigator.share && order) {
      try {
        await navigator.share({
          title: `MCNmart Order ${order.orderNumber}`,
          text: `I just placed an order on MCNmart! Order #${order.orderNumber}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Order Confirmation">
        <MobilePageContainer>
          <MobileLoading />
        </MobilePageContainer>
      </MobileLayout>
    );
  }

  if (error || !order) {
    return (
      <MobileLayout title="Order Confirmation">
        <MobilePageContainer>
          <MobileError 
            message={error || 'Order not found'} 
            onRetry={fetchOrderDetails}
          />
        </MobilePageContainer>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Order Confirmed" 
      subtitle="Your order has been placed successfully"
    >
      <MobilePageContainer>
        {/* Success Header */}
        <MobileSection>
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600 mb-4">
              Thank you for your purchase. Your order has been received and is being processed.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600">Order Number</div>
              <div className="text-xl font-bold text-gray-900">#{order.orderNumber}</div>
            </div>
            
            {/* Notification Status */}
            <div className="flex justify-center space-x-4 text-sm">
              {emailSent && (
                <div className="flex items-center text-green-600">
                  <Mail className="h-4 w-4 mr-1" />
                  Email sent
                </div>
              )}
              {smsSent && (
                <div className="flex items-center text-green-600">
                  <Phone className="h-4 w-4 mr-1" />
                  SMS sent
                </div>
              )}
            </div>
          </div>
        </MobileSection>

        {/* Order Status */}
        <MobileSection>
          <MobileCard>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <Package className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-semibold text-gray-900">Order Status</div>
                  <div className="text-sm text-gray-600">
                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
          </MobileCard>
        </MobileSection>

        {/* Delivery Information */}
        <MobileSection>
          <MobileCard>
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Truck className="h-6 w-6 text-green-600" />
                <div>
                  <div className="font-semibold text-gray-900">Delivery Information</div>
                  <div className="text-sm text-gray-600">
                    Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium">{order.shippingAddress.fullName}</div>
                    <div className="text-gray-600">{order.shippingAddress.address}</div>
                    <div className="text-gray-600">{order.shippingAddress.city}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{order.shippingAddress.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{order.shippingAddress.email}</span>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">Tracking Number</div>
                  <div className="text-sm text-blue-700 font-mono">{order.trackingNumber}</div>
                </div>
              )}
            </div>
          </MobileCard>
        </MobileSection>

        {/* Order Items */}
        <MobileSection>
          <MobileCard>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex space-x-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Qty: {item.quantity} × PKR {item.price}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      PKR {item.subtotal}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </MobileCard>
        </MobileSection>

        {/* Order Summary */}
        <MobileSection>
          <MobileCard>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>PKR {(order.totalAmount - order.shippingCost + order.voucherDiscount).toLocaleString()}</span>
                </div>
                {order.voucherDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Voucher Discount</span>
                    <span>-PKR {order.voucherDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>PKR {order.shippingCost.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>PKR {order.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Payment Method:</span>
                  <span className="text-sm font-medium">{getPaymentMethodDisplay(order.paymentMethod)}</span>
                </div>
              </div>
            </div>
          </MobileCard>
        </MobileSection>

        {/* Action Buttons */}
        <MobileSection>
          <div className="space-y-3">
            <TouchButton
              onClick={() => router.push(`/orders/${order.id}/track`)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Truck className="h-4 w-4 mr-2" />
              Track Your Order
              <ArrowRight className="h-4 w-4 ml-2" />
            </TouchButton>

            <div className="grid grid-cols-2 gap-3">
              <TouchButton
                onClick={handleDownloadReceipt}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </TouchButton>

              <TouchButton
                onClick={handleShareOrder}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Order
              </TouchButton>
            </div>

            <TouchButton
              onClick={() => router.push('/products')}
              variant="outline"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Continue Shopping
            </TouchButton>
          </div>
        </MobileSection>

        {/* Next Steps */}
        <MobileSection>
          <MobileCard>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Order Processing</div>
                    <div className="text-gray-600">We're preparing your items for shipment</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600">2</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Shipment</div>
                    <div className="text-gray-600">Your order will be shipped within 1-2 business days</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600">3</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Delivery</div>
                    <div className="text-gray-600">Estimated delivery by {new Date(order.estimatedDelivery).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </MobileCard>
        </MobileSection>
      </MobilePageContainer>
    </MobileLayout>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <MobileLoading />
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
