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
    <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-screen-2xl px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2">
            <Utensils className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="font-bold text-lg sm:text-xl text-foreground">Fundraising</span>
          </Link>
          <nav className="flex items-stretch h-full">
            <Button 
              variant="ghost" 
              asChild 
              size="sm"
              className="h-full px-3 sm:px-4 mx-0.5 sm:mx-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm sm:text-base"
            >
              <Link href="/" className="flex items-center gap-1 sm:gap-1.5">
                <span>Menu</span>
              </Link>
            </Button>
            <div className="relative h-full flex items-center">
              <Button 
                variant="ghost" 
                asChild 
                size="sm"
                className="h-full px-3 sm:px-4 mx-0.5 sm:mx-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm sm:text-base"
              >
                <Link href="/order" className="flex items-center gap-1 sm:gap-1.5">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden xs:inline">Order</span>
                </Link>
              </Button>
              {totalQuantity > 0 && (
                <div className="absolute -top-1 right-0 flex items-start justify-center h-5 w-5">
                  <Badge
                    variant="destructive"
                    className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full mt-1.5"
                  >
                    {totalQuantity}
                  </Badge>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
