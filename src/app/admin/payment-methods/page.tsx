'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Building2, 
  CreditCard, 
  Pencil, 
  Eye, 
  EyeOff, 
  Plus, 
  Smartphone, 
  Trash2 
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  accountName: string;
  accountNumber: string;
  bankName?: string;
  branchCode?: string;
  instructions?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  creator: {
    name: string;
    email: string;
  };
}

interface PaymentMethodForm {
  name: string;
  type: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchCode: string;
  instructions: string;
  isActive: boolean;
  displayOrder: number;
}

const initialForm: PaymentMethodForm = {
  name: '',
  type: 'MOBILE_WALLET',
  accountName: '',
  accountNumber: '',
  bankName: '',
  branchCode: '',
  instructions: '',
  isActive: true,
  displayOrder: 0
};

const paymentTypes = [
  { value: 'MOBILE_WALLET', label: 'Mobile Wallet', icon: Smartphone },
  { value: 'BANK_ACCOUNT', label: 'Bank Account', icon: Building2 },
  { value: 'OTHER', label: 'Other', icon: CreditCard }
];

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState<PaymentMethodForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [showAccountNumbers, setShowAccountNumbers] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods');
      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(data.paymentMethods);
      } else {
        console.error('Failed to fetch payment methods:', data.error);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Manually construct FormData from the state to ensure all fields are included
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('type', form.type.toUpperCase());
      formData.append('accountName', form.accountName);
      formData.append('accountNumber', form.accountNumber);
      formData.append('bankName', form.bankName);
      formData.append('branchCode', form.branchCode);
      formData.append('instructions', form.instructions);
      formData.append('isActive', String(form.isActive));
      formData.append('displayOrder', String(form.displayOrder));
      
      // Convert FormData to object for logging
      const formDataObj = Object.fromEntries(formData.entries());
      console.log('Submitting form data:', formDataObj);
      
      const url = editingMethod 
        ? `/api/admin/payment-methods/${editingMethod.id}`
        : '/api/admin/payment-methods';
      
      const method = editingMethod ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        await fetchPaymentMethods();
        setDialogOpen(false);
        setEditingMethod(null);
        setForm(initialForm);
      } else {
        alert(data.error || 'Failed to save payment method');
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      alert('Failed to save payment method');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setForm({
      name: method.name,
      type: method.type,
      accountName: method.accountName,
      accountNumber: method.accountNumber,
      bankName: method.bankName || '',
      branchCode: method.branchCode || '',
      instructions: method.instructions || '',
      isActive: method.isActive,
      displayOrder: method.displayOrder
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await fetchPaymentMethods();
      } else {
        alert(data.error || 'Failed to delete payment method');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      alert('Failed to delete payment method');
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = paymentTypes.find(t => t.value === type);
    const Icon = typeConfig?.icon || CreditCard;
    return <Icon className="w-5 h-5" />;
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Payment Methods</h1>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600">Manage payment methods for manual payments</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setShowAccountNumbers(!showAccountNumbers)}
            className="flex items-center space-x-2"
          >
            {showAccountNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showAccountNumbers ? 'Hide' : 'Show'} Account Numbers</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingMethod(null);
                  setForm(initialForm);
                }}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Payment Method</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Payment Method Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      placeholder="e.g., JazzCash, EasyPaisa, HBL Bank"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <input type="hidden" name="type" value={form.type} />
                    <Select value={form.type} onValueChange={(value) => setForm({...form, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              <type.icon className="w-4 h-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountName">Account Holder Name *</Label>
                    <Input
                      id="accountName"
                      name="accountName"
                      value={form.accountName}
                      onChange={(e) => setForm({...form, accountName: e.target.value})}
                      placeholder="Account holder's full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">
                      {form.type === 'mobile_wallet' ? 'Phone Number *' : 'Account Number *'}
                    </Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      value={form.accountNumber}
                      onChange={(e) => setForm({...form, accountNumber: e.target.value})}
                      placeholder={form.type === 'mobile_wallet' ? '+92 300 1234567' : '1234567890'}
                      required
                    />
                  </div>
                </div>

                {form.type === 'bank_account' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        name="bankName"
                        value={form.bankName}
                        onChange={(e) => setForm({...form, bankName: e.target.value})}
                        placeholder="e.g., Habib Bank Limited"
                      />
                    </div>
                    <div>
                      <Label htmlFor="branchCode">Branch Code</Label>
                      <Input
                        id="branchCode"
                        name="branchCode"
                        value={form.branchCode}
                        onChange={(e) => setForm({...form, branchCode: e.target.value})}
                        placeholder="e.g., 1234"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="instructions">Payment Instructions</Label>
                  <Textarea
                    id="instructions"
                    name="instructions"
                    value={form.instructions}
                    onChange={(e) => setForm({...form, instructions: e.target.value})}
                    placeholder="Additional instructions for users making payments..."
                    rows={3}
                  />
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="isActive"
                      name="isActive"
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm({...form, isActive: checked})}
                    />
                    <Label>Active</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : editingMethod ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="grid gap-4">
        {paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Methods</h3>
              <p className="text-gray-500 text-center mb-4">
                Add payment methods to allow users to make manual payments
              </p>
            </CardContent>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <Card key={method.id} className={`${!method.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(method.type)}
                    <div>
                      <CardTitle className="text-lg">{method.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {paymentTypes.find(t => t.value === method.type)?.label}
                        {!method.isActive && ' • Inactive'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(method)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(method.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Account Holder</p>
                    <p className="text-sm text-gray-900">{method.accountName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {method.type === 'mobile_wallet' ? 'Phone Number' : 'Account Number'}
                    </p>
                    <p className="text-sm text-gray-900 font-mono">
                      {showAccountNumbers ? method.accountNumber : maskAccountNumber(method.accountNumber)}
                    </p>
                  </div>
                  {method.bankName && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Bank</p>
                      <p className="text-sm text-gray-900">{method.bankName}</p>
                    </div>
                  )}
                  {method.branchCode && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Branch Code</p>
                      <p className="text-sm text-gray-900">{method.branchCode}</p>
                    </div>
                  )}
                </div>
                {method.instructions && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">Instructions</p>
                    <p className="text-sm text-gray-600 mt-1">{method.instructions}</p>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created by {method.creator.name} on {new Date(method.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
