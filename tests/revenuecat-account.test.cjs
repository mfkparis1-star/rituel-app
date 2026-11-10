const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../utils/purchases.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
});

function setup() {
  const exports = {};
  const calls = [];
  let sdkId;
  let loginError;
  let pendingRead;
  const purchases = {
    configure({ appUserID }) { sdkId = appUserID ?? 'anonymous'; },
    getAppUserID: async () => sdkId,
    isAnonymous: async () => sdkId === 'anonymous',
    async logIn(id) {
      calls.push(['login', id]);
      if (loginError) throw new Error('offline');
      sdkId = id;
    },
    async logOut() { calls.push(['logout', sdkId]); sdkId = 'anonymous'; },
    getCustomerInfo: async () => pendingRead ?? { sdkId },
    restorePurchases: async () => ({ sdkId }),
    async purchasePackage() {
      calls.push(['purchase', sdkId]);
      return { customerInfo: { sdkId }, productIdentifier: 'synthetic' };
    },
  };
  vm.runInNewContext(outputText, {
    exports,
    process: { env: { EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_synthetic' } },
    console: { warn() {} },
    require(name) {
      if (name === 'react-native-purchases') return { __esModule: true, default: purchases };
      if (name === 'react-native') return { Platform: { OS: 'ios' } };
      if (name === '@react-native-async-storage/async-storage') return {};
      throw new Error(name);
    },
  });
  return {
    api: exports, calls,
    failLogin: () => { loginError = true; },
    recoverLogin: () => { loginError = false; },
    holdRead: (promise) => { pendingRead = promise; },
  };
}

test('logout removes the previous SDK identity and a new user can restore', async () => {
  const { api, calls } = setup();
  assert.equal(await api.configurePurchases('A'), true);
  assert.equal((await api.getCustomerInfo('A')).sdkId, 'A');
  assert.equal(await api.configurePurchases(null), true);
  assert.equal(await api.getCustomerInfo('A'), null);
  assert.equal(await api.restorePurchases(null), null);
  assert.equal(await api.configurePurchases('B'), true);
  assert.equal((await api.restorePurchases('B')).sdkId, 'B');
  assert.deepEqual(calls, [['logout', 'A'], ['login', 'B']]);
});

test('a failed account switch cannot start checkout or expose the previous entitlement', async () => {
  const { api, calls, failLogin } = setup();
  await api.configurePurchases('A');
  failLogin();
  assert.equal(await api.configurePurchases('B'), false);
  assert.equal(await api.getCustomerInfo('A'), null);
  assert.equal(await api.getCustomerInfo('B'), null);
  assert.equal((await api.purchaseStorePackage({}, 'B')).error, 'account_unavailable');
  assert.ok(calls.every(([action, account]) => action === 'login' && account === 'B'));
  assert.ok(calls.length >= 1);
});

test('a response in flight is discarded when the signed-in account changes', async () => {
  const { api, holdRead } = setup();
  await api.configurePurchases('A');
  let release;
  holdRead(new Promise((resolve) => { release = resolve; }));
  const reading = api.getCustomerInfo('A');
  await Promise.resolve();
  const switched = api.configurePurchases('B');
  release({ sdkId: 'A' });
  assert.equal(await reading, null);
  assert.equal(await switched, true);
});

test('an offline account transition can recover without signing out again', async () => {
  const { api, calls, failLogin, recoverLogin } = setup();
  await api.configurePurchases('A');
  failLogin();
  assert.equal(await api.configurePurchases('B'), false);
  assert.equal(api.isCurrentPurchaseAccount('A'), false);
  assert.equal(api.isCurrentPurchaseAccount('B'), false);
  recoverLogin();
  assert.equal((await api.getCustomerInfo('B')).sdkId, 'B');
  assert.equal(api.isCurrentPurchaseAccount('B'), true);
  assert.equal((await api.purchaseStorePackage({}, 'B')).ok, true);
  assert.deepEqual(calls, [['login', 'B'], ['login', 'B'], ['purchase', 'B']]);
});
