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

async function sendOtpSms({ to, otp }) {
  const apiUrl = process.env.SMS_API_URL;
  if (!apiUrl) {
    throw new Error('SMS_API_URL is not configured');
  }
  return postJson(apiUrl, { to, body: `Your Slice House verification code is ${otp}. It expires in 5 minutes.` }, process.env.SMS_API_KEY);
}

module.exports = { sendOtpSms };
