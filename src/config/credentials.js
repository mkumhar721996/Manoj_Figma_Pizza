const { loadEnv } = require('./loadEnv');

loadEnv();

function getCredentials() {
  return [process.env.ADMIN_USERNAME, process.env.ADMIN_PASSWORD];
}

module.exports = { getCredentials };
