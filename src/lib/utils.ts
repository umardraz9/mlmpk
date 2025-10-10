// Simple utility functions for MLM-Pak

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names into a single string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency as PKR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString()}`;
}

/**
 * Calculate MLM commission based on level
 * @deprecated Use commissionService.calculateCommission() for dynamic rates
 */
export function calculateCommission(amount: number, level: number): number {
  // Legacy fallback rates - use commissionService for dynamic rates
  const commissionRates = [0.20, 0.15, 0.10, 0.08, 0.07];
  const rate = level <= commissionRates.length ? commissionRates[level - 1] : 0;
  return Math.round(amount * rate);
}

/**
 * Generate a referral code from a name
 */
export function generateReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
  const prefix = cleanName.substring(0, 3).toUpperCase();
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${randomPart}`;
}

/**
 * Format a date in a readable format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculate reading time for a text
 */
export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Truncate text to a specific length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Validate a Pakistani phone number
 */
export function isValidPakistaniPhone(phone: string): boolean {
  const phoneRegex = /^(\+92|0092|0)[3][0-9]{9}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate a Pakistani CNIC
 */
export function isValidPakistaniCNIC(cnic: string): boolean {
  const cnicRegex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
  return cnicRegex.test(cnic);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(dateObj);
}

export function generateUsername(email: string): string {
  return email.split('@')[0].toLowerCase();
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-PK', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePakistaniPhone(phone: string): boolean {
  const phoneRegex = /^(\+92|0)?[3-9]\d{8,9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
} 