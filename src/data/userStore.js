let usersByToken = new Map();

function reset(seed = []) {
  usersByToken = new Map(seed.map((user) => [user.token, user]));
}

function findUserByToken(token) {
  return usersByToken.get(token);
}

module.exports = { reset, findUserByToken };
