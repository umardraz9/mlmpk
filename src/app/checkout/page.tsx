'use client';

import ProductHeader from '@/components/ProductHeader';
import OrderSuccessModal from '@/components/OrderSuccessModal';
import CartEmptyModal from '@/components/CartEmptyModal';
import PaymentProofSuccessModal from '@/components/PaymentProofSuccessModal';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  CreditCard,
  Truck,
  Shield,
  Gift,
  CheckCircle,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Package,
  Calculator,
  Banknote,
  Star,
  AlertCircle,
  Loader2
} from 'lucide-react';

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

// Manual payment settings option shape as returned by /api/payment-methods
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

interface PlacedOrder { id: string; orderNumber: string }

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
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  // Shipping address is handled inline for now; local state removed to reduce lints
  const [paymentMethod, setPaymentMethod] = useState<'jazzcash' | 'easypaisa' | 'bank' | 'card' | 'cod'>('jazzcash');
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [showCartEmpty, setShowCartEmpty] = useState(false);
  const [showPaymentProofSuccess, setShowPaymentProofSuccess] = useState(false);
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

  // Allow editing address/phone just for this order
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [orderContact, setOrderContact] = useState({
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

  // Load cart data from context or localStorage and user info
  useEffect(() => {
    // If we have items from context, use them
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
        discount: item.product.comparePrice ? item.product.comparePrice - item.price : 0
      }));

      setCheckoutData({
        items: checkoutItems,
        voucherDiscount: 0,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Otherwise try to hydrate from localStorage (saved by Cart page)
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('checkout_cart') : null;
      if (saved) {
        type StoredItem = Partial<CartItem> & { id?: string | number };
        const parsed = JSON.parse(saved) as Partial<CheckoutData> & { items?: StoredItem[] };
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          const items = parsed.items.map((it: StoredItem, idx: number) => ({
            id: typeof it.id === 'number' ? it.id : (Number(it.id) || idx + 1),
            name: it.name,
            price: it.price,
            originalPrice: it.originalPrice,
            image: it.image,
            rating: it.rating ?? 4.5,
            reviews: it.reviews ?? 100,
            category: it.category ?? 'General',
            description: it.description ?? it.name,
            quantity: it.quantity ?? 1,
            voucherEligible: it.voucherEligible ?? true,
            discount: it.discount ?? 0,
          }));
          const nextData: CheckoutData = {
            items,
            voucherDiscount: parsed.voucherDiscount ?? 0,
            timestamp: parsed.timestamp || new Date().toISOString(),
          };
          setCheckoutData(nextData);
          setVoucherUsed(nextData.voucherDiscount || 0);
          setNotification({ type: 'info', message: 'Loaded cart from previous session.' });
          setTimeout(() => setNotification(null), 2000);
          // Proactively refresh server cart in background
          refreshCart();
          return;
        }
      }
    } catch {
      // ignore parse errors
    }

    // If nothing to show and not loading, go back to cart
    // Guard: don't redirect if we've already placed an order or are in manual upload flow
    if (!isLoading && !orderSuccess && !showManualUpload && !placedOrder) {
      router.push('/cart');
    }
  }, [cartItems, isLoading, refreshCart, router, orderSuccess, showManualUpload, placedOrder]);

  // Calculate order summary
  useEffect(() => {
    if (checkoutData) {
      const subtotal = checkoutData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const voucherDiscount = Math.min(Math.max(0, voucherUsed || 0), subtotal);
      const shipping = subtotal >= 5000 ? 0 : 299; // Free shipping above PKR 5,000
      const total = subtotal - voucherDiscount + shipping;
      const cashbackEarned = Math.round(total * 0.10); // 10% cashback
      const savings = checkoutData.items.reduce((sum, item) => {
        const originalPrice = item.originalPrice || item.price;
        return sum + ((originalPrice - item.price) * item.quantity);
      }, 0) + voucherDiscount;

      setOrderSummary({
        subtotal,
        voucherDiscount,
        shipping,
        total,
        cashbackEarned,
        savings
      });
    }
  }, [checkoutData, voucherUsed]);

  // Load active admin-configured payment settings for manual payments
  useEffect(() => {
    const loadPaymentSettings = async () => {
      try {
        const res = await fetch('/api/payment-methods');
        if (res.ok) {
          const data = await res.json();
          setPaymentSettings(data.paymentMethods || []);
        }
      } catch {
        // ignore
      }
    };
    loadPaymentSettings();
  }, []);

  // Fetch user's voucher wallet balance
  useEffect(() => {
    let ignore = false;
    const loadWallet = async () => {
      try {
        const res = await fetch('/api/user/wallet', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) setVoucherBalance(Number(data.availableVoucherPkr || 0));
      } catch {
        // ignore
      }
    };
    loadWallet();
    return () => { ignore = true };
  }, []);

  // Persist voucherUsed in localStorage (under checkout_cart) to survive refreshes
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('checkout_cart') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.voucherDiscount = voucherUsed || 0;
        localStorage.setItem('checkout_cart', JSON.stringify(parsed));
      }
    } catch {}
  }, [voucherUsed]);

  // Ensure server-side cart in Supabase matches client cart before placing order
  const preSyncServerCart = async () => {
    try {
      console.log('[CHECKOUT] Pre-sync: fetching server cart');
      const res = await fetch('/api/cart', { cache: 'no-store' });
      const data = res.ok ? await res.json() : { cart: { items: [] } };
      const serverItems: Array<{ id: string; productId: string; quantity: number }>
        = data?.cart?.items || [];

      const serverByProduct = new Map<string, { id: string; quantity: number }>();
      for (const s of serverItems) {
        serverByProduct.set(s.productId, { id: s.id, quantity: s.quantity });
      }

      const client = cartItems.map(ci => ({ productId: ci.product.id, quantity: ci.quantity }));
      const clientByProduct = new Map<string, number>();
      for (const c of client) clientByProduct.set(c.productId, c.quantity);

      // Remove server items not present in client cart
      for (const s of serverItems) {
        if (!clientByProduct.has(s.productId)) {
          await fetch(`/api/cart/${s.id}`, { method: 'DELETE' });
        }
      }

      // Upsert client items
      for (const c of client) {
        const existing = serverByProduct.get(c.productId);
        if (existing) {
          if (existing.quantity !== c.quantity) {
            await fetch(`/api/cart/${existing.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quantity: c.quantity })
            });
          }
        } else {
          await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: c.productId, quantity: c.quantity })
          });
        }
      }

      await refreshCart();
      console.log('[CHECKOUT] Pre-sync: server cart synced');
    } catch (e) {
      console.error('[CHECKOUT] Pre-sync error:', e);
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCheckout = async () => {
    if (!orderSummary) return;

    try {
      setProcessing(true);

      // Check if cart is empty
      if (!cartItems || cartItems.length === 0) {
        console.log('[CHECKOUT] Cart is empty, showing cart empty modal...');
        setShowCartEmpty(true);
        return;
      }

      // Create order first
      console.log('[CHECKOUT] Creating order...');
      const orderNumber = `MCN${Date.now()}`;
      setPlacedOrder({ id: 'order-' + Date.now(), orderNumber });
      
      // If manual payment method (JazzCash, EasyPaisa, Bank), show upload form
      if (['jazzcash', 'easypaisa', 'bank'].includes(paymentMethod)) {
        console.log('[CHECKOUT] Manual payment - showing upload form...');
        setShowManualUpload(true);
        showNotification('info', `Order ${orderNumber} created. Please upload payment proof.`);
      } else {
        // Card or COD - show regular order success immediately
        console.log('[CHECKOUT] Card/COD payment - showing success...');
        setProofSubmitted(false);
        setOrderSuccess(true);
        showNotification('success', 'Order placed successfully!');
      }
      
    } catch (error) {
      console.error('Checkout failed:', error);
      showNotification('error', 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleManualProofUpload = async () => {
    if (!manualProofFile || !selectedPaymentSettingId || !orderSummary) {
      showNotification('error', 'Please select a payment method and upload a screenshot.');
      return;
    }
    try {
      setProcessing(true);
      const fd = new FormData();
      fd.append('paymentProof', manualProofFile);
      fd.append('paymentMethodId', selectedPaymentSettingId || '');
      fd.append('paymentMethodName', paymentMethod.toUpperCase());
      fd.append('amount', String(orderSummary.total));
      if (placedOrder?.id) {
        fd.append('orderId', placedOrder.id);
      }
      if (placedOrder?.orderNumber) {
        fd.append('orderNumber', placedOrder.orderNumber);
      }
      if (placedOrder?.orderNumber) {
        fd.append('transactionId', `ORDER-${placedOrder.orderNumber}`);
      }
      console.log('[CHECKOUT] Uploading payment proof...');
      const res = await fetch('/api/payment/manual-payment', { method: 'POST', body: fd });
      const data = await res.json();
      console.log('[CHECKOUT] Payment proof response:', { status: res.status, data });
      
      // Handle both success response and any response with success flag
      if (res.ok && (data.success || data.paymentId)) {
        console.log('[CHECKOUT] Payment proof accepted, setting success state...');
        setProofSubmitted(true);
        setShowManualUpload(false);
        setShowPaymentProofSuccess(true);
        try { localStorage.setItem('pendingManualPayment', '1'); } catch {}
      } else {
        throw new Error(data.error || 'Failed to submit payment proof');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to submit payment proof';
      console.error('[CHECKOUT] Error uploading proof:', msg);
      showNotification('error', msg);
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'loading' || !checkoutData || !orderSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-green-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading checkout...</h2>
          <p className="text-gray-600">Please wait while we prepare your order</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  // Show success modal when order is placed
  if (orderSuccess && placedOrder && orderSummary) {
    return (
      <>
        <ProductHeader />
        <OrderSuccessModal
          isOpen={orderSuccess}
          orderNumber={placedOrder.orderNumber}
          proofSubmitted={proofSubmitted}
          total={orderSummary.total}
          cashbackEarned={orderSummary.cashbackEarned}
          savings={orderSummary.savings}
          onClose={() => {
            setOrderSuccess(false);
            router.push('/orders');
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <ProductHeader
        showSearch={false}
        showCategories={false}
        title="Checkout"
      />


      <div className="max-w-4xl mx-auto py-8 px-4">

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items ({checkoutData.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {checkoutData.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="relative w-20 h-20">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-500">{item.rating}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          {item.voucherEligible && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <Gift className="h-3 w-3 mr-1" />
                              Voucher
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            PKR {item.price.toLocaleString()}
                          </span>
                          {item.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              PKR {item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        <p className="font-medium text-gray-900">
                          PKR {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method (moved from sidebar) */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <CreditCard className="h-5 w-5" />
                  Choose Payment Method
                </CardTitle>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Select your preferred payment option</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    variant={paymentMethod === 'jazzcash' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('jazzcash')}
                    className="flex items-center gap-3 h-14 text-base font-semibold"
                  >
                    <Banknote className="h-6 w-6" />
                    JazzCash
                  </Button>
                  <Button
                    variant={paymentMethod === 'easypaisa' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('easypaisa')}
                    className="flex items-center gap-3 h-14 text-base font-semibold"
                  >
                    <Banknote className="h-6 w-6" />
                    EasyPaisa
                  </Button>
                  <Button
                    variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('bank')}
                    className="flex items-center gap-3 h-14 text-base font-semibold"
                  >
                    <CreditCard className="h-6 w-6" />
                    Bank Transfer
                  </Button>
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('card')}
                    className="flex items-center gap-3 h-14 text-base font-semibold"
                  >
                    <CreditCard className="h-6 w-6" />
                    Card
                  </Button>
                  <Button
                    variant={paymentMethod === 'cod' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('cod')}
                    className="flex items-center gap-3 h-14 text-base font-semibold col-span-1 sm:col-span-2"
                  >
                    <CreditCard className="h-6 w-6" />
                    Cash on Delivery
                  </Button>
                </div>

                {/* Payment Method Details */}
                {paymentMethod === 'jazzcash' && (
                  <div className="mt-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4">
                    <h4 className="font-semibold text-orange-900 mb-3">💳 Send Payment to This Account</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="font-medium">Account Name:</span><p className="font-semibold">MCNmart Admin</p></div>
                      <div><span className="font-medium">Account Number:</span><p className="font-mono font-semibold">03012023346</p></div>
                    </div>
                  </div>
                )}
                {paymentMethod === 'easypaisa' && (
                  <div className="mt-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4">
                    <h4 className="font-semibold text-orange-900 mb-3">💳 Send Payment to This Account</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="font-medium">Account Name:</span><p className="font-semibold">MCNmart Admin</p></div>
                      <div><span className="font-medium">Account Number:</span><p className="font-mono font-semibold">03136965408</p></div>
                    </div>
                  </div>
                )}
                {paymentMethod === 'bank' && (
                  <div className="mt-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-4">
                    <h4 className="font-semibold text-orange-900 mb-3">💳 Send Payment to This Account</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="font-medium">Account Name:</span><p className="font-semibold">Muhammad Umar Draz</p></div>
                      <div><span className="font-medium">Account Number:</span><p className="font-mono font-semibold">01202222233255</p></div>
                      <div><span className="font-medium">Bank:</span><p className="font-semibold">Bank of Punjab</p></div>
                    </div>
                  </div>
                )}
                {/* Manual Payment Proof Upload Section */}
                {showManualUpload && (
                  <div className="mt-4 border-t pt-4 space-y-3">
                    <Alert className="border-green-500 bg-green-50">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Thank you! Order {placedOrder?.orderNumber} has been created. Upload your payment proof below.
                        </AlertDescription>
                      </div>
                    </Alert>
                    {/* Highlighted Payment Proof Upload */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
                      <label htmlFor="paymentProofInline" className="block text-base font-semibold text-blue-900 dark:text-blue-100 mb-3">
                        📸 Upload Payment Proof (Required)
                      </label>
                      <input
                        id="paymentProofInline"
                        title="Upload payment proof image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setManualProofFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-2 file:border-blue-300 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-green-500 file:text-white hover:file:from-blue-600 hover:file:to-green-600 file:shadow-lg file:transition-all file:duration-200"
                      />
                      {manualProofFile && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          File selected: {manualProofFile.name}
                        </p>
                      )}
                    </div>

                    {/* Payment Method Selection for Admin Accounts */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Payment Account:
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {paymentSettings.map((account) => (
                          <label key={account.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name="paymentSetting"
                              value={account.id}
                              checked={selectedPaymentSettingId === account.id}
                              onChange={(e) => setSelectedPaymentSettingId(e.target.value)}
                              className="text-blue-600"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">{account.accountName || account.accountTitle}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{account.accountNumber}</p>
                              {account.bankName && (
                                <p className="text-xs text-gray-500">{account.bankName}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Highlighted Submit Button */}
                    <div className="flex justify-center">
                      <Button
                        onClick={handleManualProofUpload}
                        disabled={processing || !manualProofFile || !selectedPaymentSettingId}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        {processing ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Submitting Payment Proof...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Submit Payment Proof
                          </div>
                        )}
                      </Button>
                    </div>
                    {!selectedPaymentSettingId && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                        Tip: Select the admin payment account above where you sent your payment.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information (moved from left) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{mockUserData.name}</p>
                      <p className="text-sm text-gray-600">{mockUserData.address.street}</p>
                      <p className="text-sm text-gray-600">
                        {mockUserData.address.city}, {mockUserData.address.province} {mockUserData.address.postalCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">{mockUserData.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">{mockUserData.email}</span>
                  </div>

                  {/* Use different address and phone for this order */}
                  <div className="mt-4 border-t pt-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={useCustomAddress}
                        onChange={(e) => setUseCustomAddress(e.target.checked)}
                      />
                      Use a different address and phone number for this order
                    </label>

                    {useCustomAddress && (
                      <div className="space-y-3 mt-3">
                        <div>
                          <Label htmlFor="address">Delivery Address</Label>
                          <Input 
                            id="address" 
                            placeholder="House/Flat number, Street name"
                            value={orderContact.address} 
                            onChange={(e) => setOrderContact({ ...orderContact, address: e.target.value })} 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input 
                              id="city" 
                              value={orderContact.city} 
                              onChange={(e) => setOrderContact({ ...orderContact, city: e.target.value })} 
                            />
                          </div>
                          <div>
                            <Label htmlFor="prov">Province</Label>
                            <Input 
                              id="prov" 
                              value={orderContact.province} 
                              onChange={(e) => setOrderContact({ ...orderContact, province: e.target.value })} 
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="pc">Postal Code</Label>
                            <Input 
                              id="pc" 
                              value={orderContact.postalCode} 
                              onChange={(e) => setOrderContact({ ...orderContact, postalCode: e.target.value })} 
                            />
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input 
                              id="phone" 
                              placeholder="+92 300 1234567"
                              value={orderContact.phone} 
                              onChange={(e) => setOrderContact({ ...orderContact, phone: e.target.value })} 
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="border-2 border-green-100 dark:border-green-900/50">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                  <Calculator className="h-5 w-5" />
                  Order Summary
                </CardTitle>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">Review your order details</p>
              </CardHeader>
              <CardContent className="pt-6">
                {orderSummary && (
                  <div className="space-y-4">
                    {/* Shopping Voucher Apply */}
                    <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="voucherUsed" className="text-sm font-medium">Use Shopping Voucher</Label>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Available: PKR {voucherBalance.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          id="voucherUsed"
                          type="number"
                          min={0}
                          max={Math.min(voucherBalance, orderSummary.subtotal)}
                          value={voucherUsed}
                          onChange={(e) => {
                            const raw = Number(e.target.value || 0);
                            const capped = Math.max(0, Math.min(raw, Math.min(voucherBalance, orderSummary.subtotal)));
                            setVoucherUsed(capped);
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => setVoucherUsed(Math.min(voucherBalance, orderSummary.subtotal))}
                        >
                          Max
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => setVoucherUsed(0)}
                        >
                          Clear
                        </Button>
                      </div>
                      {voucherUsed > voucherBalance && (
                        <p className="text-xs text-red-600 mt-1">Amount exceeds available voucher balance.</p>
                      )}
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="font-medium">PKR {orderSummary.subtotal.toLocaleString()}</span>
                    </div>
                    
                    {orderSummary.voucherDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Voucher Discount:</span>
                        <span className="font-medium">-PKR {orderSummary.voucherDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                      <span className="font-medium">
                        {orderSummary.shipping === 0 ? 'Free' : `PKR ${orderSummary.shipping.toLocaleString()}`}
                      </span>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total:</span>
                        <span>PKR {orderSummary.total.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Your Benefits</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-green-700 dark:text-green-300">
                          <span>Cashback (10%):</span>
                          <span className="font-medium">PKR {orderSummary.cashbackEarned.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-green-700 dark:text-green-300">
                          <span>Total Savings:</span>
                          <span className="font-medium">PKR {orderSummary.savings.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Place Order CTA */}
                    <div className="mt-6">
                      <Button
                        onClick={handleCheckout}
                        disabled={processing || showManualUpload}
                        className="w-full h-12 text-base bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processing ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Placing order...
                          </div>
                        ) : showManualUpload ? (
                          <div className="flex items-center gap-2">
                            📸 Upload Payment Proof (Required)
                          </div>
                        ) : (
                          ['jazzcash','easypaisa','bank'].includes(paymentMethod)
                            ? 'Place Order & Upload Proof'
                            : 'Place Order'
                        )}
                      </Button>
                      {(['jazzcash','easypaisa','bank'].includes(paymentMethod)) && !showManualUpload && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                          After placing the order, you will be asked to upload your payment screenshot.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Trust
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-700">Secure Payment Processing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-700">MLM Commission Protected</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-700">Fast & Reliable Delivery</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-700">24/7 Customer Support</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proof upload is now shown inline in the Payment Method card when showManualUpload is true */}
          </div>
        </div>
      </div>

      {/* Cart Empty Modal */}
      <CartEmptyModal
        isOpen={showCartEmpty}
        onClose={() => setShowCartEmpty(false)}
      />

      {/* Payment Proof Success Modal */}
      <PaymentProofSuccessModal
        isOpen={showPaymentProofSuccess}
        orderNumber={placedOrder?.orderNumber || ''}
        onClose={() => {
          setShowPaymentProofSuccess(false);
          setOrderSuccess(true);
        }}
      />
    </div>
  );
}