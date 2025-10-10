'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, CheckCircle, Clock, XCircle, Truck, Package } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  change?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  change,
  onClick
}) => {
  const cardContent = (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
        {change && (
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span className="text-green-600 font-medium">{change}</span>
          </div>
        )}
      </div>
      <div className={`p-4 rounded-xl ${color} shadow-md`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 w-full text-left cursor-pointer hover:scale-105 border border-gray-100"
        onClick={onClick}
        type="button"
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
      {cardContent}
    </div>
  );
};

interface NavigationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  path: string;
  className?: string;
}

export const NavigationCard: React.FC<NavigationCardProps> = ({
  title,
  description,
  icon: Icon,
  color,
  path,
  className = ''
}) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(path)}
      className={`group bg-white rounded-2xl shadow-lg border border-gray-100 p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
      <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

interface QuickActionProps {
  title: string;
  icon: LucideIcon;
  color: string;
  path: string;
  description?: string;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  title,
  icon: Icon,
  color,
  path,
  description
}) => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(path)}
      className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-lg transition-all duration-200"
      title={description}
    >
      <span className="flex items-center gap-3">
        <div className={`p-2 ${color} rounded-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="font-medium text-gray-900">{title}</span>
      </span>
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </button>
  );
};

interface ActivityItemProps {
  icon: LucideIcon;
  color: string;
  text: string;
  bgColor: string;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  icon: Icon,
  color,
  text,
  bgColor
}) => (
  <div className={`flex items-center space-x-3 p-3 ${bgColor} rounded-lg`}>
    <div className={`w-2 h-2 ${color} rounded-full`}></div>
    <Icon className="w-4 h-4 text-gray-600" />
    <span className="text-sm text-gray-800">{text}</span>
  </div>
);

interface OrderDetailCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const OrderDetailCard: React.FC<OrderDetailCardProps> = ({
  title,
  children,
  className = ''
}) => (
  <Card className={`bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
      <CardTitle className="text-lg font-semibold flex items-center gap-2">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6">
      {children}
    </CardContent>
  </Card>
);

interface PaymentStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  size = 'md'
}) => {
  const getStatusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'PENDING':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-4 h-4" />
        };
      case 'FAILED':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="w-4 h-4" />
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="w-4 h-4" />
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <Badge className={`${config.color} ${sizeClasses[size]} font-semibold border flex items-center gap-1`}>
      {config.icon}
      {status}
    </Badge>
  );
};

// Note: previously duplicated definitions were cleaned up
interface PaymentRequestCardProps {
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: string;
  onApprove?: () => void;
  onReject?: () => void;
}

export const PaymentRequestCard: React.FC<PaymentRequestCardProps> = ({
  amount,
  paymentMethod,
  status,
  requestedBy,
  requestedAt,
  onApprove,
  onReject
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Payment Request</span>
          <PaymentStatusBadge status={status.toUpperCase()} size="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="font-bold text-lg">{formatCurrency(amount)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Method:</span>
          <span className="font-medium">{paymentMethod}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Requested By:</span>
          <span className="font-medium">{requestedBy}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Date:</span>
          <span className="text-sm text-gray-500">{requestedAt}</span>
        </div>

        {status === 'pending' && (onApprove || onReject) && (
          <div className="flex gap-2 pt-4">
            {onApprove && (
              <button
                onClick={onApprove}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Approve
              </button>
            )}
            {onReject && (
              <button
                onClick={onReject}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Reject
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface PaymentFiltersProps {
  onFilterChange?: (filters: {
    status?: string;
    paymentMethod?: string;
    dateRange?: string;
  }) => void;
  defaultFilters?: {
    status?: string;
    paymentMethod?: string;
    dateRange?: string;
  };
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  onFilterChange,
  defaultFilters = {}
}) => {
  const [status, setStatus] = React.useState(defaultFilters.status || '');
  const [paymentMethod, setPaymentMethod] = React.useState(defaultFilters.paymentMethod || '');
  const [dateRange, setDateRange] = React.useState(defaultFilters.dateRange || '');

  React.useEffect(() => {
    if (onFilterChange) {
      onFilterChange({ status, paymentMethod, dateRange });
    }
  }, [status, paymentMethod, dateRange, onFilterChange]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="text-lg font-semibold">Payment Filters</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              aria-label="Filter by payment method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Methods</option>
              <option value="bank">Bank Transfer</option>
              <option value="wallet">Mobile Wallet</option>
              <option value="cash">Cash</option>
              <option value="card">Credit/Debit Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              aria-label="Filter by date range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            onClick={() => {
              setStatus('');
              setPaymentMethod('');
              setDateRange('');
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

interface OrderStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  size = 'md'
}) => {
  const getStatusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
      case 'COMPLETED':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'SHIPPED':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Truck className="w-4 h-4" />
        };
      case 'PROCESSING':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <Package className="w-4 h-4" />
        };
      case 'PENDING':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-4 h-4" />
        };
      case 'CANCELLED':
      case 'REFUNDED':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="w-4 h-4" />
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Clock className="w-4 h-4" />
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  return (
    <Badge className={`${config.color} ${sizeClasses[size]} font-semibold border flex items-center gap-1`}>
      {config.icon}
      {status}
    </Badge>
  );
};
