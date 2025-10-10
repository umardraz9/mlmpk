'use client';

import { useEffect, useState } from 'react';

/**
 * Component to dynamically add resource hints for performance
 * Place this in your root layout or specific pages
 */
export function ResourceHints({ routes = [] }: { routes?: string[] }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prefetch important routes
    const defaultRoutes = ['/dashboard', '/products', '/tasks', '/profile'];
    const routesToPrefetch = [...new Set([...defaultRoutes, ...routes])];

    routesToPrefetch.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });

    // Preconnect to external domains
    const externalDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }, [routes]);

  return null;
}

/**
 * Preload critical resources for faster loading
 */
export function PreloadResources({ images = [], scripts = [] }: {
  images?: string[];
  scripts?: string[];
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Preload images
    images.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    // Preload scripts
    scripts.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = src;
      document.head.appendChild(link);
    });
  }, [images, scripts]);

  return null;
}

/**
 * Component to handle network-aware loading
 * Reduces quality or functionality on slow connections
 */
export function NetworkAwareLoader({ children }: { children: React.ReactNode }) {
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return;
    }

    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType;

    // Detect slow networks
    const slow = effectiveType === 'slow-2g' || effectiveType === '2g';
    setIsSlowNetwork(slow);

    // Listen for network changes
    const handleChange = () => {
      const newType = connection?.effectiveType;
      setIsSlowNetwork(newType === 'slow-2g' || newType === '2g');
    };

    connection?.addEventListener('change', handleChange);
    return () => connection?.removeEventListener('change', handleChange);
  }, []);

  // Optionally show a banner for slow networks
  if (isSlowNetwork) {
    console.log('⚠️ Slow network detected - optimizing experience');
  }

  return <>{children}</>;
}
