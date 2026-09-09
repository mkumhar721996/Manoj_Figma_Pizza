import { Router } from "express";
import {
  addItem,
  getSummary,
  MissingPizzaSizeError,
  removeItem,
  updateQuantity,
} from "../services/cartService";
import { getOrCreateCart } from "../store/cartStore";

export const cartRoutes = Router();

cartRoutes.post("/carts/:cartId/items", (req, res) => {
  const cart = getOrCreateCart(req.params.cartId);
  try {
    const cartItem = addItem(cart, req.body.menuItem, { size: req.body.size });
    res.status(201).json(cartItem);
  } catch (error) {
    if (error instanceof MissingPizzaSizeError) {
      res.status(400).json({ message: error.message });
      return;
    }
    throw error;
  }
});

cartRoutes.patch("/carts/:cartId/items/:itemId", (req, res) => {
  const cart = getOrCreateCart(req.params.cartId);
  try {
    const cartItem = updateQuantity(cart, req.params.itemId, req.body.quantity);
    res.status(200).json(cartItem);
  } catch (error) {
    if (error instanceof RangeError) {
      res.status(400).json({ message: error.message });
      return;
    }
    throw error;
  }
});

cartRoutes.delete("/carts/:cartId/items/:itemId", (req, res) => {
  const cart = getOrCreateCart(req.params.cartId);
  removeItem(cart, req.params.itemId);
  res.status(204).send();
});

cartRoutes.get("/carts/:cartId", (req, res) => {
  const cart = getOrCreateCart(req.params.cartId);
  res.status(200).json(getSummary(cart));
});
