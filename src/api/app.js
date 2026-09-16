const { createDefectsRouter } = require('./defectsRouter');

function createApp(repo) {
  const defectsRouter = createDefectsRouter(repo);

  return async function app(req, res) {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const handled = await defectsRouter(req, res, parsedUrl);
    if (!handled) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  };
}

module.exports = { createApp };
