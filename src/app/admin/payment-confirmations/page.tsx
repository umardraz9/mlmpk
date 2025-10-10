'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, User, CreditCard, Calendar, MessageSquare, ExternalLink } from 'lucide-react';

interface PaymentConfirmation {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  membershipPlan: {
    name: string;
    displayName: string;
    price: number;
  };
  paymentMethod: string;
  transactionId: string;
  amount: number;
  paymentProof?: string;
  notes?: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  adminNotes?: string;
}

export default function AdminPaymentConfirmationsPage() {
  const [confirmations, setConfirmations] = useState<PaymentConfirmation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedConfirmation, setSelectedConfirmation] = useState<PaymentConfirmation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  useEffect(() => {
    fetchConfirmations();
  }, []);

  const fetchConfirmations = async () => {
    try {
      const response = await fetch('/api/admin/payment-confirmations');
      const data = await response.json();
      
      if (data.success) {
        setConfirmations(data.confirmations);
      } else {
        setError('Failed to fetch payment confirmations');
      }
    } catch (error) {
      console.error('Error fetching confirmations:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessConfirmation = async () => {
    if (!selectedConfirmation) return;

    setProcessingId(selectedConfirmation.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/payment-confirmations/${selectedConfirmation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionType,
          adminNotes: adminNotes.trim() || null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        setShowModal(false);
        setSelectedConfirmation(null);
        setAdminNotes('');
        fetchConfirmations();
      } else {
        setError(data.error || 'Failed to process payment confirmation');
      }
    } catch (error) {
      console.error('Error processing confirmation:', error);
      setError('Network error. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const openProcessModal = (confirmation: PaymentConfirmation, action: 'APPROVED' | 'REJECTED') => {
    setSelectedConfirmation(confirmation);
    setActionType(action);
    setAdminNotes('');
    setShowModal(true);
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

  const getPaymentMethodDisplay = (method: string) => {
    return method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredConfirmations = confirmations.filter(confirmation => {
    if (filter === 'ALL') return true;
    return confirmation.status === filter;
  });

  const pendingCount = confirmations.filter(c => c.status === 'PENDING').length;
  const approvedCount = confirmations.filter(c => c.status === 'APPROVED').length;
  const rejectedCount = confirmations.filter(c => c.status === 'REJECTED').length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Confirmations</h1>
          <p className="text-gray-600">Review and process user payment confirmations</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            {pendingCount} Pending
          </div>
        </div>
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

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6">
        {[
          { key: 'ALL', label: 'All', count: confirmations.length },
          { key: 'PENDING', label: 'Pending', count: pendingCount },
          { key: 'APPROVED', label: 'Approved', count: approvedCount },
          { key: 'REJECTED', label: 'Rejected', count: rejectedCount }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Confirmations List */}
      <div className="space-y-4">
        {filteredConfirmations.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'ALL' ? 'No Payment Confirmations' : `No ${filter.toLowerCase()} confirmations`}
            </h3>
            <p className="text-gray-600">
              {filter === 'PENDING' 
                ? 'All payment confirmations have been processed'
                : 'Payment confirmations will appear here when users submit them'
              }
            </p>
          </div>
        ) : (
          filteredConfirmations.map((confirmation) => (
            <div key={confirmation.id} className="bg-white rounded-lg shadow-lg border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(confirmation.status)}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {confirmation.membershipPlan.displayName}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(confirmation.status)}`}>
                        {confirmation.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{confirmation.user.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(confirmation.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {confirmation.status === 'PENDING' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openProcessModal(confirmation, 'APPROVED')}
                      disabled={processingId === confirmation.id}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => openProcessModal(confirmation, 'REJECTED')}
                      disabled={processingId === confirmation.id}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-600">User Email:</span>
                  <div className="font-medium">{confirmation.user.email}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Payment Method:</span>
                  <div className="font-medium">{getPaymentMethodDisplay(confirmation.paymentMethod)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Transaction ID:</span>
                  <div className="font-medium font-mono">{confirmation.transactionId}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Amount:</span>
                  <div className="font-medium">Rs.{confirmation.amount.toLocaleString()}</div>
                </div>
              </div>

              {/* Additional Information */}
              {(confirmation.notes || confirmation.paymentProof || confirmation.adminNotes) && (
                <div className="border-t pt-4 space-y-3">
                  {confirmation.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">User Notes:</span>
                      <div className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                        {confirmation.notes}
                      </div>
                    </div>
                  )}
                  
                  {confirmation.paymentProof && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Payment Proof:</span>
                      <div className="mt-1">
                        <a
                          href={confirmation.paymentProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View Payment Screenshot</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {confirmation.adminNotes && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Admin Notes:</span>
                      <div className="text-sm text-gray-600 mt-1 p-2 bg-blue-50 rounded">
                        {confirmation.adminNotes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {confirmation.processedAt && (
                <div className="border-t pt-3 mt-4 text-xs text-gray-500">
                  Processed on {new Date(confirmation.processedAt).toLocaleString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Process Confirmation Modal */}
      {showModal && selectedConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              {actionType === 'APPROVED' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <h3 className="text-lg font-semibold">
                {actionType === 'APPROVED' ? 'Approve' : 'Reject'} Payment Confirmation
              </h3>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm space-y-1">
                <div><strong>User:</strong> {selectedConfirmation.user.name}</div>
                <div><strong>Plan:</strong> {selectedConfirmation.membershipPlan.displayName}</div>
                <div><strong>Amount:</strong> Rs.{selectedConfirmation.amount.toLocaleString()}</div>
                <div><strong>Transaction ID:</strong> {selectedConfirmation.transactionId}</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === 'APPROVED' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={
                  actionType === 'APPROVED' 
                    ? 'Add any notes about the approval...'
                    : 'Please provide a reason for rejection...'
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessConfirmation}
                disabled={processingId === selectedConfirmation.id}
                className={`px-4 py-2 text-white rounded-lg flex items-center space-x-2 ${
                  actionType === 'APPROVED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processingId === selectedConfirmation.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {actionType === 'APPROVED' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>{actionType === 'APPROVED' ? 'Approve' : 'Reject'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
