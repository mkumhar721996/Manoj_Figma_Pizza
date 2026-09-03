let items = [];
let nextId = 1;

function reset() {
  items = [];
  nextId = 1;
}

function create({ name, description, price, category, active }) {
  const item = {
    id: String(nextId++),
    name,
    description,
    price,
    category,
    active: active === undefined ? true : active,
  };
  items.push(item);
  return item;
}

function listAll() {
  return items.slice();
}

function listActive() {
  return items.filter((item) => item.active);
}

function findById(id) {
  return items.find((item) => item.id === id);
}

function update(id, patch) {
  const item = findById(id);
  if (!item) return undefined;
  Object.assign(item, patch);
  return item;
}

function toggleActive(id) {
  const item = findById(id);
  if (!item) return undefined;
  item.active = !item.active;
  return item;
}

module.exports = { reset, create, listAll, listActive, findById, update, toggleActive };
