'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useOrder } from '@/components/OrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Trash2, ShoppingBag, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { confirmOrder } from '@/lib/actions';
import Link from 'next/link';

export default function OrderPage() {
  const { orderItems, updateItemQuantity, removeItem, clearCart, getCartTotalPrice } = useOrder();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = getCartTotalPrice();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity >= 0) { // Allow setting to 0 to remove
      updateItemQuantity(itemId, newQuantity);
    }
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    try {
      const result = await confirmOrder(orderItems);
      if (result.success) {
        toast({
          title: 'Order Confirmed!',
          description: `${result.message} (Order ID: ${result.orderId})`,
        });
        clearCart();
        router.push('/order/success'); // Optional: redirect to a success page
      } else {
        toast({
          title: 'Order Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (orderItems.length === 0 && !isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <ShoppingBag className="w-24 h-24 text-muted-foreground mb-6" />
        <h1 className="text-3xl font-semibold mb-2">Your Order is Empty</h1>
        <p className="text-muted-foreground mb-6">Looks like you haven't added any items to your order yet.</p>
        <Button asChild size="lg">
          <Link href="/">Start Ordering</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold tracking-tight text-center text-foreground">Your Order</h1>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>Review the items in your order before confirming.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell">Image</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center w-[120px]">Quantity</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="w-[50px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="hidden sm:table-cell">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                        data-ai-hint={`${item.category.toLowerCase()} food`}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10))}
                      className="w-20 text-center mx-auto"
                      aria-label={`Quantity for ${item.name}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name} from order`}>
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="hidden sm:table-cell"></TableCell>
                <TableCell className="sm:hidden table-cell font-semibold text-lg text-right" colSpan={2}>Total:</TableCell>
                <TableCell className="font-semibold text-lg text-right hidden sm:table-cell">Total:</TableCell>
                <TableCell className="font-semibold text-lg text-right">${totalPrice.toFixed(2)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-muted/30">
           <Button variant="outline" onClick={clearCart} disabled={isSubmitting}>
            Clear Order
          </Button>
          <Button 
            size="lg" 
            onClick={handleConfirmOrder} 
            disabled={isSubmitting || orderItems.length === 0}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-5 w-5" />
            )}
            {isSubmitting ? 'Confirming...' : 'Confirm Order'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
