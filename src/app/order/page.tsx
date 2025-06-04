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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function OrderPage() {
  const { orderItems, updateItemQuantity, removeItem, clearCart, getCartTotalPrice } = useOrder();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PayNow');
  
  const validatePhone = (phone: string): boolean => {
    // Allow numbers, spaces, +, -, and parentheses
    const phoneRegex = /^[0-9\s+\-()]*$/;
    return phoneRegex.test(phone);
  };
  
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Check for Indonesian number (starts with 08, 628, +628, or 628)
    const indonesianMatch = cleaned.match(/^(\+?62|0)?(\d{3})(\d{3,4})(\d{3,4})$/);
    if (indonesianMatch) {
      const [, prefix, first, middle, last] = indonesianMatch;
      return `+62 ${first}${middle}${last}`.replace(/(\d{3})(\d{3,4})(\d{3,4})/, '$1-$2-$3');
    }
    
    // Check for Singapore number (starts with +65, 65, or 0)
    const singaporeMatch = cleaned.match(/^(\+?65|0)?(\d{4})(\d{4})$/);
    if (singaporeMatch) {
      const [, prefix, first, last] = singaporeMatch;
      return `+65 ${first} ${last}`;
    }
    
    // Default formatting if no specific pattern matches
    if (cleaned.length > 0) {
      return `+${cleaned}`;
    }
    
    return value;
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || validatePhone(value)) {
      setCustomerPhone(value);
      setPhoneError('');
    }
  };
  
  const handlePhoneBlur = () => {
    const trimmedPhone = customerPhone.trim();
    if (trimmedPhone === '') {
      setPhoneError('Phone number is required');
    } else {
      // Check for valid Indonesian or Singaporean number
      const cleaned = trimmedPhone.replace(/\D/g, '');
      const isIndonesian = /^(\+?62|0)[0-9]{9,12}$/.test(cleaned);
      const isSingaporean = /^(\+?65|0)[0-9]{8}$/.test(cleaned);
      
      if (!isIndonesian && !isSingaporean) {
        setPhoneError('Please enter a valid Indonesian (e.g., 0812-3456-7890) or Singaporean (e.g., +65 6123 4567) number');
      } else {
        // Format the phone number when leaving the field
        setCustomerPhone(formatPhoneNumber(cleaned));
        setPhoneError('');
      }
    }
  };

  const totalPrice = getCartTotalPrice();

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity >= 0) { // Allow setting to 0 to remove
      updateItemQuantity(itemId, newQuantity);
    }
  };

  const handleConfirmOrder = async () => {
    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();
    
    if (!trimmedName) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name before confirming the order.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!trimmedPhone) {
      setPhoneError('Phone number is required');
      toast({
        title: 'Phone Number Required',
        description: 'Please enter your phone number before confirming the order.',
        variant: 'destructive',
      });
      // Scroll to the phone input
      document.getElementById('customerPhone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('customerPhone')?.focus();
      return;
    }
    
    const cleanedPhone = trimmedPhone.replace(/\D/g, '');
    const isIndonesian = /^(\+?62|0)[0-9]{9,12}$/.test(cleanedPhone);
    const isSingaporean = /^(\+?65|0)[0-9]{8}$/.test(cleanedPhone);
    
    if (!isIndonesian && !isSingaporean) {
      setPhoneError('Please enter a valid Indonesian (e.g., 0812-3456-7890) or Singaporean (e.g., +65 6123 4567) number');
      document.getElementById('customerPhone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('customerPhone')?.focus();
      return;
    }
    
    const isPaid = paymentMethod === 'PayNow';
    setIsSubmitting(true);
    try {
      const result = await confirmOrder(orderItems, trimmedName, trimmedPhone, paymentMethod, isPaid);
      if (result.success) {
        toast({
          title: 'Order Confirmed!',
          description: `${result.message} (Order ID: ${result.orderId})`,
        });
        clearCart();
        // Redirect to success page with customer name as a query parameter
        router.push(`/order/success?name=${encodeURIComponent(trimmedName)}&phone=${encodeURIComponent(trimmedPhone)}`);
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
        <CardFooter className="flex flex-col gap-6 p-6 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="w-full">
              <label htmlFor="customerName" className="block text-sm font-medium mb-2">
                Your Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="customerName"
                type="text"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div className="w-full">
              <label htmlFor="customerPhone" className="block text-sm font-medium mb-2">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="e.g., 0812-3456-7890 (ID) or +65 6123 4567 (SG)"
                  value={customerPhone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  className={`w-full ${phoneError ? 'border-destructive' : ''}`}
                  required
                />
                {phoneError && (
                  <p className="text-sm text-destructive mt-1">{phoneError}</p>
                )}
              </div>
            </div>
          </div>
          <div className="w-full max-w-xs mb-4">
            <label htmlFor="paymentMethod" className="block text-sm font-medium mb-2">Payment Method</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod" className="w-full">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PayNow">PayNow</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
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
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
