import { Cart, createCart } from "../domain/cart";

const carts = new Map<string, Cart>();

export function getOrCreateCart(cartId: string): Cart {
  let cart = carts.get(cartId);
  if (!cart) {
    cart = createCart(cartId);
    carts.set(cartId, cart);
  }
  return cart;
}
