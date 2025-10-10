'use client';

import { useState, useEffect } from 'react';
import { Upload, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, Phone, Building, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MembershipPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  dailyTaskEarning: number;
  description: string;
}

interface PaymentSetting {
  id: string;
  type: string;
  accountTitle: string;
  accountNumber: string;
  bankName?: string;
  branchCode?: string;
  iban?: string;
  instructions?: string;
  isActive: boolean;
  monthlyLimitPkr?: number | null;
}

interface PaymentConfirmation {
  id: string;
  membershipPlan: {
    displayName: string;
    price: number;
  };
  paymentMethod: string;
  transactionId: string;
  amount: number;
  status: string;
  createdAt: string;
  adminNotes?: string;
}

export default function PaymentConfirmationPage() {
  const router = useRouter();
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([]);
  const [paymentConfirmations, setPaymentConfirmations] = useState<PaymentConfirmation[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  const [formData, setFormData] = useState({
    transactionId: '',
    amount: '',
    paymentProof: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansResponse, settingsResponse, confirmationsResponse] = await Promise.all([
        fetch('/api/membership-plans'),
        fetch('/api/payment-methods'),
        fetch('/api/user/payment-confirmation')
      ]);

      const plansData = await plansResponse.json();
      const settingsData = await settingsResponse.json();
      const confirmationsData = await confirmationsResponse.json();

      if (plansData.success) {
        setMembershipPlans(plansData.plans);
      }

      if (settingsData.success) {
        const methods = (settingsData.paymentMethods || []).map((m: any) => ({
          id: m.id,
          type: m.type,
          accountTitle: m.accountName,
          accountNumber: m.accountNumber,
          bankName: m.bankName || undefined,
          branchCode: m.branchCode || undefined,
          iban: '',
          instructions: m.instructions || undefined,
          isActive: true,
          monthlyLimitPkr: typeof m.monthlyLimitPkr === 'number' ? m.monthlyLimitPkr : null,
        } as PaymentSetting));
        setPaymentSettings(methods);
      }

      if (confirmationsData.success) {
        setPaymentConfirmations(confirmationsData.confirmations);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/payment-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipPlanId: selectedPlan,
          paymentMethod: selectedPaymentMethod,
          transactionId: formData.transactionId,
          amount: parseFloat(formData.amount),
          paymentProof: formData.paymentProof,
          notes: formData.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setFormData({
          transactionId: '',
          amount: '',
          paymentProof: '',
          notes: ''
        });
        setSelectedPlan('');
        setSelectedPaymentMethod('');
        fetchData(); // Refresh confirmations
        setActiveTab('history');
      } else {
        setError(data.error || 'Failed to submit payment confirmation');
      }
    } catch (error) {
      console.error('Error submitting payment confirmation:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'JAZZCASH':
      case 'EASYPAISA':
      case 'MOBILE_WALLET':
        return <Phone className="w-5 h-5 text-green-600" />;
      case 'BANK_ACCOUNT':
        return <Building className="w-5 h-5 text-blue-600" />;
      default:
        return <Wallet className="w-5 h-5 text-purple-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const selectedPlanData = membershipPlans.find(p => p.id === selectedPlan);
  const selectedPaymentData = paymentSettings.find(p => p.id === selectedPaymentMethod);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Confirmation</h1>
          <p className="text-gray-600">Submit your payment proof to activate your membership</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'submit'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Submit Payment
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Payment History
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {activeTab === 'submit' ? (
          /* Submit Payment Tab */
          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Membership Plan
                </label>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {membershipPlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlan(plan.id);
                        setFormData(prev => ({ ...prev, amount: plan.price.toString() }));
                      }}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPlan === plan.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{plan.displayName}</h3>
                        <div className="text-lg font-bold text-green-600">Rs.{plan.price.toLocaleString()}</div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{plan.description}</div>
                      <div className="text-sm text-green-600 font-medium">
                        Daily Earning: Rs.{plan.dailyTaskEarning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method Selection */}
              {selectedPlan && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Payment Method
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    {paymentSettings.map((setting) => (
                      <div
                        key={setting.id}
                        onClick={() => setSelectedPaymentMethod(setting.id)}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedPaymentMethod === setting.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          {getPaymentMethodIcon(setting.type)}
                          <div>
                            <h3 className="font-semibold text-gray-900">{setting.type.replace('_', ' ')}</h3>
                            <p className="text-sm text-gray-600">{setting.accountTitle}</p>
                          </div>
                        </div>
                        <div className="text-sm font-mono text-gray-700 mb-2">
                          {setting.accountNumber}
                        </div>
                        {setting.bankName && (
                          <div className="text-sm text-gray-600 mb-1">
                            Bank: {setting.bankName}
                          </div>
                        )}
                        {setting.instructions && (
                          <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                            {setting.instructions}
                          </div>
                        )}
                        {typeof setting.monthlyLimitPkr === 'number' && (
                          <div className="text-xs text-green-700 mt-2 p-2 bg-green-50 rounded">
                            Monthly Limit: PKR {setting.monthlyLimitPkr.toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Details Form */}
              {selectedPaymentMethod && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction ID / Reference Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.transactionId}
                      onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                      placeholder="Enter transaction ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount Paid (Rs.) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Enter amount paid"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Proof (Screenshot URL)
                    </label>
                    <input
                      type="url"
                      value={formData.paymentProof}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentProof: e.target.value }))}
                      placeholder="https://example.com/screenshot.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload your payment screenshot to a cloud service and paste the link here
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional information about your payment"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              {selectedPlanData && selectedPaymentData && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{selectedPlanData.displayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">Rs.{selectedPlanData.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">{selectedPaymentData.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily Earning:</span>
                      <span className="font-medium text-green-600">Rs.{selectedPlanData.dailyTaskEarning}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedPlan || !selectedPaymentMethod || !formData.transactionId || !formData.amount || isSubmitting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Submit Payment Confirmation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Payment History Tab */
          <div className="space-y-4">
            {paymentConfirmations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                <p className="text-gray-600 mb-4">You haven't submitted any payment confirmations yet</p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Submit Your First Payment
                </button>
              </div>
            ) : (
              paymentConfirmations.map((confirmation) => (
                <div key={confirmation.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(confirmation.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {confirmation.membershipPlan.displayName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(confirmation.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(confirmation.status)}`}>
                      {confirmation.status}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Payment Method:</span>
                      <div className="font-medium">{confirmation.paymentMethod.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Transaction ID:</span>
                      <div className="font-medium font-mono">{confirmation.transactionId}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <div className="font-medium">Rs.{confirmation.amount.toLocaleString()}</div>
                    </div>
                  </div>

                  {confirmation.adminNotes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">Admin Notes:</div>
                          <div className="text-sm text-gray-700">{confirmation.adminNotes}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
