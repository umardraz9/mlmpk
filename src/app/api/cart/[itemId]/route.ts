import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

// PUT - Update cart item quantity
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = params;
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 });
    }
    // Load cart item
    const { data: item, error: itemError } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('id', itemId)
      .single();
    if (itemError || !item) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    // Verify ownership
    const { data: cart } = await supabase
      .from('carts')
      .select('id, userId')
      .eq('id', item.cartId)
      .single();
    if (!cart || cart.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Stock check
    if (item.product?.trackQuantity && Number(item.product?.quantity || 0) < quantity) {
      return NextResponse.json({ error: `Only ${item.product?.quantity || 0} items available in stock` }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity, updatedAt: new Date().toISOString() })
      .eq('id', itemId);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Cart item updated successfully' });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = params;
    const { data: item } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', itemId)
      .single();
    if (!item) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }
    const { data: cart } = await supabase
      .from('carts')
      .select('id, userId')
      .eq('id', item.cartId)
      .single();
    if (!cart || cart.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { error: delError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);
    if (delError) {
      return NextResponse.json({ error: 'Failed to remove cart item' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
