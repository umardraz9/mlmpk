import React from 'react';
import Link from 'next/link';

export default function InvestmentPage() {
  return (
    <div>
      <h1>Investment Page</h1>
      <div className="text-center">
        <Link href="/guide" legacyBehavior>
          <a>Guide</a>
        </Link>
      </div>
    </div>
  );
} 