'use client';

import React, { memo } from 'react';

// Mini chart components (no external deps)
export const Sparkline = memo(({ 
  data, 
  width = 200, 
  height = 50, 
  stroke = '#10b981' 
}: { 
  data: number[]; 
  width?: number; 
  height?: number; 
  stroke?: string 
}) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const step = width / Math.max(1, data.length - 1);
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline fill="none" stroke={stroke} strokeWidth="2" points={points} />
    </svg>
  );
});

Sparkline.displayName = 'Sparkline';

export const RingProgress = memo(({ 
  size = 120, 
  value, 
  color = '#3b82f6', 
  trackColor = '#e5e7eb' 
}: { 
  size?: number; 
  value: number; 
  color?: string; 
  trackColor?: string 
}) => {
  const degree = Math.max(0, Math.min(100, value)) * 3.6;
  return (
    <div
      className="rounded-full grid place-items-center"
      style={{ 
        width: size, 
        height: size, 
        background: `conic-gradient(${color} ${degree}deg, ${trackColor} 0deg)` 
      }}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-full" 
        style={{ width: size - 16, height: size - 16 }} 
      />
    </div>
  );
});

RingProgress.displayName = 'RingProgress';
