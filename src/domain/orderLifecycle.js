const ORDER_STATUSES = ['PLACED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function getNextStatus(status) {
  const index = ORDER_STATUSES.indexOf(status);
  const next = ORDER_STATUSES[index + 1];
  return next ?? null;
}

module.exports = { ORDER_STATUSES, getNextStatus };
