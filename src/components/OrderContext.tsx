'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { MenuItem, OrderItem } from '@/types';

interface OrderState {
  orderItems: OrderItem[];
}

interface OrderContextType extends OrderState {
  addItem: (item: MenuItem, quantity: number) => void;
  updateItemQuantity: (itemId: string, newQuantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getCartTotalQuantity: () => number;
  getCartTotalPrice: () => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

type OrderAction =
  | { type: 'ADD_ITEM'; payload: { item: MenuItem; quantity: number } }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { itemId: string; newQuantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE_CART'; payload: { orderItems: OrderItem[] } };

const orderReducer = (state: OrderState, action: OrderAction): OrderState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, quantity } = action.payload;
      if (quantity <= 0) return state; // Do not add if quantity is zero or less

      // Create a new item object without the stock quantity to avoid confusion
      const { quantity: stockQuantity, ...itemWithoutQuantity } = item;
      
      const existingItemIndex = state.orderItems.findIndex(orderItem => orderItem.id === item.id);
      if (existingItemIndex > -1) {
        const updatedItems = state.orderItems.map((orderItem, index) =>
          index === existingItemIndex
            ? { ...orderItem, quantity: orderItem.quantity + quantity }
            : orderItem
        );
        return { ...state, orderItems: updatedItems };
      } else {
        return { 
          ...state, 
          orderItems: [...state.orderItems, { ...itemWithoutQuantity, quantity }] 
        };
      }
    }
    case 'UPDATE_ITEM_QUANTITY': {
      const { itemId, newQuantity } = action.payload;
      if (newQuantity <= 0) {
        return { ...state, orderItems: state.orderItems.filter(item => item.id !== itemId) };
      }
      return {
        ...state,
        orderItems: state.orderItems.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        ),
      };
    }
    case 'REMOVE_ITEM': {
      return {
        ...state,
        orderItems: state.orderItems.filter(item => item.id !== action.payload.itemId),
      };
    }
    case 'CLEAR_CART':
      return { ...state, orderItems: [] };
    case 'HYDRATE_CART': {
      return { ...state, orderItems: action.payload.orderItems };
    }
    default:
      return state;
  }
};

const CART_STORAGE_KEY = 'fundraise_cart';

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(orderReducer, { orderItems: [] });
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate cart from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        let orderItems: OrderItem[] = [];
        if (Array.isArray(parsed)) {
          orderItems = parsed;
        } else if (parsed && Array.isArray(parsed.orderItems)) {
          orderItems = parsed.orderItems;
        }
        if (orderItems.length > 0) {
          dispatch({ type: 'HYDRATE_CART', payload: { orderItems } });
        }
      }
    } catch (e) {
      // Ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  // Sync orderItems to localStorage whenever they change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (state.orderItems.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.orderItems));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (e) {
      // Ignore write errors
    }
  }, [state.orderItems, hydrated]);

  const addItem = useCallback((item: MenuItem, quantity: number) => {
    dispatch({ type: 'ADD_ITEM', payload: { item, quantity } });
  }, []);

  const updateItemQuantity = useCallback((itemId: string, newQuantity: number) => {
    dispatch({ type: 'UPDATE_ITEM_QUANTITY', payload: { itemId, newQuantity } });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      // Ignore
    }
  }, []);
  
  const getCartTotalQuantity = useCallback(() => {
    return state.orderItems.reduce((total, item) => total + item.quantity, 0);
  }, [state.orderItems]);

  const getCartTotalPrice = useCallback(() => {
    return state.orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [state.orderItems]);

  // Optionally, don't render children until hydrated to avoid UI flicker
  if (!hydrated) return null;

  return (
    <OrderContext.Provider
      value={{
        ...state,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        getCartTotalQuantity,
        getCartTotalPrice,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
