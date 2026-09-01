const { getNextStatus } = require('../domain/orderLifecycle');

let orders = [];

class FinalStatusError extends Error {
  constructor(orderId) {
    super(`Order ${orderId} is already at its final status`);
    this.name = 'FinalStatusError';
  }
}

class OrderNotFoundError extends Error {
  constructor(orderId) {
    super(`Order ${orderId} not found`);
    this.name = 'OrderNotFoundError';
  }
}

function reset(seed = []) {
  orders = seed.map((order) => ({ ...order }));
}

function getAllOrders() {
  return orders.map((order) => ({ ...order }));
}

function advanceOrderStatus(id) {
  const order = orders.find((candidate) => candidate.id === id);
  if (!order) {
    throw new OrderNotFoundError(id);
  }
  const nextStatus = getNextStatus(order.status);
  if (nextStatus === null) {
    throw new FinalStatusError(id);
  }
  order.status = nextStatus;
  return { ...order };
}

module.exports = {
  reset,
  getAllOrders,
  advanceOrderStatus,
  FinalStatusError,
  OrderNotFoundError,
};
