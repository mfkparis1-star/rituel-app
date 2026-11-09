const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const source = readFileSync(resolve(__dirname, '../utils/aiCache.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
});

function createCache() {
  const entries = new Map();
  const exports = {};
  const storage = {
    getItem: async (key) => entries.get(key),
    setItem: async (key, value) => entries.set(key, value),
    removeItem: async (key) => entries.delete(key),
  };
  runInNewContext(outputText, {
    exports,
    require(name) {
      assert.equal(name, '@react-native-async-storage/async-storage');
      return storage;
    },
  });
  return { cache: exports, entries };
}

test('cached results are visible only to the account that generated them', async () => {
  const { cache } = createCache();
  await cache.saveAICache('account-a', 'skin', 'synthetic-a');
  assert.equal(await cache.loadAICache(null, 'skin'), null);
  assert.equal(await cache.loadAICache('account-b', 'skin'), null);

  await cache.saveAICache('account-b', 'skin', 'synthetic-b');
  await cache.clearAICache('account-b', 'skin');
  assert.equal(await cache.loadAICache('account-a', 'skin'), 'synthetic-a');
  assert.equal(await cache.loadAICache('account-b', 'skin'), null);
});

test('guest writes, unowned legacy entries, and expired results stay hidden', async () => {
  const { cache, entries } = createCache();
  entries.set('@rituel:ai_cache:skin', JSON.stringify({ data: 'legacy', savedAt: Date.now() }));
  entries.set('@rituel:ai_cache:v2:account-a:skin', JSON.stringify([
    { data: 'expired', savedAt: Date.now() - 25 * 60 * 60 * 1000 },
  ]));
  await cache.saveAICache(null, 'skin', 'guest');
  assert.equal(await cache.loadAICache(null, 'skin'), null);
  assert.equal((await cache.getRecentAcrossTypes('account-a')).length, 0);
  assert.equal(entries.size, 2);
});
