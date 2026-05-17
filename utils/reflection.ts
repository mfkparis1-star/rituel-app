/**
 * Phase 17D — Soft AI Reflections.
 *
 * One-tap empathy from Rituel: a 1-2 sentence reflection on the
 * user's recent rituals. Cache-first (24h freshness in memory),
 * gated softly (free 1/day, premium 5/day), and intentionally
 * shy on backend cost.
 *
 * Architecture:
 *   - Backend: reuse the existing claude-proxy edge function.
 *     We send a fresh Anthropic Messages payload directly.
 *     The function only proxies + rate-limits (LIMITS.default
 *     applies to the 'reflection' endpoint, 200/day ceiling).
 *   - Cache: profiles.memory.last_reflection (cross-device truth).
 *   - Quota: frontend counter inside the cached object.
 *
 * Tone guardrails:
 *   - 1 or 2 short French sentences, italic-feeling.
 *   - No medical advice, no diagnostic, no coaching.
 *   - No "tu devrais", no "tu as échoué", no streak shame.
 *   - max_tokens hard-capped low. Post-filter for forbidden words.
 *   - On any failure, return a soft fallback line, never an error
 *     that punishes the user.
 */
import { callClaudeProxy, AIProxyError } from './aiProxy';
import { getMemory, patchMemory, type LastReflection } from './memory';

const FREE_QUOTA = 1;
const PREMIUM_QUOTA = 5;
const FRESHNESS_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_OUTPUT_TOKENS = 120;

const FALLBACK_LINE =
  "Prenez un instant pour vous aujourd'hui. Votre rituel est déjà un beau geste.";

// Soft red flags. If the model leaks coaching/medical wording, we
// substitute the fallback — never display these to the user.
const FORBIDDEN_PATTERNS = [
  /\btu devrais\b/i,
  /\bvous devriez\b/i,
  /\bconsult\w*\s+un[e]?\s+(m[ée]decin|professionnel)/i,
  /\b[ée]chec\b/i,
  /\b[ée]chou[ée]\b/i,
  /\bdiagnost\w+\b/i,
];

export type ReflectionSignals = {
  checkinEmojis?: string[];     // recent 7
  skinType?: string | null;
  concerns?: string[];
  lastEmotion?: string | null;  // from most recent shared post
};

function todayYmd(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function isFresh(at: string | undefined): boolean {
  if (!at) return false;
  const ts = new Date(at).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < FRESHNESS_MS;
}

/**
 * Return the cached reflection if it is still fresh (< 24h old).
 * Returns null when no cache or expired. Never throws.
 */
export async function getCachedReflection(userId: string): Promise<LastReflection | null> {
  try {
    const m = await getMemory(userId);
    const r = m?.last_reflection;
    if (!r || !r.text || !isFresh(r.at)) return null;
    return r;
  } catch {
    return null;
  }
}

/**
 * Quota check based on the cached counter. Day rolls over at local
 * midnight (UTC offset of the device, which is fine for a soft cap).
 */
export async function getQuotaRemaining(userId: string, isPremium: boolean): Promise<number> {
  const max = isPremium ? PREMIUM_QUOTA : FREE_QUOTA;
  try {
    const m = await getMemory(userId);
    const r = m?.last_reflection;
    if (!r) return max;
    const today = todayYmd();
    if (r.count_date !== today) return max;
    return Math.max(0, max - (r.count_today ?? 0));
  } catch {
    return max;
  }
}

function buildPrompt(signals: ReflectionSignals): { system: string; user: string } {
  const emojis = (signals.checkinEmojis ?? []).slice(0, 7);
  const emojiLine = emojis.length > 0 ? emojis.join(' ') : 'aucun récent';
  const concerns = (signals.concerns ?? []).slice(0, 4);
  const concernsLine = concerns.length > 0 ? concerns.join(', ') : 'aucune';
  const skin = signals.skinType ? signals.skinType : 'non renseigné';
  const emotion = signals.lastEmotion ? signals.lastEmotion : 'non renseignée';

  const system = [
    "Tu es Rituel, un journal de beauté intime et bienveillant.",
    "Tu observes la peau et le moment de la femme avec douceur.",
    "",
    "Règles strictes:",
    "- Réponds en 1 ou 2 phrases françaises maximum.",
    "- Jamais de conseil médical, jamais de diagnostic.",
    "- Jamais de coaching, jamais de jugement.",
    "- Pas de 'tu devrais', pas de 'tu as échoué'.",
    "- Ton: intime, féminin, soft, comme une note dans un journal.",
    "- Pas d'emojis, pas de listes, pas de titres.",
  ].join('\n');

  const user = [
    "Voici les signaux récents:",
    `- Check-ins (7 derniers jours): ${emojiLine}`,
    `- Type de peau: ${skin}`,
    `- Préoccupations: ${concernsLine}`,
    `- Émotion du dernier rituel partagé: ${emotion}`,
    "",
    "Écris une réflexion en 1 ou 2 phrases.",
  ].join('\n');

  return { system, user };
}

function extractText(resp: any): string | null {
  try {
    if (!resp || !Array.isArray(resp.content)) return null;
    const parts: string[] = [];
    for (const block of resp.content) {
      if (block && block.type === 'text' && typeof block.text === 'string') {
        parts.push(block.text);
      }
    }
    const raw = parts.join(' ').trim();
    if (!raw) return null;
    return raw;
  } catch {
    return null;
  }
}

function isSafe(text: string): boolean {
  for (const re of FORBIDDEN_PATTERNS) {
    if (re.test(text)) return false;
  }
  return true;
}

/**
 * Generate a new reflection, persist it to memory, return the text.
 * Returns the fallback line on any failure (never throws to caller).
 */
export async function generateReflection(
  userId: string,
  isPremium: boolean,
  signals: ReflectionSignals
): Promise<{ text: string; fromCache: boolean; quotaExceeded: boolean }> {
  const remaining = await getQuotaRemaining(userId, isPremium);
  if (remaining <= 0) {
    const cached = await getCachedReflection(userId);
    return {
      text: cached?.text ?? FALLBACK_LINE,
      fromCache: !!cached,
      quotaExceeded: true,
    };
  }

  const { system, user } = buildPrompt(signals);
  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: MAX_OUTPUT_TOKENS,
    system,
    messages: [{ role: 'user', content: user }],
  };

  let text: string | null = null;
  try {
    const resp = await callClaudeProxy('reflection', body, 20000);
    text = extractText(resp);
  } catch (e) {
    // AIProxyError or network — fall through to fallback
    text = null;
  }

  if (!text || !isSafe(text) || text.length > 280) {
    text = FALLBACK_LINE;
  }

  // Persist to memory: bump counter, freeze timestamp
  try {
    const m = (await getMemory(userId)) ?? {};
    const today = todayYmd();
    const prev = m.last_reflection;
    const sameDay = prev?.count_date === today;
    const nextCount = (sameDay ? (prev?.count_today ?? 0) : 0) + 1;
    await patchMemory(userId, {
      last_reflection: {
        text,
        at: new Date().toISOString(),
        count_today: nextCount,
        count_date: today,
      },
    });
  } catch {
    // Persistence failure is non-fatal; the user still sees the text.
  }

  return { text, fromCache: false, quotaExceeded: false };
}

export const REFLECTION_FALLBACK = FALLBACK_LINE;
