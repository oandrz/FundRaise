'use client';

import type { ChangeEvent } from 'react';
import React, { useState } from 'react';
import Image from 'next/image';
import { PlusCircle } from 'lucide-react';
import type { MenuItem } from '@/types';
import { useOrder } from '@/components/OrderContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from './ui/label';

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useOrder();
  const { toast } = useToast();

  const handleQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Skip if input is empty
    if (value === '') {
      return;
    }
    
    // Only process if it's a valid number
    if (/^[0-9]+$/.test(value)) {
      setQuantity(parseInt(value, 10));
    }
  };

  const handleAddItem = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent form submission and page reload
    
    if (quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a quantity greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    if (quantity > item.quantity) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${item.quantity} ${item.name} available in stock.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      // Add item to the order first for better UX
      addItem(item, quantity);
      
      // Show success toast immediately
      toast({
        title: 'Item Added',
        description: `${quantity}x ${item.name} added to your order.`,
      });
      
      // Update the quantity in the Google Sheet in the background
      const updatePromise = fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.id,
          quantity: item.quantity - quantity,
        }),
      });
      
      // We don't await the update here to keep the UI responsive
      // The page will show the updated quantity on the next refresh
      // or when the menu is refetched
      updatePromise.catch(error => {
        console.error('Error updating item quantity:', error);
        toast({
          title: 'Sync Error',
          description: `${item.name} was added to your order, but there was an issue updating the inventory.`,
          variant: 'destructive',
        });
      });
      
      // Reset quantity for next addition
      setQuantity(1);
      
    } catch (error) {
      console.error('Error adding item to order:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex">
      <div className="flex flex-col flex-grow p-2 sm:p-3">
        <CardHeader className="p-2 sm:p-4 pb-0 sm:pb-0">
          <CardTitle className="text-base sm:text-lg line-clamp-1">{item.name}</CardTitle>
          <CardDescription className="text-xs sm:text-sm line-clamp-2 h-8 sm:h-10">
            {item.description}
          </CardDescription>
        </CardHeader>
        <div className="px-2 sm:px-4 py-1">
          <p className="text-sm sm:text-base font-semibold text-primary">${item.price.toFixed(2)}</p>
        </div>
        <div className="mt-auto p-2 sm:p-4 pt-0 sm:pt-0">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <div className="flex items-center w-full sm:w-auto">
              <Label htmlFor={`quantity-${item.id}`} className="sr-only">Quantity</Label>
              <Input
                id={`quantity-${item.id}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min="1"
                max={item.quantity}
                value={quantity}
                onChange={handleQuantityChange}
                className="h-8 text-center text-sm w-16"
                aria-label={`Quantity for ${item.name}`}
                disabled={item.quantity <= 0}
              />
              {item.quantity <= 0 && (
                <span className="text-xs text-destructive ml-2">Out of stock</span>
              )}
            </div>
            <Button 
              type="button"
              onClick={handleAddItem} 
              size="sm" 
              className="w-full sm:w-auto"
              disabled={item.quantity <= 0}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> 
              {item.quantity > 0 ? 'Add' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
