import { PizzaSize } from "./menuItem";

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  size?: PizzaSize;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export function createCart(id: string): Cart {
  return { id, items: [] };
}
