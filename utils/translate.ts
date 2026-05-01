/**
 * Translate user-generated text via Claude Haiku.
 *
 * Safe fallback: on any failure, return the ORIGINAL text so UI never
 * breaks. Cache via Supabase `translations` table when reachable.
 */
import { supabase } from '../lib/supabase';
import {
  AIProxyError,
  callClaudeProxy,
  Lang,
} from './aiProxy';

function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(16);
}

function makeCacheKey(text: string, source: Lang, target: Lang): string {
  return djb2(`${source}|${target}|${text}`);
}

async function readCache(key: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('translations')
      .select('translated_text')
      .eq('cache_key', key)
      .maybeSingle();
    return data?.translated_text ?? null;
  } catch {
    return null;
  }
}

async function writeCache(
  key: string,
  source: string,
  sourceLang: Lang,
  targetLang: Lang,
  translated: string
): Promise<void> {
  try {
    await supabase
      .from('translations')
      .upsert(
        {
          cache_key: key,
          source_text: source,
          source_lang: sourceLang,
          target_lang: targetLang,
          translated_text: translated,
        },
        { onConflict: 'cache_key', ignoreDuplicates: true }
      );
  } catch {}
}

/**
 * Translate `text` from `sourceLang` to `targetLang`.
 *
 * On error: returns original `text` so UI never breaks.
 * Indicates failure via boolean `cached`/`failed` field.
 */
export type TranslateResult = {
  text: string;
  cached: boolean;
  failed: boolean;
};

export async function translate(
  text: string,
  sourceLang: Lang,
  targetLang: Lang
): Promise<TranslateResult> {
  if (!text || text.trim().length === 0) {
    return { text: '', cached: true, failed: false };
  }
  if (sourceLang === targetLang) {
    return { text, cached: true, failed: false };
  }

  const key = makeCacheKey(text, sourceLang, targetLang);
  const cached = await readCache(key);
  if (cached !== null) {
    return { text: cached, cached: true, failed: false };
  }

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `Translate from ${sourceLang} to ${targetLang}. Output ONLY the translated text, no preamble, no quotes.\n\nText: ${text}`,
      },
    ],
  };

  try {
    const data = await callClaudeProxy('translate', body, 15000);
    const translated: string = data?.content?.[0]?.text?.trim() ?? '';

    if (!translated) {
      return { text, cached: false, failed: true };
    }

    writeCache(key, text, sourceLang, targetLang, translated);
    return { text: translated, cached: false, failed: false };
  } catch (e) {
    if (e instanceof AIProxyError) {
      // proxy errors = network/auth/rate limit; fall back to original
    }
    return { text, cached: false, failed: true };
  }
}
