import { randomUUID } from "crypto";
import { Cart, CartItem } from "../domain/cart";
import { MenuItem, PizzaSize } from "../domain/menuItem";

export interface AddItemOptions {
  size?: PizzaSize;
}

export class MissingPizzaSizeError extends Error {
  constructor(menuItem: MenuItem) {
    super(`A size must be selected for pizza "${menuItem.name}"`);
    this.name = "MissingPizzaSizeError";
  }
}

function resolveUnitPrice(menuItem: MenuItem, options?: AddItemOptions): number {
  if (menuItem.type === "PIZZA") {
    const size = options?.size;
    if (!size || !menuItem.sizePricing) {
      throw new MissingPizzaSizeError(menuItem);
    }
    return menuItem.sizePricing[size];
  }

  if (menuItem.price === undefined) {
    throw new Error(`Menu item "${menuItem.name}" has no price`);
  }
  return menuItem.price;
}

export function addItem(cart: Cart, menuItem: MenuItem, options?: AddItemOptions): CartItem {
  const unitPrice = resolveUnitPrice(menuItem, options);
  const quantity = 1;
  const cartItem: CartItem = {
    id: randomUUID(),
    menuItemId: menuItem.id,
    name: menuItem.name,
    size: options?.size,
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
  };
  cart.items.push(cartItem);
  return cartItem;
}

function findCartItem(cart: Cart, cartItemId: string): CartItem {
  const cartItem = cart.items.find((item) => item.id === cartItemId);
  if (!cartItem) {
    throw new Error(`Cart item "${cartItemId}" not found`);
  }
  return cartItem;
}

export function updateQuantity(cart: Cart, cartItemId: string, quantity: number): CartItem {
  if (quantity < 1) {
    throw new RangeError(
      "Quantity must be at least 1; use removeItem to remove an item from the cart"
    );
  }
  const cartItem = findCartItem(cart, cartItemId);
  cartItem.quantity = quantity;
  cartItem.lineTotal = cartItem.unitPrice * quantity;
  return cartItem;
}

export function removeItem(cart: Cart, cartItemId: string): void {
  cart.items = cart.items.filter((item) => item.id !== cartItemId);
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  canCheckout: boolean;
  message?: string;
}

export function getSummary(cart: Cart): CartSummary {
  const subtotal = cart.items.reduce((sum, item) => sum + item.lineTotal, 0);
  const canCheckout = cart.items.length > 0;
  return {
    items: cart.items,
    subtotal,
    canCheckout,
    message: canCheckout ? undefined : "Your cart is empty",
  };
}
