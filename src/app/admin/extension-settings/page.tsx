'use client';

import { useState, useEffect } from 'react';
import { Save, Calendar, Users, Settings, Clock, Plus, X } from 'lucide-react';

interface ExtensionSetting {
  id: string;
  planId: string;
  planName: string;
  baseEarningDays: number;
  maxExtendedDays: number;
  referralsRequired: number;
  extensionRules: {
    minReferrals: number;
    extensionDays: number;
    description: string;
  }[];
  isActive: boolean;
}

interface ExtensionForm {
  planId: string;
  baseEarningDays: string;
  maxExtendedDays: string;
  referralsRequired: string;
  extensionRules: {
    minReferrals: string;
    extensionDays: string;
    description: string;
  }[];
}

export default function AdminExtensionSettingsPage() {
  const [extensionSettings, setExtensionSettings] = useState<ExtensionSetting[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExtension, setEditingExtension] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [extensionForm, setExtensionForm] = useState<ExtensionForm>({
    planId: '',
    baseEarningDays: '30',
    maxExtendedDays: '60',
    referralsRequired: '1',
    extensionRules: [
      { minReferrals: '1', extensionDays: '30', description: 'First referral extends earning period by 30 days' }
    ]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [extensionsResponse, plansResponse] = await Promise.all([
        fetch('/api/admin/extension-settings'),
        fetch('/api/membership-plans')
      ]);

      const extensionsData = await extensionsResponse.json();
      const plansData = await plansResponse.json();

      if (extensionsData.success) {
        setExtensionSettings(extensionsData.settings);
      }

      if (plansData.success) {
        setMembershipPlans(plansData.plans);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setExtensionForm({
      planId: '',
      baseEarningDays: '30',
      maxExtendedDays: '60',
      referralsRequired: '1',
      extensionRules: [
        { minReferrals: '1', extensionDays: '30', description: 'First referral extends earning period by 30 days' }
      ]
    });
  };

  const handleCreateExtension = async () => {
    try {
      const response = await fetch('/api/admin/extension-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extensionForm,
          baseEarningDays: parseInt(extensionForm.baseEarningDays),
          maxExtendedDays: parseInt(extensionForm.maxExtendedDays),
          referralsRequired: parseInt(extensionForm.referralsRequired),
          extensionRules: extensionForm.extensionRules.map(rule => ({
            minReferrals: parseInt(rule.minReferrals),
            extensionDays: parseInt(rule.extensionDays),
            description: rule.description
          }))
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Extension settings created successfully!');
        setShowCreateForm(false);
        resetForm();
        fetchData();
      } else {
        setError(data.error || 'Failed to create extension settings');
      }
    } catch (error) {
      console.error('Error creating extension settings:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleUpdateExtension = async (extensionId: string) => {
    try {
      const response = await fetch(`/api/admin/extension-settings/${extensionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...extensionForm,
          baseEarningDays: parseInt(extensionForm.baseEarningDays),
          maxExtendedDays: parseInt(extensionForm.maxExtendedDays),
          referralsRequired: parseInt(extensionForm.referralsRequired),
          extensionRules: extensionForm.extensionRules.map(rule => ({
            minReferrals: parseInt(rule.minReferrals),
            extensionDays: parseInt(rule.extensionDays),
            description: rule.description
          }))
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Extension settings updated successfully!');
        setEditingExtension(null);
        setShowCreateForm(false);
        resetForm();
        fetchData();
      } else {
        setError(data.error || 'Failed to update extension settings');
      }
    } catch (error) {
      console.error('Error updating extension settings:', error);
      setError('Network error. Please try again.');
    }
  };

  const startEdit = (extension: ExtensionSetting) => {
    setExtensionForm({
      planId: extension.planId,
      baseEarningDays: extension.baseEarningDays.toString(),
      maxExtendedDays: extension.maxExtendedDays.toString(),
      referralsRequired: extension.referralsRequired.toString(),
      extensionRules: extension.extensionRules.map(rule => ({
        minReferrals: rule.minReferrals.toString(),
        extensionDays: rule.extensionDays.toString(),
        description: rule.description
      }))
    });
    setEditingExtension(extension.id);
    setShowCreateForm(true);
  };

  const addExtensionRule = () => {
    setExtensionForm(prev => ({
      ...prev,
      extensionRules: [...prev.extensionRules, { minReferrals: '', extensionDays: '', description: '' }]
    }));
  };

  const updateExtensionRule = (index: number, field: string, value: string) => {
    setExtensionForm(prev => ({
      ...prev,
      extensionRules: prev.extensionRules.map((rule, i) => 
        i === index ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const removeExtensionRule = (index: number) => {
    setExtensionForm(prev => ({
      ...prev,
      extensionRules: prev.extensionRules.filter((_, i) => i !== index)
    }));
  };

  const handleToggleActive = async (extensionId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/extension-settings/${extensionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchData();
      } else {
        setError(data.error || 'Failed to update extension settings');
      }
    } catch (error) {
      console.error('Error updating extension settings:', error);
      setError('Network error. Please try again.');
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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earning Period Extension Settings</h1>
          <p className="text-gray-600">Configure how referrals extend earning periods for each membership plan</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            resetForm();
            setEditingExtension(null);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Extension Rule</span>
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
              {editingExtension ? 'Edit Extension Settings' : 'Create Extension Settings'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingExtension(null);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Basic Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membership Plan</label>
                <select
                  value={extensionForm.planId}
                  onChange={(e) => setExtensionForm(prev => ({ ...prev, planId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select a plan</option>
                  {membershipPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.displayName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Earning Days</label>
                  <input
                    type="number"
                    value={extensionForm.baseEarningDays}
                    onChange={(e) => setExtensionForm(prev => ({ ...prev, baseEarningDays: e.target.value }))}
                    placeholder="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Extended Days</label>
                  <input
                    type="number"
                    value={extensionForm.maxExtendedDays}
                    onChange={(e) => setExtensionForm(prev => ({ ...prev, maxExtendedDays: e.target.value }))}
                    placeholder="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Referrals Required</label>
                <input
                  type="number"
                  value={extensionForm.referralsRequired}
                  onChange={(e) => setExtensionForm(prev => ({ ...prev, referralsRequired: e.target.value }))}
                  placeholder="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Extension Preview</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Earning Period Timeline</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• Base period: {extensionForm.baseEarningDays} days</div>
                  <div>• Maximum period: {extensionForm.maxExtendedDays} days</div>
                  <div>• Extension possible: {parseInt(extensionForm.maxExtendedDays) - parseInt(extensionForm.baseEarningDays)} days</div>
                  <div>• Min referrals needed: {extensionForm.referralsRequired}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Extension Rules */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">Extension Rules</h3>
              <button
                onClick={addExtensionRule}
                className="text-green-600 hover:text-green-700 text-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add Rule</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {extensionForm.extensionRules.map((rule, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-sm">Rule {index + 1}</span>
                    {extensionForm.extensionRules.length > 1 && (
                      <button
                        onClick={() => removeExtensionRule(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Min Referrals</label>
                      <input
                        type="number"
                        value={rule.minReferrals}
                        onChange={(e) => updateExtensionRule(index, 'minReferrals', e.target.value)}
                        placeholder="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Extension Days</label>
                      <input
                        type="number"
                        value={rule.extensionDays}
                        onChange={(e) => updateExtensionRule(index, 'extensionDays', e.target.value)}
                        placeholder="30"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={rule.description}
                        onChange={(e) => updateExtensionRule(index, 'description', e.target.value)}
                        placeholder="Rule description"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
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
                setEditingExtension(null);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => editingExtension ? handleUpdateExtension(editingExtension) : handleCreateExtension()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{editingExtension ? 'Update Settings' : 'Create Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Extension Settings List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {extensionSettings.map((extension) => (
          <div key={extension.id} className="bg-white rounded-lg shadow-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{extension.planName}</h3>
                  <p className="text-sm text-gray-600">Extension Settings</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => startEdit(extension)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Period:</span>
                <span className="font-semibold">{extension.baseEarningDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Extended:</span>
                <span className="font-semibold">{extension.maxExtendedDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Min Referrals:</span>
                <span className="font-semibold">{extension.referralsRequired}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm">Extension Rules</span>
                <span className="text-xs text-gray-500">{extension.extensionRules.length} rules</span>
              </div>
              <div className="space-y-2">
                {extension.extensionRules.map((rule, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="font-medium">{rule.minReferrals} referrals → +{rule.extensionDays} days</div>
                    <div className="text-gray-600">{rule.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <button
                onClick={() => handleToggleActive(extension.id, extension.isActive)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  extension.isActive 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {extension.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {extensionSettings.length === 0 && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Extension Settings</h3>
          <p className="text-gray-600 mb-4">Configure how referrals extend earning periods for membership plans</p>
          <button
            onClick={() => {
              setShowCreateForm(true);
              resetForm();
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Create First Extension Rule
          </button>
        </div>
      )}
    </div>
  );
}
