const { loadEnv } = require('./loadEnv');

loadEnv();

function getCredentials() {
  return {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  };
}

module.exports = { getCredentials };
