import { createServer as createHttpServer } from 'node:http';
import { getDefectDetail } from './lib/defectDetail.js';
import { renderDefectDetailPage, renderAccessDeniedPage, renderNotFoundPage } from './render/defectDetailPage.js';
import { db } from './data/db.js';

const DEFECT_ROUTE = /^\/projects\/([^/]+)\/defects\/([^/]+)$/;

export function createServer(repo = db) {
  return createHttpServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    const match = pathname.match(DEFECT_ROUTE);

    if (!match) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const [, projectId, defectId] = match;
    const userId = req.headers['x-user-id'];
    const currentUser = userId ? repo.findUserById(userId) : null;

    if (!currentUser) {
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
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => {
    console.log(`Defect detail server listening on port ${port}`);
  });
}
