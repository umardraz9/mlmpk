'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, CreditCard, Phone, Building, Wallet, Eye, EyeOff } from 'lucide-react';

interface PaymentSetting {
  id: string;
  type: string;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  branchCode?: string;
  iban?: string;
  isActive: boolean;
  displayOrder: number;
  instructions?: string;
  monthlyLimitPkr?: number | null;
}

interface PaymentForm {
  type: string;
  accountTitle: string;
  accountNumber: string;
  bankName: string;
  branchCode: string;
  iban: string;
  instructions: string;
  monthlyLimitPkr?: string;
}

export default function AdminPaymentSettingsPage() {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showAccountNumbers, setShowAccountNumbers] = useState<{[key: string]: boolean}>({});

  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    type: 'JAZZCASH',
    accountTitle: '',
    accountNumber: '',
    bankName: '',
    branchCode: '',
    iban: '',
    instructions: '',
    monthlyLimitPkr: ''
  });

  const paymentTypes = [
    { value: 'JAZZCASH', label: 'JazzCash', icon: Phone, color: 'text-red-600' },
    { value: 'EASYPAISA', label: 'EasyPaisa', icon: Phone, color: 'text-green-600' },
    { value: 'BANK_ACCOUNT', label: 'Bank Account', icon: Building, color: 'text-blue-600' },
    { value: 'OTHER', label: 'Other Wallet', icon: Wallet, color: 'text-purple-600' }
  ];

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/admin/payment-settings');
      const data = await response.json();
      
      if (data.success) {
        setPaymentSettings(data.settings);
      } else {
        setError('Failed to fetch payment settings');
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPaymentForm({
      type: 'JAZZCASH',
      accountTitle: '',
      accountNumber: '',
      bankName: '',
      branchCode: '',
      iban: '',
      instructions: '',
      monthlyLimitPkr: ''
    });
  };

  const handleCreatePayment = async () => {
    try {
      const response = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentForm,
          monthlyLimitPkr: paymentForm.monthlyLimitPkr ? parseFloat(paymentForm.monthlyLimitPkr) : null,
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Payment method created successfully!');
        setShowCreateForm(false);
        resetForm();
        fetchPaymentSettings();
      } else {
        setError(data.error || 'Failed to create payment method');
      }
    } catch (error) {
      console.error('Error creating payment method:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleUpdatePayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/payment-settings/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentForm,
          monthlyLimitPkr: paymentForm.monthlyLimitPkr ? parseFloat(paymentForm.monthlyLimitPkr) : null,
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Payment method updated successfully!');
        setEditingPayment(null);
        setShowCreateForm(false);
        resetForm();
        fetchPaymentSettings();
      } else {
        setError(data.error || 'Failed to update payment method');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      const response = await fetch(`/api/admin/payment-settings/${paymentId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Payment method deleted successfully!');
        fetchPaymentSettings();
      } else {
        setError(data.error || 'Failed to delete payment method');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleToggleActive = async (paymentId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/payment-settings/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchPaymentSettings();
      } else {
        setError(data.error || 'Failed to update payment method');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      setError('Network error. Please try again.');
    }
  };

  const startEdit = (payment: PaymentSetting) => {
    setPaymentForm({
      type: payment.type,
      accountTitle: payment.accountTitle,
      accountNumber: payment.accountNumber,
      bankName: payment.bankName || '',
      branchCode: payment.branchCode || '',
      iban: payment.iban || '',
      instructions: payment.instructions || '',
      monthlyLimitPkr: payment.monthlyLimitPkr != null ? String(payment.monthlyLimitPkr) : ''
    });
    setEditingPayment(payment.id);
    setShowCreateForm(true);
  };

  const toggleAccountVisibility = (paymentId: string) => {
    setShowAccountNumbers(prev => ({
      ...prev,
      [paymentId]: !prev[paymentId]
    }));
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return accountNumber.substring(0, 2) + '*'.repeat(accountNumber.length - 4) + accountNumber.substring(accountNumber.length - 2);
  };

  const getPaymentTypeInfo = (type: string) => {
    return paymentTypes.find(pt => pt.value === type) || paymentTypes[0];
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
          <p className="text-gray-600">Manage payment methods for manual membership purchases</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            resetForm();
            setEditingPayment(null);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payment Method</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg border p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingPayment ? 'Edit Payment Method' : 'Add New Payment Method'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingPayment(null);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Payment Type & Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                <select
                  value={paymentForm.type}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {paymentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Title</label>
                <input
                  type="text"
                  value={paymentForm.accountTitle}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, accountTitle: e.target.value }))}
                  placeholder="Account holder name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {paymentForm.type === 'BANK_ACCOUNT' ? 'Account Number' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={paymentForm.accountNumber}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder={paymentForm.type === 'BANK_ACCOUNT' ? 'Bank account number' : 'Mobile number'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Limit (PKR)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={paymentForm.monthlyLimitPkr || ''}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, monthlyLimitPkr: e.target.value }))}
                  placeholder={paymentForm.type === 'BANK_ACCOUNT' ? 'Optional for bank accounts' : 'e.g., 200000'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Bank Details (if bank account) */}
            <div className="space-y-4">
              {paymentForm.type === 'BANK_ACCOUNT' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={paymentForm.bankName}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="e.g., HBL, UBL, MCB"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                    <input
                      type="text"
                      value={paymentForm.branchCode}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, branchCode: e.target.value }))}
                      placeholder="Branch code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IBAN (Optional)</label>
                    <input
                      type="text"
                      value={paymentForm.iban}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, iban: e.target.value }))}
                      placeholder="PK36SCBL0000001123456702"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions for Users</label>
                <textarea
                  value={paymentForm.instructions}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Special instructions for users when making payments"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingPayment(null);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => editingPayment ? handleUpdatePayment(editingPayment) : handleCreatePayment()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{editingPayment ? 'Update' : 'Create'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Payment Methods List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentSettings.map((payment) => {
          const typeInfo = getPaymentTypeInfo(payment.type);
          const IconComponent = typeInfo.icon;
          const isVisible = showAccountNumbers[payment.id];

          return (
            <div key={payment.id} className="bg-white rounded-lg shadow-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gray-100 ${typeInfo.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{typeInfo.label}</h3>
                    <p className="text-sm text-gray-600">{payment.accountTitle}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleAccountVisibility(payment.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEdit(payment)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePayment(payment.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">
                    {payment.type === 'BANK_ACCOUNT' ? 'Account Number:' : 'Phone Number:'}
                  </span>
                  <div className="font-mono text-sm mt-1">
                    {isVisible ? payment.accountNumber : maskAccountNumber(payment.accountNumber)}
                  </div>
                </div>

                {payment.type === 'BANK_ACCOUNT' && payment.bankName && (
                  <div>
                    <span className="text-sm text-gray-600">Bank:</span>
                    <div className="text-sm mt-1">{payment.bankName}</div>
                  </div>
                )}

                {payment.type === 'BANK_ACCOUNT' && payment.iban && (
                  <div>
                    <span className="text-sm text-gray-600">IBAN:</span>
                    <div className="font-mono text-sm mt-1">
                      {isVisible ? payment.iban : maskAccountNumber(payment.iban)}
                    </div>
                  </div>
                )}

                {payment.instructions && (
                  <div>
                    <span className="text-sm text-gray-600">Instructions:</span>
                    <div className="text-sm mt-1 text-gray-700">{payment.instructions}</div>
                  </div>
                )}
                {payment.monthlyLimitPkr != null && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">Monthly Limit:</span>
                    <div className="text-sm mt-1 text-gray-900 font-semibold">PKR {payment.monthlyLimitPkr.toLocaleString()}</div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <button
                  onClick={() => handleToggleActive(payment.id, payment.isActive)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    payment.isActive 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {payment.isActive ? 'Active' : 'Inactive'}
                </button>
                <div className="text-xs text-gray-500">
                  Order: {payment.displayOrder}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {paymentSettings.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Methods</h3>
          <p className="text-gray-600 mb-4">Add payment methods for users to purchase memberships</p>
          <button
            onClick={() => {
              setShowCreateForm(true);
              resetForm();
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Add First Payment Method
          </button>
        </div>
      )}
    </div>
  );
}
