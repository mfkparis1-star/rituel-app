/**
 * skinHistory — persists each AI skin analysis so the user can see
 * their skin journey over time (the "Ton Glow" loop). Reads/writes are
 * best-effort: a failure here must never break the analysis flow, so
 * everything is wrapped and returns safe empty values.
 */
import { supabase } from '../lib/supabase';
import type { SkinAnalysisResult } from './skinAnalysis';

export type SkinAnalysisRecord = {
  id: string;
  skin_type: string;
  issues: string[];
  recommendations: string[];
  confidence: number | null;
  glow_score: number | null;
  created_at: string;
};

/** Fire-and-forget save. Never throws. */
export async function saveSkinAnalysis(
  result: Pick<SkinAnalysisResult, 'skinType' | 'issues' | 'recommendations' | 'confidence' | 'glowScore'>
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('skin_analyses').insert({
      user_id: session.user.id,
      skin_type: result.skinType,
      issues: result.issues ?? [],
      recommendations: result.recommendations ?? [],
      confidence: result.confidence ?? null,
      glow_score: result.glowScore ?? null,
    });
  } catch {
    // non-fatal: journey tracking is a bonus, never blocks analysis
  }
}

/** Most recent analyses, newest first. Returns [] on any error. */
export async function getSkinHistory(limit = 10): Promise<SkinAnalysisRecord[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const { data, error } = await supabase
      .from('skin_analyses')
      .select('id, skin_type, issues, recommendations, confidence, glow_score, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as SkinAnalysisRecord[];
  } catch {
    return [];
  }
}

export type GlowTrend = {
  hasPrevious: boolean;
  daysSincePrevious: number | null;
  issuesDelta: number | null;   // negative = fewer issues now (improvement)
  confidenceDelta: number | null;
  glowScoreDelta: number | null;
  latestGlowScore: number | null;
};

/** Compare the two most recent analyses into a simple trend. */
export function computeGlowTrend(history: SkinAnalysisRecord[]): GlowTrend {
  if (!history || history.length < 2) {
    return { hasPrevious: false, daysSincePrevious: null, issuesDelta: null, confidenceDelta: null, glowScoreDelta: null, latestGlowScore: history && history[0] ? (history[0].glow_score ?? null) : null };
  }
  const [current, previous] = history;
  const ms = new Date(current.created_at).getTime() - new Date(previous.created_at).getTime();
  const days = Math.max(0, Math.round(ms / 86400000));
  const issuesDelta = (current.issues?.length ?? 0) - (previous.issues?.length ?? 0);
  const confidenceDelta =
    current.confidence != null && previous.confidence != null
      ? Number((current.confidence - previous.confidence).toFixed(2))
      : null;
  const glowScoreDelta =
    current.glow_score != null && previous.glow_score != null
      ? current.glow_score - previous.glow_score
      : null;
  return { hasPrevious: true, daysSincePrevious: days, issuesDelta, confidenceDelta, glowScoreDelta, latestGlowScore: current.glow_score ?? null };
}
