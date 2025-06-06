'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PartyPopper } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    // Get the customer details from the URL query parameters
    const name = searchParams.get('name') || '';
    const phone = searchParams.get('phone') || '';
    setCustomerName(name);
    setCustomerPhone(phone);
  }, [searchParams]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <PartyPopper className="w-24 h-24 text-green-500 mb-6" />
      <h1 className="text-4xl font-bold text-foreground mb-4">Order Confirmed!</h1>
      <div className="text-muted-foreground text-lg mb-8 space-y-4">
        <p>
          Thank you for your order{customerName ? `, ${customerName}` : ''}! 
          We've received it and will start preparing your items shortly.
        </p>
        {customerPhone && (
          <p className="bg-muted p-4 rounded-lg">
            <span className="font-medium">Order Details:</span>
            <br />
            Name: {customerName || 'Not provided'}
            <br />
            Phone: {customerPhone}
          </p>
        )}
      </div>
      <div className="space-x-4">
        <Button asChild size="lg">
          <Link href="/">Back to Menu</Link>
        </Button>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-pulse text-muted-foreground">Loading order details...</div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
