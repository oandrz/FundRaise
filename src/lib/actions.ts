'use server';

import type { OrderItem } from '@/types';

export async function confirmOrder(orderItems: OrderItem[]): Promise<{ success: boolean; message: string; orderId?: string }> {
  console.log('Order received:', orderItems);

  // Simulate API call or database operation
  await new Promise(resolve => setTimeout(resolve, 1500));

  // In a real application, you would:
  // 1. Validate the orderItems
  // 2. Calculate the total server-side
  // 3. Save the order to a database
  // 4. Integrate with Google Sheets API to send data

  // For now, just simulate success
  const success = true; // Math.random() > 0.2; // Simulate occasional failure

  if (success) {
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    console.log(`Order ${orderId} confirmed successfully.`);
    return {
      success: true,
      message: 'Order confirmed successfully! We are preparing your meal.',
      orderId: orderId,
    };
  } else {
    console.error('Order confirmation failed.');
    return {
      success: false,
      message: 'There was an issue confirming your order. Please try again.',
    };
  }
}
