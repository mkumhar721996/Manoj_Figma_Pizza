const { attachUser } = require('./authMiddleware');
const {
  linkAsDuplicate,
  UnauthorizedError,
  NotFoundError,
  InvalidLinkError,
} = require('../domain/duplicateLinkService');

function serializeDefect(defect, repo) {
  return {
    id: defect.id,
    title: defect.title,
    status: defect.status,
    duplicateOfId: defect.duplicateOfId,
    duplicateDefectIds: repo.findDuplicatesOf(defect.id).map((d) => d.id),
  };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(payload);
}

async function handleDefectsRequest(req, res, repo) {
  const url = new URL(req.url, 'http://localhost');
  const getMatch = url.pathname.match(/^\/defects\/([^/]+)$/);
  const duplicateLinkMatch = url.pathname.match(/^\/defects\/([^/]+)\/duplicate-link$/);

  if (req.method === 'GET' && getMatch) {
    const defect = repo.get(decodeURIComponent(getMatch[1]));
    if (!defect) {
      sendJson(res, 404, { error: 'Defect not found' });
      return;
    }
    sendJson(res, 200, serializeDefect(defect, repo));
    return;
  }

  if (req.method === 'POST' && duplicateLinkMatch) {
    attachUser(req);
    const duplicateDefectId = decodeURIComponent(duplicateLinkMatch[1]);

    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    try {
      const updated = linkAsDuplicate(
        {
          actingUser: req.user,
          duplicateDefectId,
          canonicalDefectId: body.canonicalDefectId,
        },
        repo
      );
      sendJson(res, 201, serializeDefect(updated, repo));
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        sendJson(res, 403, { error: err.message });
        return;
      }
      if (err instanceof NotFoundError) {
        sendJson(res, 404, { error: err.message });
        return;
      }
      if (err instanceof InvalidLinkError) {
        sendJson(res, 400, { error: err.message });
        return;
      }
      throw err;
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}

module.exports = { handleDefectsRequest };
