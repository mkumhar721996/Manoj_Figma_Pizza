import { createCart } from "../../src/domain/cart";
import { MenuItem } from "../../src/domain/menuItem";
import {
  addItem,
  updateQuantity,
  removeItem,
  getSummary,
  MissingPizzaSizeError,
} from "../../src/services/cartService";

describe("cartService.addItem", () => {
  it("adds a Side to an empty cart with quantity 1", () => {
    const cart = createCart("cart-1");
    const side: MenuItem = { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 };

    const cartItem = addItem(cart, side);

    expect(cart.items).toHaveLength(1);
    expect(cartItem.quantity).toBe(1);
    expect(cartItem.name).toBe("Garlic Bread");
    expect(cartItem.unitPrice).toBe(4.5);
  });

  it("adds a Drink to an empty cart with quantity 1", () => {
    const cart = createCart("cart-1");
    const drink: MenuItem = { id: "drink-1", name: "Cola", type: "DRINK", price: 2.25 };

    const cartItem = addItem(cart, drink);

    expect(cart.items).toHaveLength(1);
    expect(cartItem.quantity).toBe(1);
    expect(cartItem.name).toBe("Cola");
    expect(cartItem.unitPrice).toBe(2.25);
  });

  it("adds a Pizza with a selected size to the cart with quantity 1 and the size's price", () => {
    const cart = createCart("cart-1");
    const pizza: MenuItem = {
      id: "pizza-1",
      name: "Pepperoni",
      type: "PIZZA",
      sizePricing: { SMALL: 8, MEDIUM: 11, LARGE: 14 },
    };

    const cartItem = addItem(cart, pizza, { size: "MEDIUM" });

    expect(cart.items).toHaveLength(1);
    expect(cartItem.quantity).toBe(1);
    expect(cartItem.size).toBe("MEDIUM");
    expect(cartItem.unitPrice).toBe(11);
  });

  it("does not add a Pizza to the cart when no size is selected", () => {
    const cart = createCart("cart-1");
    const pizza: MenuItem = {
      id: "pizza-1",
      name: "Pepperoni",
      type: "PIZZA",
      sizePricing: { SMALL: 8, MEDIUM: 11, LARGE: 14 },
    };

    expect(() => addItem(cart, pizza)).toThrow(MissingPizzaSizeError);
    expect(cart.items).toHaveLength(0);
  });
});

describe("cartService.updateQuantity", () => {
  it("increasing the quantity of an existing cart item updates its quantity", () => {
    const cart = createCart("cart-1");
    const side: MenuItem = { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 };
    const cartItem = addItem(cart, side);

    const updated = updateQuantity(cart, cartItem.id, 3);

    expect(updated.quantity).toBe(3);
  });

  it("decreasing the quantity of an existing cart item updates its quantity", () => {
    const cart = createCart("cart-1");
    const side: MenuItem = { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 };
    const cartItem = addItem(cart, side);
    updateQuantity(cart, cartItem.id, 3);

    const updated = updateQuantity(cart, cartItem.id, 2);

    expect(updated.quantity).toBe(2);
  });

  it("the line item's total equals unitPrice * quantity after an increase", () => {
    const cart = createCart("cart-1");
    const side: MenuItem = { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 };
    const cartItem = addItem(cart, side);

    const updated = updateQuantity(cart, cartItem.id, 3);

    expect(updated.lineTotal).toBe(13.5);
  });

  it("the line item's total equals unitPrice * quantity after a decrease", () => {
    const cart = createCart("cart-1");
    const side: MenuItem = { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 };
    const cartItem = addItem(cart, side);
    updateQuantity(cart, cartItem.id, 3);

    const updated = updateQuantity(cart, cartItem.id, 1);

    expect(updated.lineTotal).toBe(4.5);
  });
});

describe("cartService.removeItem", () => {
  it("updateQuantity throws when given a quantity of 0", () => {
    const cart = createCart("cart-1");
    const side: MenuItem = { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 };
    const cartItem = addItem(cart, side);

    expect(() => updateQuantity(cart, cartItem.id, 0)).toThrow(RangeError);
  });

  it("rejecting a quantity of 0 leaves the item in the cart, requiring a separate removeItem call to remove it", () => {
    const cart = createCart("cart-1");
    const side: MenuItem = { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 };
    const cartItem = addItem(cart, side);

    expect(() => updateQuantity(cart, cartItem.id, 0)).toThrow(RangeError);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].id).toBe(cartItem.id);

    removeItem(cart, cartItem.id);

    expect(cart.items).toHaveLength(0);
  });

  it("removeItem removes the specified item from the cart", () => {
    const cart = createCart("cart-1");
    const side: MenuItem = { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 };
    const cartItem = addItem(cart, side);

    removeItem(cart, cartItem.id);

    expect(cart.items).toHaveLength(0);
  });

  it("removeItem leaves other cart items untouched", () => {
    const cart = createCart("cart-1");
    const side: MenuItem = { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 };
    const drink: MenuItem = { id: "drink-1", name: "Cola", type: "DRINK", price: 2.25 };
    const sideItem = addItem(cart, side);
    const drinkItem = addItem(cart, drink);

    removeItem(cart, sideItem.id);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].id).toBe(drinkItem.id);
  });
});

describe("cartService.getSummary", () => {
  it("returns a subtotal equal to the sum of all line-item totals", () => {
    const cart = createCart("cart-1");
    const side: MenuItem = { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 };
    const drink: MenuItem = { id: "drink-1", name: "Cola", type: "DRINK", price: 2.25 };
    const sideItem = addItem(cart, side);
    addItem(cart, drink);
    updateQuantity(cart, sideItem.id, 2);

    const summary = getSummary(cart);

    expect(summary.subtotal).toBe(11.25);
  });

  it("returns canCheckout: true when the cart has at least one item", () => {
    const cart = createCart("cart-1");
    const side: MenuItem = { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 };
    addItem(cart, side);

    const summary = getSummary(cart);

    expect(summary.canCheckout).toBe(true);
  });

  it("returns canCheckout: false when the cart has no items", () => {
    const cart = createCart("cart-1");

    const summary = getSummary(cart);

    expect(summary.canCheckout).toBe(false);
  });

  it("returns the message 'Your cart is empty' when the cart has no items", () => {
    const cart = createCart("cart-1");

    const summary = getSummary(cart);

    expect(summary.message).toBe("Your cart is empty");
  });

  it("returns no message when the cart has items", () => {
    const cart = createCart("cart-1");
    const side: MenuItem = { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 };
    addItem(cart, side);

    const summary = getSummary(cart);

    expect(summary.message).toBeUndefined();
  });
});
