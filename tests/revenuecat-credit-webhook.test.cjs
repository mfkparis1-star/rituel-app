const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../supabase/functions/revenuecat-credit-grants/handler.ts'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const exportsObject = {};
vm.runInNewContext(outputText, {
  exports: exportsObject, crypto: webcrypto, TextEncoder, Uint8Array, Response,
});
const { createCreditWebhook } = exportsObject;

const purchaser = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const product = 'com.mfkparis.rituel.credits.5.v2';
const event = {
  app_id: 'synthetic-app',
  app_user_id: purchaser,
  product_id: product,
  transaction_id: '10000000000000001',
  environment: 'SANDBOX',
  store: 'APP_STORE',
  type: 'NON_RENEWING_PURCHASE',
};

function request(overrides = {}, authorization = 'Bearer synthetic-secret') {
  return new Request('https://example.test/webhook', {
    method: 'POST',
    headers: { authorization },
    body: JSON.stringify({ api_version: '1.0', event: { ...event, ...overrides } }),
  });
}

function setup(grant, options = {}) {
  return createCreditWebhook({
    secret: 'synthetic-secret',
    appId: 'synthetic-app',
    environment: 'sandbox',
    grant,
    ...options,
  });
}

test('unauthorized or unconfigured webhooks cannot invoke a grant', async () => {
  const grant = () => assert.fail('grant must not be called');
  assert.equal((await setup(grant)(request({}, 'Bearer wrong'))).status, 401);
  assert.equal((await setup(grant, { environment: '' })(request())).status, 503);
});

test('only the configured App Store environment and v2 products may issue credits', async () => {
  const handle = setup(() => assert.fail('grant must not be called'));
  for (const changes of [
    { app_id: 'different-app' }, { store: 'PLAY_STORE' }, { environment: 'PRODUCTION' },
    { product_id: 'com.mfkparis.rituel.credits.5' }, { type: 'TEST' },
  ]) {
    const response = await handle(request(changes));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ignored: true });
  }
  assert.equal((await handle(request({ app_user_id: '$RCAnonymousID:test' }))).status, 400);
});

test('only verified transaction fields reach the grant and a retry can finish it', async () => {
  const calls = [];
  const handle = setup(async (purchase) => {
    calls.push({ ...purchase });
    if (calls.length === 1) throw new Error('synthetic database failure');
    return calls.length === 2;
  });
  assert.equal((await handle(request())).status, 503);
  assert.deepEqual(await (await handle(request())).json(), { credited: true });
  assert.deepEqual(await (await handle(request())).json(), { credited: false });
  assert.deepEqual(calls[0], {
    purchaser,
    purchase_environment: 'sandbox',
    store_id: event.transaction_id,
    store_product: product,
  });
});
