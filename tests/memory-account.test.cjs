const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const source = readFileSync(path.join(root, 'hooks/useMemory.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});

function setup() {
  const exports = {};
  const slots = [];
  const reads = new Map();
  const writes = [];
  let auth;
  let nextSlot;
  let effects;

  function memoize(value, dependencies) {
    const index = nextSlot++;
    const previous = slots[index];
    if (previous && dependencies.every((dep, i) => Object.is(dep, previous.dependencies[i]))) {
      return [previous.value, false];
    }
    slots[index] = { value, dependencies };
    return [value, true];
  }

  const react = {
    useRef(initial) {
      return slots[nextSlot++] ??= { current: initial };
    },
    useState(initial) {
      const index = nextSlot++;
      const state = slots[index] ??= { value: initial };
      return [state.value, (next) => { state.value = typeof next === 'function' ? next(state.value) : next; }];
    },
    useCallback(callback, dependencies) {
      return memoize(callback, dependencies)[0];
    },
    useEffect(effect, dependencies) {
      const [, changed] = memoize(effect, dependencies);
      if (changed) effects.push(effect);
    },
  };
  const mocks = {
    react,
    '../lib/supabase': { supabase: { auth: { onAuthStateChange: (callback) => {
      auth = callback;
      return { data: { subscription: { unsubscribe() {} } } };
    } } } },
    '../utils/memory': {
      getMemory: (id) => new Promise((resolve, reject) => reads.set(id, { resolve, reject })),
      patchMemory: async (id, value) => { writes.push({ id, value }); return true; },
    },
  };

  runInNewContext(outputText, { exports, require: (name) => mocks[name] });
  return {
    reads,
    writes,
    switchAccount: (id) => auth('SIGNED_IN', { user: { id } }),
    render() {
      nextSlot = 0;
      effects = [];
      const state = exports.useMemory();
      for (const effect of effects) effect();
      return state;
    },
  };
}

test('old account reads and save callbacks cannot populate a different account', async () => {
  const api = setup();
  api.render();
  api.switchAccount('first');
  const first = api.render();
  assert.equal(first.account, 'first');
  assert.equal(first.loading, true);

  api.switchAccount('second');
  api.render();
  api.reads.get('second').resolve({ skin_profile: { skin_type: 'dry' } });
  await new Promise(setImmediate);
  assert.equal(api.render().memory.skin_profile.skin_type, 'dry');

  api.reads.get('first').resolve({ skin_profile: { skin_type: 'oily' } });
  await new Promise(setImmediate);
  assert.equal(api.render().memory.skin_profile.skin_type, 'dry');
  assert.equal(await first.patch({ skin_profile: { skin_type: 'oily' } }), false);
  assert.deepEqual(api.writes, []);
});

test('a failed read stops loading without exposing another account', async () => {
  const api = setup();
  api.render();
  api.switchAccount('first');
  api.render();
  api.reads.get('first').reject(new Error('offline'));
  await new Promise(setImmediate);
  const state = api.render();
  assert.equal(state.loading, false);
  assert.equal(state.memory.skin_profile, undefined);
});

test('a refresh started before a successful patch cannot overwrite it', async () => {
  const api = setup();
  api.render();
  api.switchAccount('first');
  api.render();
  api.reads.get('first').resolve({ skin_profile: { skin_type: 'dry' } });
  await new Promise(setImmediate);

  const state = api.render();
  const refresh = state.refresh();
  assert.equal(await state.patch({ skin_profile: { skin_type: 'oily' } }), true);
  api.reads.get('first').resolve({ skin_profile: { skin_type: 'dry' } });
  await refresh;
  assert.equal(api.render().memory.skin_profile.skin_type, 'oily');
  assert.equal(api.render().loading, false);
});
