import request from "supertest";
import { createApp } from "../../src/api/app";

describe("cart routes", () => {
  it("POST /carts/:cartId/items adds a menu item and returns it with quantity 1", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/carts/cart-1/items")
      .send({ menuItem: { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 } });

    expect(response.status).toBe(201);
    expect(response.body.quantity).toBe(1);
    expect(response.body.name).toBe("Garlic Bread");
  });

  it("PATCH /carts/:cartId/items/:itemId updates quantity and recalculates the line total", async () => {
    const app = createApp();
    const addResponse = await request(app)
      .post("/carts/cart-2/items")
      .send({ menuItem: { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 } });
    const itemId = addResponse.body.id;

    const response = await request(app)
      .patch(`/carts/cart-2/items/${itemId}`)
      .send({ quantity: 3 });

    expect(response.status).toBe(200);
    expect(response.body.quantity).toBe(3);
    expect(response.body.lineTotal).toBe(13.5);
  });

  it("PATCH .../items/:itemId with quantity 0 responds 400", async () => {
    const app = createApp();
    const addResponse = await request(app)
      .post("/carts/cart-3/items")
      .send({ menuItem: { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 } });
    const itemId = addResponse.body.id;

    const response = await request(app)
      .patch(`/carts/cart-3/items/${itemId}`)
      .send({ quantity: 0 });

    expect(response.status).toBe(400);
  });

  it("POST /carts/:cartId/items with a Pizza and no size responds 400 and does not add the item", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/carts/cart-pizza-1/items")
      .send({
        menuItem: {
          id: "pizza-1",
          name: "Pepperoni",
          type: "PIZZA",
          sizePricing: { SMALL: 8, MEDIUM: 11, LARGE: 14 },
        },
      });
    const getResponse = await request(app).get("/carts/cart-pizza-1");

    expect(response.status).toBe(400);
    expect(getResponse.body.items).toHaveLength(0);
  });

  it("PATCH .../items/:itemId with quantity 0 leaves the item in the cart until a follow-up DELETE removes it", async () => {
    const app = createApp();
    const addResponse = await request(app)
      .post("/carts/cart-confirm-1/items")
      .send({ menuItem: { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 } });
    const itemId = addResponse.body.id;

    const patchResponse = await request(app)
      .patch(`/carts/cart-confirm-1/items/${itemId}`)
      .send({ quantity: 0 });
    const getAfterPatch = await request(app).get("/carts/cart-confirm-1");

    expect(patchResponse.status).toBe(400);
    expect(getAfterPatch.body.items).toHaveLength(1);
    expect(getAfterPatch.body.items[0].id).toBe(itemId);

    const deleteResponse = await request(app).delete(`/carts/cart-confirm-1/items/${itemId}`);
    const getAfterDelete = await request(app).get("/carts/cart-confirm-1");

    expect(deleteResponse.status).toBe(204);
    expect(getAfterDelete.body.items).toHaveLength(0);
  });

  it("DELETE /carts/:cartId/items/:itemId removes the item", async () => {
    const app = createApp();
    const addResponse = await request(app)
      .post("/carts/cart-4/items")
      .send({ menuItem: { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 } });
    const itemId = addResponse.body.id;

    const deleteResponse = await request(app).delete(`/carts/cart-4/items/${itemId}`);
    const getResponse = await request(app).get("/carts/cart-4");

    expect(deleteResponse.status).toBe(204);
    expect(getResponse.body.items).toHaveLength(0);
  });

  it("GET /carts/:cartId returns subtotal and canCheckout: true when items exist", async () => {
    const app = createApp();
    await request(app)
      .post("/carts/cart-5/items")
      .send({ menuItem: { id: "side-1", name: "Garlic Bread", type: "SIDE", price: 4.5 } });

    const response = await request(app).get("/carts/cart-5");

    expect(response.status).toBe(200);
    expect(response.body.subtotal).toBe(4.5);
    expect(response.body.canCheckout).toBe(true);
  });

  it("GET /carts/:cartId returns the empty-cart message and canCheckout: false when empty", async () => {
    const app = createApp();

    const response = await request(app).get("/carts/cart-6");

    expect(response.status).toBe(200);
    expect(response.body.canCheckout).toBe(false);
    expect(response.body.message).toBe("Your cart is empty");
  });
});
