'use client';

import React from 'react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-50">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Page Not Found</h1>
      <p className="text-lg mb-6 max-w-md">The page you are looking for does not exist.</p>
    </div>
  );
}
