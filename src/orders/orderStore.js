function createOrderStore() {
  const orders = new Map();

  return {
    createOrder(orderNumber, status) {
      const order = { orderNumber, status, createdAt: new Date() };
      orders.set(orderNumber, order);
      return order;
    },
    getOrder(orderNumber) {
      return orders.get(orderNumber);
    },
    updateOrderStatus(orderNumber, status) {
      const order = orders.get(orderNumber);
      if (!order) return undefined;
      order.status = status;
      return order;
    },
  };
}

module.exports = { createOrderStore };
