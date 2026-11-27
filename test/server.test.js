import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { server, resolvePath } from '../server.js';

const port = await new Promise((resolve) => {
  server.listen(0, () => resolve(server.address().port));
});
after(() => server.close());

const get = (path) => fetch(`http://127.0.0.1:${port}${path}`);

test('the main screen loads without any API keys', async () => {
  const res = await get('/');
  assert.equal(res.status, 200);
  assert.match(await res.text(), /DocAgent Voice/);
});

test('health check says no keys are needed', async () => {
  const res = await get('/api/health');
  assert.deepEqual(await res.json(), { ok: true, keysNeeded: false });
});

test('the rules file is served', async () => {
  const res = await get('/data/services.json');
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.services.length >= 4);
});

test('files outside public/ cannot be read', async () => {
  assert.ok(resolvePath('/../server.js').includes(`${path.sep}public${path.sep}`));
  const res = await get('/%2e%2e/package.json');
  assert.notEqual(res.status, 200);
});
