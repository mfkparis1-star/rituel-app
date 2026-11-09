import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createCreditWebhook } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const client = url && serviceKey
  ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

Deno.serve(createCreditWebhook({
  secret: Deno.env.get('RITUEL_REVENUECAT_WEBHOOK_SECRET') ?? '',
  appId: Deno.env.get('RITUEL_REVENUECAT_APP_ID') ?? '',
  environment: Deno.env.get('RITUEL_REVENUECAT_ENVIRONMENT') ?? '',
  async grant(purchase) {
    if (!client) throw new Error('Database client unavailable');
    const { data, error } = await client.rpc('grant_verified_rituel_credits', purchase);
    if (error || typeof data !== 'boolean') throw new Error('Credit grant failed');
    return data;
  },
}));
