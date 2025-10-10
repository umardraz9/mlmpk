'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Star, 
  Camera, 
  Send, 
  ThumbsUp, 
  ThumbsDown,
  Package,
  Truck,
  User,
  MessageSquare,
  CheckCircle,
  Upload
} from 'lucide-react';
import { 
  MobileLayout, 
  MobilePageContainer, 
  MobileSection, 
  MobileCard 
} from '@/components/layout/mobile-layout';
import { TouchButton, TouchInput } from '@/components/ui/mobile-touch';
import { MobileLoading } from '@/components/ui/mobile-loading';
import { MobileError } from '@/components/ui/mobile-error';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  productId: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  deliveredAt: string;
}

interface ProductReview {
  productId: string;
  rating: number;
  comment: string;
  images: string[];
}

interface DeliveryReview {
  rating: number;
  comment: string;
  deliverySpeed: number;
  packagingQuality: number;
  courierBehavior: number;
}

export default function OrderReviewPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  const [deliveryReview, setDeliveryReview] = useState<DeliveryReview>({
    rating: 0,
    comment: '',
    deliverySpeed: 0,
    packagingQuality: 0,
    courierBehavior: 0
  });

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

    fetchOrderData();
  }, [orderId, session]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      
      if (data.success) {
        setOrder(data.order);
        // Initialize product reviews
        const initialReviews = data.order.items.map((item: OrderItem) => ({
          productId: item.productId,
          rating: 0,
          comment: '',
          images: []
        }));
        setProductReviews(initialReviews);
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

  const updateProductReview = (productId: string, field: keyof ProductReview, value: any) => {
    setProductReviews(prev => prev.map(review => 
      review.productId === productId 
        ? { ...review, [field]: value }
        : review
    ));
  };

  const updateDeliveryReview = (field: keyof DeliveryReview, value: any) => {
    setDeliveryReview(prev => ({ ...prev, [field]: value }));
  };

  const handleStarClick = (productId: string | null, rating: number, field?: string) => {
    if (productId) {
      updateProductReview(productId, 'rating', rating);
    } else if (field) {
      updateDeliveryReview(field as keyof DeliveryReview, rating);
    }
  };

  const renderStars = (rating: number, onStarClick: (rating: number) => void, size = 'h-6 w-6') => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchButton
            key={star}
            onClick={() => onStarClick(star)}
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <Star
              className={cn(
                size,
                star <= rating 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              )}
            />
          </TouchButton>
        ))}
      </div>
    );
  };

  const handleSubmitReviews = async () => {
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order?.id,
          productReviews: productReviews.filter(review => review.rating > 0),
          deliveryReview: deliveryReview.rating > 0 ? deliveryReview : null
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/orders');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to submit reviews');
      }
    } catch (err) {
      console.error('Error submitting reviews:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit reviews');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Review Order">
        <MobilePageContainer>
          <MobileLoading />
        </MobilePageContainer>
      </MobileLayout>
    );
  }

  if (error || !order) {
    return (
      <MobileLayout title="Review Order">
        <MobilePageContainer>
          <MobileError 
            message={error || 'Order not found'} 
            onRetry={fetchOrderData}
          />
        </MobilePageContainer>
      </MobileLayout>
    );
  }

  if (success) {
    return (
      <MobileLayout title="Review Submitted">
        <MobilePageContainer>
          <MobileSection>
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Thank You!
              </h1>
              <p className="text-gray-600 mb-4">
                Your reviews have been submitted successfully. They help us improve our service.
              </p>
              <TouchButton
                onClick={() => router.push('/orders')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Back to Orders
              </TouchButton>
            </div>
          </MobileSection>
        </MobilePageContainer>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout 
      title="Review Your Order"
      subtitle={`Order #${order.orderNumber}`}
      showBackButton
    >
      <MobilePageContainer>
        {/* Order Info */}
        <MobileSection>
          <MobileCard>
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Package className="h-6 w-6 text-green-600" />
                <div>
                  <div className="font-semibold text-gray-900">Order Delivered</div>
                  <div className="text-sm text-gray-600">
                    {new Date(order.deliveredAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Help other customers by sharing your experience with the products and delivery service.
              </p>
            </div>
          </MobileCard>
        </MobileSection>

        {/* Product Reviews */}
        <MobileSection>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rate Products</h2>
          {order.items.map((item) => {
            const review = productReviews.find(r => r.productId === item.productId);
            return (
              <MobileCard key={item.id} className="mb-4">
                <div className="p-4">
                  <div className="flex space-x-3 mb-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{item.name}</h3>
                      <div className="text-sm text-gray-600">
                        Qty: {item.quantity} × PKR {item.price}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Rate this product
                      </div>
                      {renderStars(
                        review?.rating || 0,
                        (rating) => handleStarClick(item.productId, rating)
                      )}
                    </div>

                    {(review?.rating || 0) > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Write a review (optional)
                        </label>
                        <textarea
                          value={review?.comment || ''}
                          onChange={(e) => updateProductReview(item.productId, 'comment', e.target.value)}
                          placeholder="Share your thoughts about this product..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </MobileCard>
            );
          })}
        </MobileSection>

        {/* Delivery Review */}
        <MobileSection>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rate Delivery Service</h2>
          <MobileCard>
            <div className="p-4 space-y-6">
              {/* Overall Delivery Rating */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Truck className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Overall delivery experience
                  </span>
                </div>
                {renderStars(
                  deliveryReview.rating,
                  (rating) => handleStarClick(null, rating, 'rating')
                )}
              </div>

              {deliveryReview.rating > 0 && (
                <>
                  {/* Detailed Ratings */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Delivery Speed
                      </div>
                      {renderStars(
                        deliveryReview.deliverySpeed,
                        (rating) => handleStarClick(null, rating, 'deliverySpeed'),
                        'h-5 w-5'
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Packaging Quality
                      </div>
                      {renderStars(
                        deliveryReview.packagingQuality,
                        (rating) => handleStarClick(null, rating, 'packagingQuality'),
                        'h-5 w-5'
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Courier Behavior
                      </div>
                      {renderStars(
                        deliveryReview.courierBehavior,
                        (rating) => handleStarClick(null, rating, 'courierBehavior'),
                        'h-5 w-5'
                      )}
                    </div>
                  </div>

                  {/* Delivery Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional feedback about delivery
                    </label>
                    <textarea
                      value={deliveryReview.comment}
                      onChange={(e) => updateDeliveryReview('comment', e.target.value)}
                      placeholder="Tell us about your delivery experience..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                    />
                  </div>
                </>
              )}
            </div>
          </MobileCard>
        </MobileSection>

        {/* Submit Button */}
        <MobileSection>
          <TouchButton
            onClick={handleSubmitReviews}
            disabled={submitting || (productReviews.every(r => r.rating === 0) && deliveryReview.rating === 0)}
            className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
          >
            {submitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting Reviews...
              </div>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Reviews
              </>
            )}
          </TouchButton>
          
          <TouchButton
            onClick={() => router.push('/orders')}
            variant="outline"
            className="w-full mt-3"
          >
            Skip for Now
          </TouchButton>
        </MobileSection>
      </MobilePageContainer>
    </MobileLayout>
  );
}
