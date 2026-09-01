const querystring = require('querystring');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function parseUrlEncodedBody(req) {
  const raw = await readBody(req);
  return querystring.parse(raw);
}

module.exports = { parseUrlEncodedBody };
