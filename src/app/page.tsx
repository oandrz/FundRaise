'use client';

import { useEffect, useState } from 'react';
import { MenuItemCard } from '@/components/MenuItemCard';
import type { MenuItem } from '@/types';

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch('/api/menu');
        if (!response.ok) {
          throw new Error('Failed to fetch menu items');
        }
        const data = await response.json();
        setMenuItems(data);
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError('Failed to load menu. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-destructive">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8 p-3 sm:p-4 max-w-7xl mx-auto">
      <div className="text-center space-y-2 px-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Our Menu</h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          Explore our delicious offerings and add items to your order.
        </p>
      </div>
      
      {Array.from(new Set(menuItems.map(item => item.category))).map((category) => {
        const items = menuItems.filter(item => item.category === category);
        if (items.length === 0) return null;
        
        return (
          <section key={category} className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground px-2">{category}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {items.map((item) => (
                <div key={item.id} className="h-full">
                  <MenuItemCard item={item} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
      
      {menuItems.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No menu items available at the moment.</p>
        </div>
      )}
    </div>
  );
}
