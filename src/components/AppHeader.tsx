'use client';

import Link from 'next/link';
import { ShoppingCart, Utensils } from 'lucide-react';
import { useOrder } from '@/components/OrderContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function AppHeader() {
  const { getCartTotalQuantity } = useOrder();
  const totalQuantity = getCartTotalQuantity();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl text-foreground">Sheet Eats</span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/">Menu</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/order" className="relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-2">Order</span>
              {totalQuantity > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-3 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
                >
                  {totalQuantity}
                </Badge>
              )}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
