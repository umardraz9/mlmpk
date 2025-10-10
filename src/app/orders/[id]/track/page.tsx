'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin,
  Phone,
  Mail,
  Calendar,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Copy,
  ExternalLink
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
import { cn } from '@/lib/utils';

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location: string;
  timestamp: string;
  isCompleted: boolean;
}

interface OrderTracking {
  id: string;
  orderNumber: string;
  status: string;
  trackingNumber: string;
  currentLocation: string;
  estimatedDelivery: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    phone: string;
  };
  trackingEvents: TrackingEvent[];
  courierName: string;
  courierPhone: string;
}

const trackingStatuses = [
  { key: 'CONFIRMED', label: 'Order Confirmed', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Processing', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle }
];

export default function OrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const orderId = params.id as string;

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!orderId) {
      router.push('/orders');
      return;
    }

    fetchTrackingData();
  }, [orderId, session]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/orders/${orderId}/tracking`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tracking information');
      }

      const data = await response.json();
      
      if (data.success) {
        setTracking(data.tracking);
      } else {
        throw new Error(data.error || 'Tracking information not available');
      }
    } catch (err) {
      console.error('Error fetching tracking:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrackingData();
    setRefreshing(false);
  };

  const copyTrackingNumber = async () => {
    if (tracking?.trackingNumber) {
      try {
        await navigator.clipboard.writeText(tracking.trackingNumber);
      } catch (error) {
        console.error('Failed to copy tracking number:', error);
      }
    }
  };

  const getStatusIndex = (status: string) => {
    return trackingStatuses.findIndex(s => s.key === status);
  };

  if (loading) {
    return (
      <MobileLayout title="Order Tracking">
        <MobilePageContainer>
          <MobileLoading />
        </MobilePageContainer>
      </MobileLayout>
    );
  }

  if (error || !tracking) {
    return (
      <MobileLayout title="Order Tracking">
        <MobilePageContainer>
          <MobileError 
            message={error || 'Tracking information not available'} 
            onRetry={fetchTrackingData}
          />
        </MobilePageContainer>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Track Order"
      subtitle={`Order #${tracking.orderNumber}`}
      showBackButton
      actions={
        <TouchButton
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          disabled={refreshing}
          className="h-9 w-9 p-0"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </TouchButton>
      }
    >
      <MobilePageContainer>
        {/* Current Status */}
        <MobileSection>
          <MobileCard>
            <div className="p-4 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {trackingStatuses.find(s => s.key === tracking.status)?.label || tracking.status}
              </h2>
              <p className="text-gray-600 mb-4">
                {tracking.currentLocation}
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-600 mb-1">Tracking Number</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium">{tracking.trackingNumber}</span>
                  <TouchButton
                    onClick={copyTrackingNumber}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </TouchButton>
                </div>
              </div>

              <div className="flex items-center justify-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                Estimated delivery: {new Date(tracking.estimatedDelivery).toLocaleDateString()}
              </div>
            </div>
          </MobileCard>
        </MobileSection>

        {/* Progress Timeline */}
        <MobileSection>
          <MobileCard>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Order Progress</h3>
              <div className="space-y-4">
                {trackingStatuses.map((status, index) => {
                  const isActive = status.key === tracking.status;
                  const isCompleted = getStatusIndex(status.key) <= getStatusIndex(tracking.status);
                  const StatusIcon = status.icon;
                  
                  return (
                    <div key={status.key} className="flex items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                        isCompleted ? "bg-green-100" : "bg-gray-100"
                      )}>
                        <StatusIcon className={cn(
                          "h-4 w-4",
                          isCompleted ? "text-green-600" : "text-gray-400"
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className={cn(
                          "font-medium",
                          isActive ? "text-green-600" : isCompleted ? "text-gray-900" : "text-gray-400"
                        )}>
                          {status.label}
                        </div>
                        {isActive && (
                          <div className="text-sm text-gray-600">Current status</div>
                        )}
                      </div>
                      {isCompleted && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </MobileCard>
        </MobileSection>

        {/* Tracking Events */}
        <MobileSection>
          <MobileCard>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Tracking History</h3>
              <div className="space-y-4">
                {tracking.trackingEvents.map((event, index) => (
                  <div key={event.id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-3 h-3 rounded-full mt-2",
                        event.isCompleted ? "bg-green-500" : "bg-gray-300"
                      )} />
                      {index < tracking.trackingEvents.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 ml-1 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
                            {event.description}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 ml-2">
                          {new Date(event.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </MobileCard>
        </MobileSection>

        {/* Need Help */}
        <MobileSection>
          <MobileCard>
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Contact our customer support team for any questions about your order.
                  </p>
                  <div className="flex space-x-2">
                    <TouchButton
                      onClick={() => window.open('tel:+923001234567')}
                      variant="outline"
                      size="sm"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Support
                    </TouchButton>
                    <TouchButton
                      onClick={() => window.open('mailto:support@mcnmart.com')}
                      variant="outline"
                      size="sm"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </TouchButton>
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
