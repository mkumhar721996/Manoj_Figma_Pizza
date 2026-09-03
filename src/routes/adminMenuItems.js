const repository = require('../repositories/menuItemRepository');

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function listAdminMenuItems() {
  return repository.listAll();
}

function createMenuItem(body) {
  const { name, description, price, category, active } = body;
  if (!name || price === undefined) {
    throw httpError(400, 'name and price are required');
  }
  return repository.create({ name, description, price, category, active });
}

const EDITABLE_FIELDS = ['name', 'description', 'price', 'category'];

function updateMenuItem(id, body) {
  const patch = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) {
      patch[field] = body[field];
    }
  }
  const updated = repository.update(id, patch);
  if (!updated) {
    throw httpError(404, `Menu item ${id} not found`);
  }
  return updated;
}

function toggleMenuItem(id) {
  const toggled = repository.toggleActive(id);
  if (!toggled) {
    throw httpError(404, `Menu item ${id} not found`);
  }
  return toggled;
}

module.exports = { listAdminMenuItems, createMenuItem, updateMenuItem, toggleMenuItem };
