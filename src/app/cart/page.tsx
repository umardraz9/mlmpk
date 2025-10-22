'use client';

import ProductHeader from '@/components/ProductHeader';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Gift,
  CreditCard,
  Truck,
  Star,
  ArrowRight,
  Tag,
  Percent,
  Heart,
  Share2,
  Calculator,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number;
    images: string[];
    inStock: boolean;
    category?: {
      name: string;
      color?: string;
    };
  };
}

interface CartData {
  cart: {
    id: string;
    items: CartItem[];
  };
  totals: {
    subtotal: number;
    itemCount: number;
    shipping: number;
    total: number;
  };
}

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voucherBalance, setVoucherBalance] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState(0);
  const [promoCode, setPromoCode] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/cart');
    }
  }, [status, router]);

  // Fetch cart data
  useEffect(() => {
    if (session?.user) {
      fetchCart();
      fetchVoucherBalance();
    }
  }, [session]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cart');
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      const data = await response.json();
      setCartData(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoucherBalance = async () => {
    try {
      const res = await fetch('/api/user/stats');
      if (res.ok) {
        const data = await res.json();
        setVoucherBalance(Number(data?.voucherBalance) || 0);
      }
    } catch (error) {
      console.error('Error fetching voucher balance:', error);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(itemId);
      return;
    }

    try {
      setUpdating(itemId);
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update quantity');
      }

      await fetchCart(); // Refresh cart data
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError(error instanceof Error ? error.message : 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setUpdating(itemId);
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove item');
      }

      await fetchCart(); // Refresh cart data
    } catch (error) {
      console.error('Error removing item:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const applyVoucher = (amount: number) => {
    if (cartData) {
      setAppliedVoucher(Math.min(amount, voucherBalance, cartData.totals.subtotal));
    }
  };

  const proceedToCheckout = () => {
    if (cartData && cartData.cart.items.length > 0) {
      // Store cart data for checkout
      const checkoutData = {
        items: cartData.cart.items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.price,
          originalPrice: item.product.comparePrice,
          image: item.product.images[0] || '/api/placeholder/120/120',
          rating: 4.5, // Default rating
          reviews: 100, // Default reviews
          category: item.product.category?.name || 'General',
          description: item.product.name,
          quantity: item.quantity,
          voucherEligible: true,
          discount: item.product.comparePrice ? item.product.comparePrice - item.price : 0
        })),
        voucherDiscount: appliedVoucher,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('checkout_cart', JSON.stringify(checkoutData));
      router.push('/checkout');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading your cart...</h2>
          <p className="text-gray-600">Please wait while we fetch your items</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  const cartItems = cartData?.cart.items || [];
  const totals = cartData?.totals || { subtotal: 0, itemCount: 0, shipping: 0, total: 0 };
  const subtotal = totals.subtotal;
  const shipping = totals.shipping;
  const total = subtotal - appliedVoucher + shipping;
  const savings = cartItems.reduce((sum, item) => 
    sum + ((item.product.comparePrice || item.price) - item.price) * item.quantity, 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <ProductHeader
        showSearch={false}
        showCategories={false}
        title="Shopping Cart"
        subtitle={`${cartItems.length} items in your cart • Use your vouchers to save more!`}
      />

      <div className="max-w-7xl mx-auto py-8 px-4">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="border-gray-200 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Product Image */}
                    <div className="relative">
                      <img
                        src={item.product.images[0] || '/api/placeholder/120/120'}
                        alt={item.product.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      {!item.product.inStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Out of Stock</span>
                        </div>
                      )}
                      <Badge className="absolute -top-2 -right-2 bg-green-600 text-white text-xs">
                        <Gift className="h-3 w-3 mr-1" />
                        Voucher
                      </Badge>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{item.product.name}</h3>
                          <p className="text-sm text-gray-600">{item.product.category?.name || 'General'}</p>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">4.5</span>
                            <span className="text-sm text-gray-500">(100)</span>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xl font-bold text-gray-900">
                              PKR {item.price.toLocaleString()}
                            </span>
                            {item.product.comparePrice && (
                              <span className="text-lg text-gray-500 line-through">
                                PKR {item.product.comparePrice.toLocaleString()}
                              </span>
                            )}
                            {item.product.comparePrice && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Save PKR {(item.product.comparePrice - item.price).toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeItem(item.id)}
                            disabled={updating === item.id}
                          >
                            <Link href={`/products/${item.product.slug || item.product.id}`} className="text-green-600 hover:text-green-700">View Product</Link>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">Quantity:</span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={!item.product.inStock || updating === item.id}
                            >
                              {updating === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minus className="h-3 w-3" />}
                            </Button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={!item.product.inStock || updating === item.id}
                            >
                              {updating === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            PKR {item.subtotal.toLocaleString()}
                          </p>
                          {item.product.comparePrice && (
                            <p className="text-sm text-green-600">
                              You save PKR {((item.product.comparePrice - item.price) * item.quantity).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {!item.product.inStock && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">This item is currently out of stock and will be removed at checkout.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {cartItems.length === 0 && (
              <Card className="border-gray-200 text-center py-12">
                <CardContent>
                  <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-6">Add some products to get started!</p>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Voucher Section */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Gift className="h-5 w-5" />
                  Use Your Vouchers
                </CardTitle>
                <CardDescription className="text-green-700">
                  Available balance: PKR {voucherBalance.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => applyVoucher(250)}
                    disabled={appliedVoucher > 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Use PKR 250
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => applyVoucher(500)}
                    disabled={appliedVoucher > 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Use PKR 500
                  </Button>
                </div>
                {appliedVoucher > 0 && (
                  <div className="flex items-center justify-between p-2 bg-white rounded border border-green-300">
                    <span className="text-sm text-green-800">Voucher Applied</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-green-800">-PKR {appliedVoucher}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAppliedVoucher(0)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Promo Code */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-purple-600" />
                  Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <Button variant="outline">
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">PKR {subtotal.toLocaleString()}</span>
                </div>
                
                {savings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Product Savings</span>
                    <span className="font-medium">-PKR {savings.toLocaleString()}</span>
                  </div>
                )}
                
                {appliedVoucher > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Voucher Discount</span>
                    <span className="font-medium">-PKR {appliedVoucher.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `PKR ${shipping}`
                    )}
                  </span>
                </div>
                
                {shipping === 0 && (
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Free shipping on orders over PKR 5,000
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">PKR {total.toLocaleString()}</span>
                  </div>
                  {savings + appliedVoucher > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      You save PKR {(savings + appliedVoucher).toLocaleString()} total!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Checkout Button */}
            <Button 
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 text-lg font-semibold"
              disabled={cartItems.length === 0 || cartItems.some(item => !item.product.inStock) || updating !== null}
              onClick={proceedToCheckout}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Proceed to Checkout
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            {/* Security Notice */}
            <div className="text-center text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Secure Checkout</span>
              </div>
              <p>256-bit SSL encryption • MCNmart trusted payments</p>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        <div className="mt-12 bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <img
                  src={`/api/placeholder/150/150`}
                  alt="Product"
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h4 className="font-semibold text-gray-900 mb-2">Recommended Product {i}</h4>
                <p className="text-green-600 font-bold">PKR 2,500</p>
                <Button size="sm" className="mt-2 w-full">
                  Add to Cart
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 