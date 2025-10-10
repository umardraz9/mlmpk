'use client';

import React, { memo, useState } from 'react';
import { MapPin, Phone, Mail, Edit3, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OrderContact {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

interface ShippingAddressCardProps {
  orderContact: OrderContact;
  useCustomAddress: boolean;
  onContactChange: (contact: OrderContact) => void;
  onCustomAddressToggle: (useCustom: boolean) => void;
  isProcessing?: boolean;
}

export const ShippingAddressCard: React.FC<ShippingAddressCardProps> = memo(({
  orderContact,
  useCustomAddress,
  onContactChange,
  onCustomAddressToggle,
  isProcessing = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempContact, setTempContact] = useState(orderContact);

  const handleEdit = () => {
    setTempContact(orderContact);
    setIsEditing(true);
    onCustomAddressToggle(true);
  };

  const handleSave = () => {
    onContactChange(tempContact);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempContact(orderContact);
    setIsEditing(false);
    onCustomAddressToggle(false);
  };

  const handleInputChange = (field: keyof OrderContact, value: string) => {
    setTempContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shipping Address
          </CardTitle>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              disabled={isProcessing}
              className="flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={tempContact.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={tempContact.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={tempContact.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isProcessing}
              />
            </div>

            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={tempContact.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="House/Flat number, Street name"
                disabled={isProcessing}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={tempContact.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <div>
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={tempContact.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={tempContact.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={isProcessing}
                className="flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isProcessing}
                className="flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {useCustomAddress && (
              <Badge variant="secondary" className="mb-2">
                Custom Address for This Order
              </Badge>
            )}
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <p className="font-medium">{orderContact.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{orderContact.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gray-500 mt-1" />
                <p className="text-sm text-gray-600 dark:text-gray-400">{orderContact.email}</p>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                <div className="text-sm">
                  <p className="font-medium">{orderContact.address}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {orderContact.city}, {orderContact.province} {orderContact.postalCode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ShippingAddressCard.displayName = 'ShippingAddressCard';
