'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Save, X, Settings, Calendar, DollarSign, Users, Crown, Shield, Star } from 'lucide-react';

interface MembershipPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  dailyTaskEarning: number;
  maxEarningDays: number;
  extendedEarningDays: number;
  minimumWithdrawal: number;
  voucherAmount: number;
  description: string;
  features: string[];
  isActive: boolean;
  referralCommissions: {
    level: number;
    amount: number;
    description: string;
  }[];
}

interface PlanForm {
  name: string;
  displayName: string;
  price: string;
  dailyTaskEarning: string;
  tasksPerDay: string;
  maxEarningDays: string;
  extendedEarningDays: string;
  minimumWithdrawal: string;
  voucherAmount: string;
  description: string;
  features: string[];
  commissions: {
    level: number;
    amount: string;
    description: string;
  }[];
}

export default function AdminMembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [planForm, setPlanForm] = useState<PlanForm>({
    name: '',
    displayName: '',
    price: '',
    dailyTaskEarning: '',
    tasksPerDay: '5',
    maxEarningDays: '30',
    extendedEarningDays: '60',
    minimumWithdrawal: '',
    voucherAmount: '500',
    description: '',
    features: [''],
    commissions: [
      { level: 1, amount: '', description: 'Direct referral commission' },
      { level: 2, amount: '', description: 'Level 2 referral commission' },
      { level: 3, amount: '', description: 'Level 3 referral commission' },
      { level: 4, amount: '', description: 'Level 4 referral commission' },
      { level: 5, amount: '', description: 'Level 5 referral commission' }
    ]
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/membership-plans?includeAll=1');
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.plans);
      } else {
        setError('Failed to fetch membership plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = async (plan: MembershipPlan) => {
    try {
      setError('');
      setSuccess('');

      if (isDefaultPlan(plan.id)) {
        setError('Default fallback plans cannot be deleted. Create and save the plan first, then you can delete it.');
        return;
      }

      const ok = window.confirm(`Are you sure you want to delete the plan "${plan.displayName}"? This action cannot be undone.`);
      if (!ok) return;

      setDeletingId(plan.id);
      const res = await fetch(`/api/membership-plans/${plan.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to delete plan');
      }
      setSuccess(`Plan ${plan.displayName} deleted successfully`);
      await fetchPlans();
    } catch (e: any) {
      console.error('Error deleting plan:', e);
      setError(e?.message || 'Failed to delete plan');
    } finally {
      setDeletingId(null);
    }
  };

  const isDefaultPlan = (planId: string) => planId.startsWith('default-');

  const handleToggleActive = async (plan: MembershipPlan) => {
    try {
      setError('');
      setSuccess('');
      setTogglingId(plan.id);

      const desiredActive = !plan.isActive;

      if (isDefaultPlan(plan.id)) {
        // Persist default plan into DB first
        const createRes = await fetch('/api/membership-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: plan.name,
            displayName: plan.displayName,
            price: plan.price,
            dailyTaskEarning: plan.dailyTaskEarning,
            maxEarningDays: plan.maxEarningDays,
            extendedEarningDays: plan.extendedEarningDays,
            minimumWithdrawal: plan.minimumWithdrawal,
            voucherAmount: plan.voucherAmount,
            description: plan.description,
            features: plan.features || [],
            commissions: (plan.referralCommissions || []).map((c) => ({
              level: c.level,
              amount: c.amount,
              description: c.description,
            })),
          }),
        });
        const created = await createRes.json();
        if (!createRes.ok || !created?.success || !created?.plan?.id) {
          throw new Error(created?.error || 'Failed to create plan in database');
        }

        const newId = created.plan.id as string;

        // If desired state differs from default (new plans are active by default), update isActive
        if (desiredActive === false) {
          const putRes = await fetch(`/api/membership-plans/${newId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: false }),
          });
          const putData = await putRes.json();
          if (!putRes.ok || !putData?.success) {
            throw new Error(putData?.error || 'Failed to update activation state');
          }
        }

        setSuccess(`Plan ${plan.displayName} ${desiredActive ? 'activated' : 'deactivated'} successfully`);
      } else {
        // Toggle existing DB plan
        const res = await fetch(`/api/membership-plans/${plan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: desiredActive }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || 'Failed to update plan');
        }
        setSuccess(`Plan ${plan.displayName} ${desiredActive ? 'activated' : 'deactivated'} successfully`);
      }

      await fetchPlans();
    } catch (e: any) {
      console.error('Error toggling plan:', e);
      setError(e?.message || 'Failed to toggle plan');
    } finally {
      setTogglingId(null);
    }
  };

  const resetForm = () => {
    setPlanForm({
      name: '',
      displayName: '',
      price: '',
      dailyTaskEarning: '',
      tasksPerDay: '5',
      maxEarningDays: '30',
      extendedEarningDays: '60',
      minimumWithdrawal: '',
      voucherAmount: '500',
      description: '',
      features: [''],
      commissions: [
        { level: 1, amount: '', description: 'Direct referral commission' },
        { level: 2, amount: '', description: 'Level 2 referral commission' },
        { level: 3, amount: '', description: 'Level 3 referral commission' },
        { level: 4, amount: '', description: 'Level 4 referral commission' },
        { level: 5, amount: '', description: 'Level 5 referral commission' }
      ]
    });
  };

  const handleCreatePlan = async () => {
    try {
      const response = await fetch('/api/membership-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...planForm,
          price: parseFloat(planForm.price),
          dailyTaskEarning: parseFloat(planForm.dailyTaskEarning),
          tasksPerDay: parseInt(planForm.tasksPerDay),
          maxEarningDays: parseInt(planForm.maxEarningDays),
          extendedEarningDays: parseInt(planForm.extendedEarningDays),
          minimumWithdrawal: parseFloat(planForm.minimumWithdrawal),
          voucherAmount: parseFloat(planForm.voucherAmount),
          features: planForm.features.filter(f => f.trim() !== ''),
          commissions: planForm.commissions.map(c => ({
            ...c,
            amount: parseFloat(c.amount)
          }))
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Membership plan created successfully!');
        setShowCreateForm(false);
        resetForm();
        fetchPlans();
      } else {
        setError(data.error || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleUpdatePlan = async (planId: string) => {
    try {
      const response = await fetch(`/api/membership-plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...planForm,
          price: parseFloat(planForm.price),
          dailyTaskEarning: parseFloat(planForm.dailyTaskEarning),
          tasksPerDay: parseInt(planForm.tasksPerDay),
          maxEarningDays: parseInt(planForm.maxEarningDays),
          extendedEarningDays: parseInt(planForm.extendedEarningDays),
          minimumWithdrawal: parseFloat(planForm.minimumWithdrawal),
          voucherAmount: parseFloat(planForm.voucherAmount),
          features: planForm.features.filter(f => f.trim() !== '')
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Membership plan updated successfully!');
        setEditingPlan(null);
        resetForm();
        fetchPlans();
      } else {
        setError(data.error || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      setError('Network error. Please try again.');
    }
  };

  const startEdit = (plan: MembershipPlan) => {
    setPlanForm({
      name: plan.name,
      displayName: plan.displayName,
      price: plan.price.toString(),
      dailyTaskEarning: plan.dailyTaskEarning.toString(),
      tasksPerDay: (plan as any).tasksPerDay ? String((plan as any).tasksPerDay) : '5',
      maxEarningDays: plan.maxEarningDays.toString(),
      extendedEarningDays: plan.extendedEarningDays.toString(),
      minimumWithdrawal: plan.minimumWithdrawal.toString(),
      voucherAmount: plan.voucherAmount.toString(),
      description: plan.description,
      features: plan.features.length > 0 ? plan.features : [''],
      commissions: plan.referralCommissions.map(c => ({
        level: c.level,
        amount: c.amount.toString(),
        description: c.description
      }))
    });
    setEditingPlan(plan.id);
    setShowCreateForm(true);
  };

  const addFeature = () => {
    setPlanForm(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setPlanForm(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateCommission = (level: number, field: 'amount' | 'description', value: string) => {
    setPlanForm(prev => ({
      ...prev,
      commissions: prev.commissions.map(c => 
        c.level === level ? { ...c, [field]: value } : c
      )
    }));
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'BASIC': return <Shield className="w-6 h-6 text-green-600" />;
      case 'STANDARD': return <Star className="w-6 h-6 text-blue-600" />;
      case 'PREMIUM': return <Crown className="w-6 h-6 text-purple-600" />;
      default: return <Settings className="w-6 h-6 text-gray-600" />;
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Membership Plans Management</h1>
          <p className="text-gray-600">Create and manage membership plans with custom earning periods</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/payment-settings"
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Payment Settings</span>
          </Link>
          <button
            onClick={() => {
              setShowCreateForm(true);
              resetForm();
              setEditingPlan(null);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
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

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg border p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {editingPlan ? 'Edit Membership Plan' : 'Create New Membership Plan'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingPlan(null);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close form"
              title="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                  placeholder="e.g., PREMIUM_PLUS"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={planForm.displayName}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g., Premium Plus Plan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Plan description for users"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Pricing & Earnings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Pricing & Earnings</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Price (Rs.)</label>
                  <input
                    type="number"
                    value={planForm.price}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Earning (Rs.)</label>
                  <input
                    type="number"
                    value={planForm.dailyTaskEarning}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, dailyTaskEarning: e.target.value }))}
                    placeholder="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Days</label>
                  <input
                    type="number"
                    value={planForm.maxEarningDays}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, maxEarningDays: e.target.value }))}
                    placeholder="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extended Days</label>
                  <input
                    type="number"
                    value={planForm.extendedEarningDays}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, extendedEarningDays: e.target.value }))}
                    placeholder="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min. Withdrawal</label>
                  <input
                    type="number"
                    value={planForm.minimumWithdrawal}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, minimumWithdrawal: e.target.value }))}
                    placeholder="2000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tasks Per Day</label>
                  <input
                    type="number"
                    value={planForm.tasksPerDay}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, tasksPerDay: e.target.value }))}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Amount (Rs.)</label>
                <input
                  type="number"
                  value={planForm.voucherAmount}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, voucherAmount: e.target.value }))}
                  placeholder="500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Plan Features</h3>
            <div className="space-y-2">
              {planForm.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Enter plan feature"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    onClick={() => removeFeature(index)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Remove feature"
                    title="Remove feature"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addFeature}
                className="text-green-600 hover:text-green-700 text-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Feature</span>
              </button>
            </div>
          </div>

          {/* Commission Structure */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Referral Commission Structure</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {planForm.commissions.map((commission) => (
                <div key={commission.level} className="border rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium">Level {commission.level}</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={commission.amount}
                      onChange={(e) => updateCommission(commission.level, 'amount', e.target.value)}
                      placeholder="Commission amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <input
                      type="text"
                      value={commission.description}
                      onChange={(e) => updateCommission(commission.level, 'description', e.target.value)}
                      placeholder="Commission description"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingPlan(null);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => editingPlan ? handleUpdatePlan(editingPlan) : handleCreatePlan()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{editingPlan ? 'Update Plan' : 'Create Plan'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Plans List - Enhanced UI */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {plans.map((plan, index) => {
          const getPlanColor = (planName: string) => {
            switch (planName) {
              case 'BASIC': return { bg: 'from-green-50 to-green-100', border: 'border-green-200', accent: 'green' };
              case 'STANDARD': return { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', accent: 'blue' };
              case 'PREMIUM': return { bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', accent: 'purple' };
              default: return { bg: 'from-gray-50 to-gray-100', border: 'border-gray-200', accent: 'gray' };
            }
          };
          
          const colors = getPlanColor(plan.name);
          const isRecommended = plan.name === 'STANDARD';
          const isPopular = plan.name === 'BASIC';
          const isPremium = plan.name === 'PREMIUM';
          
          return (
            <div key={plan.id} className={`relative bg-gradient-to-br ${colors.bg} rounded-2xl shadow-xl ${colors.border} border-2 p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl ${isRecommended ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}`}>
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    🌟 MOST POPULAR
                  </span>
                </div>
              )}
              
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    🚀 RECOMMENDED
                  </span>
                </div>
              )}
              
              {/* Premium Badge */}
              {isPremium && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    👑 PREMIUM
                  </span>
                </div>
              )}
              
              {/* Plan Header */}
              <div className="text-center mb-8 mt-4">
                <div className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-${colors.accent}-400 to-${colors.accent}-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110`}>
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.displayName}</h3>
                <p className="text-sm text-gray-600 uppercase tracking-wider font-medium">{plan.name}</p>
              </div>
              
              {/* Price Section */}
              <div className="text-center mb-8">
                <div className={`text-5xl font-extrabold text-${colors.accent}-600 mb-2`}>₨{plan.price.toLocaleString()}</div>
                <p className="text-gray-600 text-sm">One-time activation fee</p>
                {plan.description && (
                  <p className="text-gray-700 text-sm mt-2 italic">{plan.description}</p>
                )}
              </div>
              
              {/* Key Features Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`bg-white bg-opacity-60 rounded-xl p-3 text-center border ${colors.border}`}>
                  <DollarSign className={`w-5 h-5 text-${colors.accent}-600 mx-auto mb-1`} />
                  <div className={`font-bold text-${colors.accent}-600`}>₨{plan.dailyTaskEarning}</div>
                  <div className="text-xs text-gray-600">Daily Earning</div>
                </div>
                <div className={`bg-white bg-opacity-60 rounded-xl p-3 text-center border ${colors.border}`}>
                  <Calendar className={`w-5 h-5 text-${colors.accent}-600 mx-auto mb-1`} />
                  <div className={`font-bold text-${colors.accent}-600`}>{plan.maxEarningDays}D</div>
                  <div className="text-xs text-gray-600">Base Period</div>
                </div>
                <div className={`bg-white bg-opacity-60 rounded-xl p-3 text-center border ${colors.border}`}>
                  <Users className={`w-5 h-5 text-${colors.accent}-600 mx-auto mb-1`} />
                  <div className={`font-bold text-${colors.accent}-600`}>{(plan as any).tasksPerDay ?? 5}</div>
                  <div className="text-xs text-gray-600">Tasks/Day</div>
                </div>
                <div className={`bg-white bg-opacity-60 rounded-xl p-3 text-center border ${colors.border}`}>
                  <Shield className={`w-5 h-5 text-${colors.accent}-600 mx-auto mb-1`} />
                  <div className={`font-bold text-${colors.accent}-600`}>₨{plan.minimumWithdrawal.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Min. Withdrawal</div>
                </div>
              </div>
              
              {/* Status and Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    plan.isActive 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {plan.isActive ? '✅ Active' : '❌ Inactive'}
                  </span>
                  {isDefaultPlan(plan.id) && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full border border-yellow-200" title="This is a fallback default plan not yet saved in the database">
                      📝 Default
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(plan)}
                    className={`p-2 rounded-lg bg-${colors.accent}-100 text-${colors.accent}-600 hover:bg-${colors.accent}-200 transition-colors`}
                    title="Edit plan"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan)}
                    disabled={isDefaultPlan(plan.id) || deletingId === plan.id}
                    className={`p-2 rounded-lg transition-colors ${
                      isDefaultPlan(plan.id) 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    } ${deletingId === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isDefaultPlan(plan.id) ? 'Cannot delete default fallback plan' : 'Delete plan'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(plan)}
                    disabled={togglingId === plan.id}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      plan.isActive 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    } ${togglingId === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={plan.isActive ? 'Deactivate plan' : 'Activate plan'}
                  >
                    {togglingId === plan.id ? '⏳' : (plan.isActive ? '🔴 Deactivate' : '🟢 Activate')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
