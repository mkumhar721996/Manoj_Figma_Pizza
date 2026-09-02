async function fetchOrderStatus(orderNumber) {
  const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/status`);
  if (!res.ok) {
    throw new Error('Order not found');
  }
  return res.json();
}

function renderStatus(el, { orderNumber, status }) {
  el.textContent = `Order ${orderNumber}: ${status}`;
}

function renderError(el, message) {
  el.textContent = message;
}

async function lookupAndRender(orderNumber, el) {
  try {
    const data = await fetchOrderStatus(orderNumber);
    renderStatus(el, data);
  } catch (err) {
    renderError(el, 'Order not found. Please check your order number.');
  }
}

function wireUpPage(doc, win) {
  const resultEl = doc.getElementById('status-result');
  if (!resultEl) return;

  const params = new URLSearchParams(win.location.search);
  const orderNumberFromQuery = params.get('orderNumber');
  if (orderNumberFromQuery) {
    lookupAndRender(orderNumberFromQuery, resultEl);
  }

  const form = doc.getElementById('order-status-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const orderNumber = doc.getElementById('order-number-input').value.trim();
      if (orderNumber) {
        lookupAndRender(orderNumber, resultEl);
      }
    });
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => wireUpPage(document, window));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchOrderStatus, renderStatus, renderError, lookupAndRender, wireUpPage };
}
