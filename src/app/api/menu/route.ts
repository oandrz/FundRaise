import { NextResponse } from 'next/server';
import { getMenuItems, updateItemQuantity } from '@/lib/google-sheets';

export async function GET() {
  try {
    const menuItems = await getMenuItems();
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { itemId, quantity } = await request.json();
    
    if (!itemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await updateItemQuantity(itemId, quantity);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update item quantity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating item quantity:', error);
    return NextResponse.json(
      { error: 'Failed to update item quantity' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
