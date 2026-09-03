const repository = require('../repositories/menuItemRepository');

function listMenuItems() {
  return repository.listActive();
}

module.exports = { listMenuItems };
