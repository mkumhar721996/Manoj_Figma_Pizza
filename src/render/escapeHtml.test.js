import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './escapeHtml.js';

test('escapes HTML-significant characters to prevent injection', () => {
  assert.equal(
    escapeHtml('<script>alert("x")</script> & \'quote\''),
    '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;quote&#39;',
  );
});

test('passes through plain text unchanged', () => {
  assert.equal(escapeHtml('Login button is unresponsive'), 'Login button is unresponsive');
});
