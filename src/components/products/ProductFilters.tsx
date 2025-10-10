'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface ProductFiltersProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = memo(({
  categories,
  selectedCategory,
  onCategorySelect
}) => {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
        <h2 className="text-lg font-semibold mb-4">Categories</h2>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-colors duration-200",
                selectedCategory === category.id
                  ? "bg-green-100 text-green-800 font-medium"
                  : "hover:bg-gray-100 text-gray-700"
              )}
              aria-label={`Filter by ${category.name} (${category.count} products)`}
            >
              <div className="flex justify-between items-center">
                <span>{category.name}</span>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

ProductFilters.displayName = 'ProductFilters';
