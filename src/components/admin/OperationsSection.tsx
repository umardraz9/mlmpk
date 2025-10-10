'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Package, CreditCard, ArrowRight, Eye } from 'lucide-react';

interface RecentOrder {
  id: string;
  orderNumber: string;
  totalPkr: number;
  paymentStatus?: string | null;
  status?: string | null;
  createdAt: string;
  user?: { name?: string | null; email?: string | null };
}

interface PendingPayment {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  user?: { name?: string; email?: string };
}

interface OperationsSectionProps {
  recentOrders: RecentOrder[];
  pendingPayments: PendingPayment[];
  loading: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (iso: string) => new Date(iso).toLocaleString();

const orderStatusClass = (status?: string | null) => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'SHIPPED': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
    case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
    case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const paymentStatusClass = (status?: string | null) => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
    case 'FAILED': return 'bg-red-100 text-red-800 border-red-200';
    case 'REFUNDED': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const OperationsSection: React.FC<OperationsSectionProps> = ({
  recentOrders,
  pendingPayments,
  loading
}) => {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Recent Orders</h3>
                <p className="text-blue-100">Latest customer orders</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/orders')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium">View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {loading && <div className="text-center py-4 text-gray-500">Loading...</div>}
          {!loading && recentOrders.length === 0 && (
            <div className="text-center py-4 text-gray-500">No recent orders</div>
          )}
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-bold text-gray-900">#{order.orderNumber}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${orderStatusClass(order.status)}`}>
                      {order.status || '—'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${paymentStatusClass(order.paymentStatus)}`}>
                      {order.paymentStatus || '—'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.user?.name || order.user?.email || 'Customer'} • {formatDate(order.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{formatCurrency(order.totalPkr)}</div>
                  <button
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Payments */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Pending Payments</h3>
                <p className="text-green-100">Manual payments awaiting review</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/payments')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium">Review All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {loading && <div className="text-center py-4 text-gray-500">Loading...</div>}
          {!loading && pendingPayments.length === 0 && (
            <div className="text-center py-4 text-gray-500">No pending payments</div>
          )}
          <div className="space-y-4">
            {pendingPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-bold text-gray-900">{payment.user?.name || payment.user?.email || 'User'}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${paymentStatusClass(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {payment.paymentMethod} • {formatDate(payment.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{formatCurrency(payment.amount)}</div>
                  <button
                    onClick={() => router.push('/admin/payments')}
                    className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
