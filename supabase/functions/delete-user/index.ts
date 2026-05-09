// Edge Function: delete-user
//
// Deletes the authenticated user's data from the public schema (via
// SECURITY DEFINER RPC), then removes their auth.users row via the
// admin API. Idempotent: re-running on an already-deleted user
// returns success.
//
// Auth: caller must include `Authorization: Bearer <user_jwt>` header.
// We do NOT trust any user_id from the request body; the user_id is
// extracted from the verified JWT inside this function.
//
// Server-side only. Uses the service role key, which is never sent
// to the client. Supabase injects SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY automatically into Edge Function env.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  // Fail fast if env is misconfigured. Without these, no admin call can
  // succeed; better to surface this loudly than to attempt and fail mid-way.
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('delete-user: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env');
    return json({ error: 'server_misconfigured' }, 500);
  }

  try {
    // 1. Extract JWT from Authorization header
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return json({ error: 'unauthorized' }, 401);
    }

    // 2. Create admin client (service role)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3. Verify JWT and extract user_id (NEVER trust client-provided id)
    const jwt = authHeader.replace('Bearer ', '').trim();
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user?.id) {
      return json({ error: 'invalid_token' }, 401);
    }

    const userId = userData.user.id;

    // 4. Cascade-delete public schema data via SECURITY DEFINER RPC
    const { error: rpcErr } = await admin.rpc('delete_user_data', {
      target_user_id: userId,
    });
    if (rpcErr) {
      console.error('delete_user_data rpc failed:', rpcErr);
      return json({ error: 'data_cleanup_failed', detail: rpcErr.message }, 500);
    }

    // 5. Delete the auth.users row
    const { error: authErr } = await admin.auth.admin.deleteUser(userId);
    if (authErr) {
      // Public data is already gone. Auth deletion failure is recoverable
      // (user can re-trigger). Report it but don't undo the data delete.
      console.error('auth admin deleteUser failed:', authErr);
      return json(
        {
          error: 'auth_deletion_failed',
          detail: authErr.message,
          public_data_cleared: true,
        },
        500,
      );
    }

    return json({ ok: true }, 200);
  } catch (e) {
    console.error('delete-user unexpected error:', e);
    return json({ error: 'internal_error', detail: String(e) }, 500);
  }
});
