export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  quantity: number;
}

export interface OrderItem extends MenuItem {
  quantity: number;
}
