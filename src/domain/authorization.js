const ROLES_ALLOWED_TO_LINK_DUPLICATE = ['TRIAGER', 'ADMIN'];

function canLinkDuplicate(user) {
  return ROLES_ALLOWED_TO_LINK_DUPLICATE.includes(user?.role);
}

module.exports = { ROLES_ALLOWED_TO_LINK_DUPLICATE, canLinkDuplicate };
