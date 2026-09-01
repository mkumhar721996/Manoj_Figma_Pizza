function handleGetOrderStatus(orderStore, orderNumber, res) {
  const order = orderStore.getOrder(orderNumber);

  if (!order) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Order not found' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ orderNumber: order.orderNumber, status: order.status }));
}

module.exports = { handleGetOrderStatus };
