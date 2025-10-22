import { NextRequest, NextResponse } from 'next/server';

// Demo products data
const demoProducts = [
  {
    id: '1',
    name: 'Premium Health Supplement',
    description: 'High-quality health supplement for daily wellness',
    price: 2500,
    originalPrice: 3000,
    discountPercentage: 17,
    images: ['/images/products/supplement.jpg'],
    category: 'Health & Wellness',
    status: 'ACTIVE',
    stock: 50,
    rating: 4.5,
    reviewCount: 25
  },
  {
    id: '2',
    name: 'Organic Green Tea',
    description: 'Premium organic green tea with natural antioxidants',
    price: 1200,
    originalPrice: 1500,
    discountPercentage: 20,
    images: ['/images/products/green-tea.jpg'],
    category: 'Beverages',
    status: 'ACTIVE',
    stock: 100,
    rating: 4.8,
    reviewCount: 42
  },
  {
    id: '3',
    name: 'Fitness Tracker Watch',
    description: 'Smart fitness tracker with heart rate monitoring',
    price: 8500,
    originalPrice: 10000,
    discountPercentage: 15,
    images: ['/images/products/fitness-tracker.jpg'],
    category: 'Electronics',
    status: 'ACTIVE',
    stock: 25,
    rating: 4.3,
    reviewCount: 18
  }
];

// GET - List all active products for public access
export async function GET(request: NextRequest) {
  try {
    console.log('Products API called');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Filter demo products based on search and category
    let filteredProducts = [...demoProducts];
    
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(product => 
        product.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    if (search) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(skip, skip + limit);
    const totalCount = filteredProducts.length;
    const totalPages = Math.ceil(totalCount / limit);

    console.log(`Returning ${paginatedProducts.length} products, total: ${totalCount}`);

    return NextResponse.json({
      success: true,
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load products' },
      { status: 500 }
    );
  }
} 