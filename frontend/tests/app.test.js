import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexHtmlPath = path.join(__dirname, '..', 'public', 'index.html');

test('root index.html shows the menu directly, with no login or splash gate', () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');

  assert.match(html, /<div id="root">/);
  assert.match(html, /<script[^>]*type="module"[^>]*src="\/app\.js"/);
  assert.doesNotMatch(html, /log ?in/i);
  assert.doesNotMatch(html, /sign ?in/i);
  assert.doesNotMatch(html, /splash/i);
  assert.match(html, /<meta[^>]*name="viewport"/);
});
