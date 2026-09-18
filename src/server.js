import { createServer as createHttpServer } from 'node:http';
import { getDefectDetail } from './lib/defectDetail.js';
import { renderDefectDetailPage, renderAccessDeniedPage, renderNotFoundPage } from './render/defectDetailPage.js';
import { db } from './data/db.js';
import { verifySessionToken } from './lib/auth/session.js';
import { SESSION_SECRET } from './config.js';
import { logEvent } from './lib/log.js';

const DEFECT_ROUTE = /^\/projects\/([^/]+)\/defects\/([^/]+)$/;
const BEARER_PREFIX = 'Bearer ';

function authenticate(req, repo) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(BEARER_PREFIX)) {
    logEvent('warn', 'auth.failed', { reason: header ? 'malformed_authorization_header' : 'missing_authorization_header' });
    return null;
  }

  const token = header.slice(BEARER_PREFIX.length);
  const userId = verifySessionToken(token, SESSION_SECRET);
  if (!userId) {
    logEvent('warn', 'auth.failed', { reason: 'invalid_or_expired_token' });
    return null;
  }

  return repo.findUserById(userId);
}

export function createServer(repo = db) {
  return createHttpServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');

    try {
      const match = pathname.match(DEFECT_ROUTE);

      if (!match) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const [, projectId, defectId] = match;
      const currentUser = authenticate(req, repo);

      if (!currentUser) {
        logEvent('warn', 'request.unauthenticated', { projectId, defectId });
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Authentication required');
        return;
      }

      const result = getDefectDetail(repo, currentUser, projectId, defectId);

      if (result.status === 404) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(renderNotFoundPage());
        return;
      }

      if (result.status === 403) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end(renderAccessDeniedPage());
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(renderDefectDetailPage(result.dto));
    } catch (error) {
      logEvent('error', 'request.unhandled_exception', { pathname, message: error.message, stack: error.stack });
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal server error');
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => {
    console.log(`Defect detail server listening on port ${port}`);
  });
}
