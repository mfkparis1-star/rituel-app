const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const source = readFileSync(path.join(__dirname, '../hooks/useOnboarded.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
});

function setup(storage, profiles, failedReads = false, react = {}, clock = {}) {
  const exports = {};
  const writes = [];
  const mock = {
    react,
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => storage.get(key) ?? null,
      setItem: async (key, value) => storage.set(key, value),
    },
    '../lib/supabase': {
      supabase: {
        from: () => ({
          select: () => ({
            eq: (_column, id) => ({
              maybeSingle: async () => ({
                data: profiles.get(id) ?? null,
                error: (typeof failedReads === 'function' ? failedReads() : failedReads) ? new Error('offline') : null,
              }),
            }),
          }),
          upsert: async (profile) => { writes.push({ ...profile }); },
        }),
      },
    },
  };
  runInNewContext(outputText, {
    exports,
    ...clock,
    require(name) {
      assert.ok(mock[name], name);
      return mock[name];
    },
  });
  return { ...exports, writes };
}

test('new and existing accounts resolve onboarding independently', async () => {
  const api = setup(new Map(), new Map([['returning', { onboarded: true }]]));
  assert.equal(await api.readOnboarding('new'), false);
  assert.equal(await api.readOnboarding('returning'), true);
});

test('completion persists across restarts for the same account only', async () => {
  const storage = new Map();
  const api = setup(storage, new Map());
  await api.finishOnboarding('first');
  await api.finishOnboarding('first');
  assert.deepEqual(api.writes, [{ id: 'first', onboarded: true }]);

  const restarted = setup(storage, new Map(), true);
  assert.equal(await restarted.readOnboarding('first'), true);
  assert.equal(await restarted.readOnboarding('second'), null);
});

test('a temporary onboarding read failure recovers for the same signed-in account', async () => {
  let fail = true;
  const completions = [];
  const timers = new Set();
  let stop;
  const api = setup(new Map(), new Map(), () => fail, {
    useState: () => [null, (result) => completions.push(result.completed)],
    useEffect: (effect) => { stop = effect(); },
  }, {
    setTimeout: (run) => { timers.add(run); return run; },
    clearTimeout: (run) => timers.delete(run),
  });

  api.useOnboarded('new');
  await new Promise(setImmediate);
  assert.deepEqual(completions, [null]);
  assert.equal(timers.size, 1);

  fail = false;
  const [retry] = timers;
  timers.delete(retry);
  retry();
  await new Promise(setImmediate);
  assert.deepEqual(completions, [null, false]);
  assert.equal(timers.size, 0);
  stop();
});
