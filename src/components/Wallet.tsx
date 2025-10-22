'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';

interface WalletData {
  balance: number;
  availableVoucherPkr: number;
  taskEarnings: number;
  referralCommission: number;
  totalEarnings: number;
  tasksCompleted: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  transactionId: string;
}

export default function Wallet() {
  const { data: session } = useSession();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('jazzcash');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  // Removed voucher redeem UI per requirements

  useEffect(() => {
    if (session) {
      fetchWalletData();
      fetchWithdrawals();
    }
  }, [session]);

  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/user/wallet');
      const data = await response.json();
      setWallet(data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  // Voucher redeem removed

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch('/api/withdraw');
      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseInt(withdrawAmount),
          method: withdrawMethod,
          accountDetails: {
            accountNumber,
            name: session?.user?.name || '',
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Withdrawal request submitted successfully!');
        setShowWithdrawForm(false);
        setWithdrawAmount('');
        setAccountNumber('');
        fetchWalletData();
        fetchWithdrawals();
      } else {
        alert(data.error || 'Failed to process withdrawal');
      }
    } catch (_err) {
      alert('Error processing withdrawal');
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return <div className="text-center p-8">Loading wallet...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">💰 My Wallet</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Available Balance</h3>
            <p className="text-2xl font-bold text-green-600">Rs {wallet.balance}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Voucher Balance (Shopping Only)</h3>
            <p className="text-2xl font-bold text-blue-600">Rs {wallet.availableVoucherPkr}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Total Earnings</h3>
            <p className="text-2xl font-bold text-purple-600">Rs {wallet.totalEarnings}</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 mb-4">Note: Voucher balance cannot be withdrawn; only your Available Balance can be withdrawn.</p>

        {/* Earnings Breakdown */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Earnings Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded border">
              <div className="text-xs text-gray-600">Task Earnings</div>
              <div className="text-lg font-semibold text-gray-900">Rs {wallet.taskEarnings.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded border">
              <div className="text-xs text-gray-600">Referral Commission</div>
              <div className="text-lg font-semibold text-gray-900">Rs {wallet.referralCommission.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded border bg-emerald-50">
              <div className="text-xs text-gray-600">Total</div>
              <div className="text-lg font-semibold text-emerald-700">Rs {wallet.totalEarnings.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Tasks Completed</h3>
            <p className="text-xl font-bold">{wallet.tasksCompleted}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-600">Tips to Boost Earnings</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1 mt-1">
              <li>Complete your daily tasks consistently</li>
              <li>Share your referral code with friends and family</li>
              <li>Earn referral commission for each direct signup (based on their plan)</li>
              <li>Stay active to unlock higher-tier plans and benefits</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => setShowWithdrawForm(!showWithdrawForm)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
        >
          💸 Withdraw Money
        </button>
      </div>

      {showWithdrawForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Withdraw Money</h3>
          <form onSubmit={handleWithdraw}>
            <div className="mb-4">
              <label htmlFor="withdraw-amount" className="block text-sm font-medium mb-2">Amount (Rs)</label>
              <input
                id="withdraw-amount"
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="100"
                max={wallet.balance}
                placeholder="Enter amount to withdraw"
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="withdraw-method" className="block text-sm font-medium mb-2">Payment Method</label>
              <select
                id="withdraw-method"
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">EasyPaisa</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="account-number" className="block text-sm font-medium mb-2">Account Number</label>
              <input
                id="account-number"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter your wallet/account number"
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || parseInt(withdrawAmount) > wallet.balance}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Withdraw Now'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">📋 Withdrawal History</h3>
        {withdrawals.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No withdrawals yet</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="border p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Rs {withdrawal.amount}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    withdrawal.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    withdrawal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {withdrawal.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {withdrawal.method} - {new Date(withdrawal.createdAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500">
                  Transaction ID: {withdrawal.transactionId}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
