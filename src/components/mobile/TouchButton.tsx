'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function TouchButton({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'default', 
  size = 'default',
  className = '' 
}: TouchButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      size={size}
      className={`min-h-[44px] touch-manipulation ${className}`}
    >
      {children}
    </Button>
  );
}

interface TouchInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function TouchInput({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  className = '' 
}: TouchInputProps) {
  return (
    <Input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`min-h-[44px] touch-manipulation ${className}`}
    />
  );
}

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, className = '' }: PullToRefreshProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
