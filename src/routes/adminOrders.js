const { authenticate, requireAdmin } = require('../middleware/auth');
const { advanceOrderStatus, FinalStatusError, getAllOrders, OrderNotFoundError } = require('../data/orderStore');
const { getNextStatus } = require('../domain/orderLifecycle');

function serializeOrder(order) {
  return { ...order, canAdvance: getNextStatus(order.status) !== null };
}

function sendDenied(res, denied) {
  res.writeHead(denied.status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(denied.body));
}

function handleListOrders(req, res) {
  const user = authenticate(req);
  const denied = requireAdmin(user);
  if (denied) {
    sendDenied(res, denied);
    return;
  }
  const orders = getAllOrders().map(serializeOrder);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(orders));
}

function handleAdvanceOrder(req, res, orderId) {
  const user = authenticate(req);
  const denied = requireAdmin(user);
  if (denied) {
    sendDenied(res, denied);
    return;
  }
  try {
    const updated = advanceOrderStatus(orderId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(serializeOrder(updated)));
  } catch (err) {
    if (err instanceof OrderNotFoundError) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    if (err instanceof FinalStatusError) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
    throw err;
  }
}

module.exports = { handleListOrders, handleAdvanceOrder };
