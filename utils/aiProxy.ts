/**
 * Shared Claude proxy helper.
 *
 * All AI utilities (skin, makeup, product, translate, routine) call
 * this single function so:
 * - the Anthropic API key NEVER leaves the server
 * - rate limit and auth errors are translated consistently
 * - timeouts and 429 handling live in one place
 *
 * Endpoint identifier is sent via `x-rituel-endpoint` header so the
 * edge function can apply per-feature rate limits.
 */
import { supabase } from '../lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export type Endpoint =
  | 'skin_analysis'
  | 'skin_compare'
  | 'makeup'
  | 'product'
  | 'translate'
  | 'routine_optimize';

export type Lang = 'fr' | 'en' | 'tr';

export class AIProxyError extends Error {
  code: string;
  status?: number;
  constructor(code: string, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function localizedAIError(code: string, lang: Lang): string {
  const messages: Record<string, Record<Lang, string>> = {
    NO_SESSION: {
      fr: 'Connectez-vous pour continuer.',
      tr: 'Devam etmek için oturum açın.',
      en: 'Please sign in to continue.',
    },
    NO_CONFIG: {
      fr: 'Service IA non disponible.',
      tr: 'AI servisi kullanılamıyor.',
      en: 'AI service unavailable.',
    },
    TIMEOUT: {
      fr: 'La connexion a pris trop de temps. Réessayez.',
      tr: 'Bağlantı zaman aşımına uğradı. Tekrar deneyin.',
      en: 'Connection timed out. Try again.',
    },
    RATE_LIMIT: {
      fr: 'Limite atteinte. Réessayez plus tard.',
      tr: 'Limit aşıldı. Daha sonra tekrar deneyin.',
      en: 'Limit reached. Try again later.',
    },
    UNAUTHORIZED: {
      fr: 'Erreur d\'authentification. Reconnectez-vous.',
      tr: 'Kimlik doğrulama hatası. Tekrar oturum açın.',
      en: 'Auth error. Please sign in again.',
    },
    UPSTREAM: {
      fr: 'Service temporairement indisponible.',
      tr: 'Servis geçici olarak kullanılamıyor.',
      en: 'Service temporarily unavailable.',
    },
    INVALID_RESPONSE: {
      fr: 'Réponse invalide. Réessayez.',
      tr: 'Geçersiz yanıt. Tekrar deneyin.',
      en: 'Invalid response. Try again.',
    },
    UNKNOWN: {
      fr: 'Une erreur est survenue. Réessayez.',
      tr: 'Bir hata oluştu. Tekrar deneyin.',
      en: 'Something went wrong. Try again.',
    },
  };
  return (messages[code] || messages.UNKNOWN)[lang];
}

export async function callClaudeProxy(
  endpoint: Endpoint,
  body: any,
  timeoutMs: number = 30000
): Promise<any> {
  if (!SUPABASE_URL) {
    throw new AIProxyError('NO_CONFIG', 'Supabase URL missing');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new AIProxyError('NO_SESSION', 'No auth session');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/claude-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        'x-rituel-endpoint': endpoint,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 429) {
      throw new AIProxyError('RATE_LIMIT', 'Rate limit reached', 429);
    }
    if (res.status === 401 || res.status === 403) {
      throw new AIProxyError('UNAUTHORIZED', 'Auth error', res.status);
    }
    if (!res.ok) {
      throw new AIProxyError('UPSTREAM', `HTTP ${res.status}`, res.status);
    }

    return await res.json();
  } catch (e: any) {
    clearTimeout(timer);
    if (e instanceof AIProxyError) throw e;
    if (e?.name === 'AbortError') {
      throw new AIProxyError('TIMEOUT', 'Request timed out');
    }
    throw new AIProxyError('UNKNOWN', e?.message || 'unknown_error');
  }
}

export function safeJsonParse<T>(raw: string): T | null {
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    if (!cleaned) return null;
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
