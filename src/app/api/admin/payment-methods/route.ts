import { NextRequest, NextResponse } from 'next/server';
import { unstable_getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Configure API route options for dynamic data and no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Use in-memory array since we're having database issues
let paymentMethods: any[] = [
  {
    id: '1',
    name: 'JazzCash',
    type: 'MOBILE_WALLET',
    accountName: 'MCNmart Admin',
    accountNumber: '03001234567',
    bankName: null,
    branchCode: null,
    instructions: 'Send payment to this JazzCash number and upload screenshot',
    isActive: true,
    displayOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: { name: 'Admin', email: 'admin@mcnmart.com' }
  },
  {
    id: '2',
    name: 'EasyPaisa',
    type: 'MOBILE_WALLET',
    accountName: 'MCNmart Admin',
    accountNumber: '03009876543',
    bankName: null,
    branchCode: null,
    instructions: 'Send payment to this EasyPaisa number and upload screenshot',
    isActive: true,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: { name: 'Admin', email: 'admin@mcnmart.com' }
  }
];

// GET /api/admin/payment-methods - Get all payment methods
export async function GET(request: NextRequest) {
  try {
    // @ts-ignore
    const session = await unstable_getServerSession(request, authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // @ts-ignore
    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true,
      paymentMethods 
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch payment methods' 
    }, { status: 500 });
  }
}

// POST /api/admin/payment-methods - Create new payment method
export async function POST(request: NextRequest) {
  try {
    // @ts-ignore
    const session = await unstable_getServerSession(request, authOptions);
    
    if (!session || !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle both FormData and JSON requests
    let name, type, accountName, accountNumber, bankName, branchCode, instructions, isActive, displayOrder;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle FormData
      const formData = await request.formData();
      name = formData.get('name') as string;
      type = formData.get('type') as string;
      accountName = formData.get('accountName') as string;
      accountNumber = formData.get('accountNumber') as string;
      bankName = formData.get('bankName') as string;
      branchCode = formData.get('branchCode') as string;
      instructions = formData.get('instructions') as string;
      isActive = formData.get('isActive') === 'true';
      displayOrder = parseInt(formData.get('displayOrder') as string) || 0;
      
      console.log('Received FormData:', { name, type, accountName, accountNumber });
    } else {
      // Handle JSON
      const jsonData = await request.json();
      ({ name, type, accountName, accountNumber, bankName, branchCode, instructions, isActive, displayOrder } = jsonData);
      
      console.log('Received JSON data:', { name, type, accountName, accountNumber });
    }

    // Validation
    if (!name || !type || !accountName || !accountNumber) {
      return NextResponse.json(
        { error: 'Name, type, account name, and account number are required' },
        { status: 400 }
      );
    }

    // Check if account number already exists
    const existingMethod = paymentMethods.find(
      method => method.accountNumber === accountNumber && method.type === type
    );

    if (existingMethod) {
      return NextResponse.json(
        { error: 'Payment method with this account number already exists' },
        { status: 400 }
      );
    }

    const newPaymentMethod = {
      id: Date.now().toString(),
      name,
      type,
      accountName,
      accountNumber,
      bankName: bankName || null,
      branchCode: branchCode || null,
      instructions: instructions || null,
      isActive: isActive ?? true,
      displayOrder: displayOrder ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      creator: { name: session.user.name || 'Admin', email: session.user.email || 'admin@mcnmart.com' }
    };

    paymentMethods.push(newPaymentMethod);
    console.log('Created new payment method:', newPaymentMethod);
    console.log('Current payment methods:', paymentMethods);

    return NextResponse.json({ 
      success: true, 
      paymentMethod: newPaymentMethod 
    });

  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    );
  }
}
