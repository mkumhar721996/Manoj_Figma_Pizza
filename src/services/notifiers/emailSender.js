const https = require('https');
const { URL } = require('url');

function postJson(apiUrl, payload, apiKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(apiUrl);
    const body = JSON.stringify(payload);
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve({ statusCode: res.statusCode }));
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sendResetEmail({ to, resetLink }) {
  const apiUrl = process.env.EMAIL_API_URL;
  if (!apiUrl) {
    throw new Error('EMAIL_API_URL is not configured');
  }
  return postJson(
    apiUrl,
    { to, subject: 'Reset your Slice House password', text: `Use this link to reset your password: ${resetLink}` },
    process.env.EMAIL_API_KEY,
  );
}

module.exports = { sendResetEmail };
