const CREDIT_PRODUCTS = new Set([
  'com.mfkparis.rituel.credits.1.v2',
  'com.mfkparis.rituel.credits.5.v2',
  'com.mfkparis.rituel.credits.15.v2',
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STORE_ID = /^[0-9]{1,32}$/;
const encoder = new TextEncoder();

type Environment = 'sandbox' | 'production';

export type VerifiedGrant = {
  purchaser: string;
  purchase_environment: Environment;
  store_id: string;
  store_product: string;
};

async function matchesAuthorization(actual: string, expected: string): Promise<boolean> {
  const [actualHash, expectedHash] = await Promise.all(
    [actual, expected].map((value) => crypto.subtle.digest('SHA-256', encoder.encode(value))),
  );
  const left = new Uint8Array(actualHash);
  const right = new Uint8Array(expectedHash);
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export function createCreditWebhook(options: {
  secret: string;
  appId: string;
  environment: string;
  grant: (purchase: VerifiedGrant) => Promise<boolean>;
}) {
  const { secret, appId, environment, grant } = options;
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
    if (!secret || !appId || (environment !== 'sandbox' && environment !== 'production')) {
      return Response.json({ error: 'webhook_unavailable' }, { status: 503 });
    }

    const authorization = request.headers.get('authorization') ?? '';
    if (!await matchesAuthorization(authorization, `Bearer ${secret}`)) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }

    let payload: { api_version?: unknown; event?: Record<string, unknown> } | null;
    try {
      payload = await request.json();
    } catch {
      return Response.json({ error: 'invalid_json' }, { status: 400 });
    }
    const event = payload?.event;
    if (payload?.api_version !== '1.0' || !event || typeof event !== 'object' || Array.isArray(event)) {
      return Response.json({ error: 'invalid_event' }, { status: 400 });
    }

    const { app_id, app_user_id, product_id, transaction_id, store, type } = event;
    if (type !== 'NON_RENEWING_PURCHASE' || store !== 'APP_STORE' || app_id !== appId ||
        event.environment !== environment.toUpperCase() || typeof product_id !== 'string' ||
        !CREDIT_PRODUCTS.has(product_id)) {
      return Response.json({ ignored: true });
    }
    if (typeof app_user_id !== 'string' || !UUID.test(app_user_id) ||
        typeof transaction_id !== 'string' || !STORE_ID.test(transaction_id)) {
      return Response.json({ error: 'invalid_purchase' }, { status: 400 });
    }

    try {
      const credited = await grant({
        purchaser: app_user_id,
        purchase_environment: environment,
        store_id: transaction_id,
        store_product: product_id,
      });
      return Response.json({ credited });
    } catch {
      // RevenueCat retries non-200 responses. Never log the incoming event.
      return Response.json({ error: 'grant_unavailable' }, { status: 503 });
    }
  };
}
