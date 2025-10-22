'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ProductHeader from '@/components/ProductHeader';

// Import optimized components
import { CartItemsList } from '@/components/checkout/CartItemsList';
import { OrderSummaryCard } from '@/components/checkout/OrderSummaryCard';
import { ShippingAddressCard } from '@/components/checkout/ShippingAddressCard';
import { PaymentMethodCard } from '@/components/checkout/PaymentMethodCard';
import { OrderSuccessCard } from '@/components/checkout/OrderSuccessCard';
import { CheckoutSkeleton } from '@/components/checkout/CheckoutSkeleton';

interface CartItem {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  description: string;
  quantity: number;
  voucherEligible: boolean;
  discount?: number;
}

interface CheckoutData {
  items: CartItem[];
  voucherDiscount: number;
  timestamp: string;
}

interface OrderSummary {
  subtotal: number;
  voucherDiscount: number;
  shipping: number;
  total: number;
  cashbackEarned: number;
  savings: number;
}

interface PaymentSettingOption {
  id: string;
  name?: string;
  type: string;
  accountName?: string;
  accountTitle?: string;
  accountNumber?: string;
  bankName?: string | null;
  branchCode?: string | null;
  instructions?: string | null;
}

interface PlacedOrder {
  id: string;
  orderNumber: string;
}

interface OrderContact {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

const mockUserData = {
  id: 'user_123',
  name: 'Ahmed Khan',
  email: 'ahmed.khan@email.com',
  phone: '+92 300 1234567',
  voucherBalance: 500,
  address: {
    street: 'House 123, Street 45, F-8',
    city: 'Islamabad',
    province: 'Islamabad Capital Territory',
    postalCode: '44000'
  },
  hasActivatedInvestment: true
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { cartItems, clearCart, isLoading, refreshCart } = useCart();
  
  // State management
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'jazzcash' | 'easypaisa' | 'bank' | 'card' | 'cod'>('jazzcash');
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  // Manual payment state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingOption[]>([]);
  const [showManualUpload, setShowManualUpload] = useState(false);
  const [selectedPaymentSettingId, setSelectedPaymentSettingId] = useState<string>('');
  const [manualProofFile, setManualProofFile] = useState<File | null>(null);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  
  // Voucher state
  const [voucherUsed, setVoucherUsed] = useState<number>(0);
  const [voucherBalance, setVoucherBalance] = useState<number>(0);
  
  // Address state
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [orderContact, setOrderContact] = useState<OrderContact>({
    name: mockUserData.name,
    email: mockUserData.email,
    phone: mockUserData.phone,
    address: mockUserData.address.street,
    city: mockUserData.address.city,
    province: mockUserData.address.province,
    postalCode: mockUserData.address.postalCode,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/checkout');
    }
  }, [status, router]);

  // Load cart data and user info
  useEffect(() => {
    if (cartItems.length > 0) {
      const checkoutItems = cartItems.map((item, idx) => ({
        id: idx + 1,
        name: item.product.name,
        price: item.price,
        originalPrice: item.product.comparePrice,
        image: item.product.images[0] || '/api/placeholder/120/120',
        rating: 4.5,
        reviews: 100,
        category: item.product.category?.name || 'General',
        description: item.product.name,
        quantity: item.quantity,
        voucherEligible: true,
        discount: item.product.comparePrice ? Math.round(((item.product.comparePrice - item.price) / item.product.comparePrice) * 100) : undefined
      }));

      setCheckoutData({
        items: checkoutItems,
        voucherDiscount: 0,
        timestamp: new Date().toISOString()
      });
    } else {
      // Try to load from localStorage as fallback
      const savedCart = localStorage.getItem('checkout_cart');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          setCheckoutData(parsed);
        } catch (error) {
          console.error('Failed to parse saved cart:', error);
        }
      }
    }

    // Load user voucher balance
    setVoucherBalance(mockUserData.voucherBalance);
  }, [cartItems]);

  // Load payment settings
  useEffect(() => {
    const loadPaymentSettings = async () => {
      try {
        const response = await fetch('/api/payment-methods');
        if (response.ok) {
          const data = await response.json();
          setPaymentSettings(data.settings || []);
        }
      } catch (error) {
        console.error('Failed to load payment settings:', error);
      }
    };

    if (status === 'authenticated') {
      loadPaymentSettings();
    }
  }, [status]);

  // Calculate order summary
  useEffect(() => {
    if (!checkoutData) return;

    const subtotal = checkoutData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const voucherDiscount = Math.min(voucherUsed, subtotal);
    const shipping = subtotal > 2000 ? 0 : 150; // Free shipping over PKR 2000
    const total = subtotal - voucherDiscount + shipping;
    
    const cashbackEarned = Math.floor(total * 0.02); // 2% cashback
    const savings = checkoutData.items.reduce((sum, item) => {
      if (item.originalPrice) {
        return sum + ((item.originalPrice - item.price) * item.quantity);
      }
      return sum;
    }, 0) + voucherDiscount;

    setOrderSummary({
      subtotal,
      voucherDiscount,
      shipping,
      total,
      cashbackEarned,
      savings
    });
  }, [checkoutData, voucherUsed]);

  const handlePlaceOrder = async () => {
    if (!checkoutData || !orderSummary) return;

    setProcessing(true);
    setNotification(null);

    try {
      // Validate manual payment requirements
      const isManualPayment = ['jazzcash', 'easypaisa', 'bank'].includes(paymentMethod);
      if (isManualPayment && (!selectedPaymentSettingId || !manualProofFile)) {
        setNotification({
          type: 'error',
          message: 'Please select a payment method and upload payment proof.'
        });
        setProcessing(false);
        return;
      }

      // Create order
      const orderData = {
        items: checkoutData.items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: orderContact,
        paymentMethod,
        voucherUsed,
        total: orderSummary.total,
        useCustomAddress
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const orderResult = await response.json();
      setPlacedOrder(orderResult.order);

      // Handle manual payment proof upload
      if (isManualPayment && manualProofFile && selectedPaymentSettingId) {
        const formData = new FormData();
        formData.append('paymentProof', manualProofFile);
        formData.append('paymentMethodId', selectedPaymentSettingId);
        formData.append('amount', orderSummary.total.toString());
        formData.append('orderId', orderResult.order.id);
        formData.append('orderNumber', orderResult.order.orderNumber);
        formData.append('transactionId', `ORDER-${orderResult.order.orderNumber}`);

        const proofResponse = await fetch('/api/payment/manual-payment', {
          method: 'POST',
          body: formData
        });

        if (proofResponse.ok) {
          setProofSubmitted(true);
          localStorage.setItem('pendingManualPayment', '1');
        }
      }

      // Clear cart and show success
      clearCart();
      localStorage.removeItem('checkout_cart');
      setOrderSuccess(true);
      
      setNotification({
        type: 'success',
        message: 'Order placed successfully!'
      });

    } catch (error) {
      console.error('Order placement failed:', error);
      setNotification({
        type: 'error',
        message: 'Failed to place order. Please try again.'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleContinueShopping = () => {
    router.push('/products');
  };

  const handleViewOrder = () => {
    if (placedOrder) {
      router.push(`/orders/${placedOrder.id}`);
    }
  };

  // Show loading skeleton
  if (status === 'loading' || isLoading) {
    return <CheckoutSkeleton />;
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  // Show success page
  if (orderSuccess && placedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ProductHeader />
        <div className="container mx-auto px-4 py-8">
          <OrderSuccessCard
            placedOrder={placedOrder}
            proofSubmitted={proofSubmitted}
            paymentMethod={paymentMethod}
            onContinueShopping={handleContinueShopping}
            onViewOrder={handleViewOrder}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ProductHeader />
      
      {/* Back Button */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {notification.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <Suspense fallback={<div className="animate-pulse bg-white rounded-lg h-64"></div>}>
              <CartItemsList
                items={checkoutData?.items || []}
                isLoading={!checkoutData}
              />
            </Suspense>

            {/* Shipping Address */}
            <Suspense fallback={<div className="animate-pulse bg-white rounded-lg h-48"></div>}>
              <ShippingAddressCard
                orderContact={orderContact}
                useCustomAddress={useCustomAddress}
                onContactChange={setOrderContact}
                onCustomAddressToggle={setUseCustomAddress}
                isProcessing={processing}
              />
            </Suspense>

            {/* Payment Method */}
            <Suspense fallback={<div className="animate-pulse bg-white rounded-lg h-96"></div>}>
              <PaymentMethodCard
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                paymentSettings={paymentSettings}
                selectedPaymentSettingId={selectedPaymentSettingId}
                onPaymentSettingChange={setSelectedPaymentSettingId}
                showManualUpload={showManualUpload}
                onShowManualUpload={setShowManualUpload}
                manualProofFile={manualProofFile}
                onProofFileChange={setManualProofFile}
                isProcessing={processing}
              />
            </Suspense>
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            {orderSummary && (
              <Suspense fallback={<div className="animate-pulse bg-white rounded-lg h-96"></div>}>
                <OrderSummaryCard
                  orderSummary={orderSummary}
                  voucherUsed={voucherUsed}
                  voucherBalance={voucherBalance}
                  onVoucherChange={setVoucherUsed}
                  isProcessing={processing}
                />
              </Suspense>
            )}

            {/* Place Order Button */}
            <div className="mt-6">
              <Button
                onClick={handlePlaceOrder}
                disabled={processing || !checkoutData || !orderSummary}
                className="w-full h-12 text-lg font-semibold"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Place Order - PKR ${orderSummary?.total.toLocaleString() || '0'}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
