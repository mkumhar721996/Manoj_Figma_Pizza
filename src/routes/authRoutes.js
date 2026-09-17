function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(json);
}

function resolveIsFacebookAccount(deps, requestId) {
  const request = deps.resetRepository.findById(requestId);
  const user = request ? deps.userRepository.findById(request.userId) : null;
  return Boolean(user && user.facebookId);
}

async function handleApiRequest(req, res, deps) {
  const { passwordResetService, authService } = deps;
  const url = req.url.split('?')[0];

  let body;
  try {
    body = req.method === 'POST' ? await readBody(req) : {};
  } catch (err) {
    return sendJson(res, 400, { error: 'invalid_json' });
  }

  if (req.method === 'POST' && url === '/api/auth/login') {
    const result = await authService.login(body);
    return sendJson(res, result.success ? 200 : 401, result);
  }

  if (req.method === 'POST' && url === '/api/auth/forgot-password') {
    const result = await passwordResetService.requestPasswordReset(body);
    return sendJson(res, 200, result);
  }

  if (req.method === 'POST' && url === '/api/auth/reset/verify-link') {
    const result = await passwordResetService.verifyResetLink(body);
    if (!result.valid) return sendJson(res, 400, result);
    return sendJson(res, 200, { ...result, isFacebookAccount: resolveIsFacebookAccount(deps, result.requestId) });
  }

  if (req.method === 'POST' && url === '/api/auth/reset/verify-otp') {
    const result = await passwordResetService.verifyOtpForIdentifier(body);
    if (!result.valid) return sendJson(res, 400, result);
    return sendJson(res, 200, { ...result, isFacebookAccount: resolveIsFacebookAccount(deps, result.requestId) });
  }

  if (req.method === 'POST' && url === '/api/auth/reset/set-password') {
    const result = await passwordResetService.setNewPassword(body);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  sendJson(res, 404, { error: 'not_found' });
}

module.exports = { handleApiRequest };
