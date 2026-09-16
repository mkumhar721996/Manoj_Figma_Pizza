const { attachUser } = require('./authMiddleware');
const { linkAsDuplicate, UnauthorizedError, NotFoundError } = require('../domain/duplicateLinkService');

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
      if (!raw) {
        resolve({});
        return;
      }
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

function createDefectsRouter(repo) {
  return async function handleRequest(req, res, parsedUrl) {
    const segments = parsedUrl.pathname.split('/').filter(Boolean);

    if (segments[0] !== 'defects') {
      return false;
    }

    const defectId = segments[1];

    if (req.method === 'GET' && segments.length === 2) {
      const defect = repo.get(defectId);
      if (!defect) {
        sendJson(res, 404, { error: 'Defect not found' });
        return true;
      }
      sendJson(res, 200, serializeDefect(defect, repo));
      return true;
    }

    if (req.method === 'POST' && segments.length === 3 && segments[2] === 'duplicate-link') {
      attachUser(req);
      let body;
      try {
        body = await readJsonBody(req);
      } catch {
        sendJson(res, 400, { error: 'Invalid JSON body' });
        return true;
      }

      try {
        linkAsDuplicate(
          {
            actingUser: req.user,
            duplicateDefectId: defectId,
            canonicalDefectId: body.canonicalDefectId,
          },
          repo,
        );
        const updated = repo.get(defectId);
        sendJson(res, 201, serializeDefect(updated, repo));
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          sendJson(res, 403, { error: err.message });
        } else if (err instanceof NotFoundError) {
          sendJson(res, 404, { error: err.message });
        } else {
          throw err;
        }
      }
      return true;
    }

    return false;
  };
}

module.exports = { createDefectsRouter };
