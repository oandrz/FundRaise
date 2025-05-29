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
    const value = parseInt(e.target.value, 10);
    if (value >= 1) {
      setQuantity(value);
    } else {
      setQuantity(1); // default to 1 if invalid input
    }
  };

  const handleAddItem = () => {
    if (quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a quantity greater than 0.',
        variant: 'destructive',
      });
      return;
    }
    addItem(item, quantity);
    toast({
      title: 'Item Added',
      description: `${quantity}x ${item.name} added to your order.`,
    });
    setQuantity(1); // Reset quantity for next addition
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {item.imageUrl && (
        <div className="relative w-full h-48">
          <Image 
            src={item.imageUrl} 
            alt={item.name} 
            layout="fill" 
            objectFit="cover" 
            data-ai-hint={`${item.category.toLowerCase()} food`}
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{item.name}</CardTitle>
        <CardDescription className="text-sm h-12 overflow-y-auto">{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-lg font-semibold text-primary">${item.price.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">Category: {item.category}</p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center gap-2 p-4 bg-muted/30">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label htmlFor={`quantity-${item.id}`} className="sr-only">Quantity</Label>
          <Input
            id={`quantity-${item.id}`}
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="w-20 text-center"
            aria-label={`Quantity for ${item.name}`}
          />
        </div>
        <Button onClick={handleAddItem} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" />
          Add to Order
        </Button>
      </CardFooter>
    </Card>
  );
}
