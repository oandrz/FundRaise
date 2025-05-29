'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PartyPopper } from 'lucide-react';

export default function OrderSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <PartyPopper className="w-24 h-24 text-green-500 mb-6" />
      <h1 className="text-4xl font-bold text-foreground mb-4">Order Confirmed!</h1>
      <p className="text-muted-foreground text-lg mb-8">
        Thank you for your order! We've received it and will start preparing your items shortly.
      </p>
      <div className="space-x-4">
        <Button asChild size="lg">
          <Link href="/">Back to Menu</Link>
        </Button>
      </div>
    </div>
  );
}
