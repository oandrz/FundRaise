import type { MenuItem } from '@/types';

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Classic Burger',
    description: 'A juicy beef patty with fresh lettuce, tomato, and our special sauce.',
    price: 9.99,
    category: 'Burgers',
    imageUrl: 'https://placehold.co/600x400.png',
    // data-ai-hint: "burger gourmet"
  },
  {
    id: '2',
    name: 'Cheese Pizza',
    description: 'Classic cheese pizza with a rich tomato sauce and mozzarella.',
    price: 12.50,
    category: 'Pizzas',
    imageUrl: 'https://placehold.co/600x400.png',
    // data-ai-hint: "pizza cheese"
  },
  {
    id: '3',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce, croutons, Parmesan cheese, and Caesar dressing.',
    price: 7.25,
    category: 'Salads',
    imageUrl: 'https://placehold.co/600x400.png',
    // data-ai-hint: "salad caesar"
  },
  {
    id: '4',
    name: 'French Fries',
    description: 'Golden crispy French fries, lightly salted.',
    price: 3.50,
    category: 'Sides',
    imageUrl: 'https://placehold.co/600x400.png',
    // data-ai-hint: "french fries"
  },
  {
    id: '5',
    name: 'Chocolate Milkshake',
    description: 'Thick and creamy chocolate milkshake topped with whipped cream.',
    price: 5.00,
    category: 'Drinks',
    imageUrl: 'https://placehold.co/600x400.png',
    // data-ai-hint: "milkshake chocolate"
  },
  {
    id: '6',
    name: 'Spaghetti Carbonara',
    description: 'Spaghetti with creamy egg sauce, pancetta, and pecorino cheese.',
    price: 14.00,
    category: 'Pastas',
    imageUrl: 'https://placehold.co/600x400.png',
    // data-ai-hint: "pasta carbonara"
  },
];
