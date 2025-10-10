'use client';

import React from 'react';
import { Users, CheckSquare, Network, CreditCard, TrendingUp, Settings } from 'lucide-react';
import { QuickAction } from './AdminComponents';

export const QuickActionsSection: React.FC = () => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Management Tools</h3>
          <div className="space-y-3">
            <QuickAction
              title="Manage Users"
              icon={Users}
              color="bg-blue-600"
              path="/admin/users"
            />
            <QuickAction
              title="Manage Tasks"
              icon={CheckSquare}
              color="bg-purple-600"
              path="/admin/tasks"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Business Tools</h3>
          <div className="space-y-3">
            <QuickAction
              title="Partnership Settings"
              icon={Network}
              color="bg-green-600"
              path="/admin/commission-settings"
            />
            <QuickAction
              title="Payment Requests"
              icon={CreditCard}
              color="bg-yellow-600"
              path="/admin/payments"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Tools</h3>
          <div className="space-y-3">
            <QuickAction
              title="Withdrawals"
              icon={TrendingUp}
              color="bg-orange-600"
              path="/admin/withdrawals"
            />
            <QuickAction
              title="Payment Settings"
              icon={Settings}
              color="bg-teal-600"
              path="/admin/payment-settings"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
