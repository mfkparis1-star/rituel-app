/**
 * Memory primitives — typed accessor on profiles.memory JSONB column.
 *
 * The column is intentionally schema-less in the DB so we can iterate
 * without migrations. This file is the source of truth for the shape
 * the app code expects. Add new keys here and add their accessors.
 *
 * Phase 16C launch-critical keys:
 *   - last_analysis_summary: { skinType, issues, at }
 *   - routine_preference:    { morning_step_count, evening_step_count }
 *   - archive_signals:       { active_count, categories[] }
 *   - concerns_extracted:    string[]
 *
 * Backed by Supabase. Read-and-write paths go through getMemory() /
 * patchMemory(). patchMemory does a server-side merge so concurrent
 * writes from different fields do not stomp each other.
 */
import { supabase } from '../lib/supabase';

export type LastAnalysisSummary = {
  skinType?: string;
  issues?: string[];
  at?: string; // ISO timestamp
};

export type RoutinePreference = {
  morning_step_count?: number;
  evening_step_count?: number;
};

export type ArchiveSignals = {
  active_count?: number;
  categories?: string[];
};

export type LastReflection = {
  lang?: string;        // language the text was generated in
  text: string;
  at: string;             // ISO timestamp
  count_today: number;    // soft per-day quota counter
  count_date: string;     // YYYY-MM-DD when counter applies
};

export type SkinProfile = {
  skin_type?: string;          // sec | mixte | gras | normal | sensible | unknown
  concerns?: string[];         // 1-3 picked concerns
  sensitivity?: string;        // souvent | parfois | rarement | unknown
  routine_level?: string;      // basique | intermediaire | avancee | aucune
  self_note?: string;          // optional free text (max 140)
  goal?: string;               // hydratation | eclat | apaisement | equilibre | aucun
  completed_at?: string;       // ISO timestamp
};

export type SkinAnalysisParameter = {
  level: 'low' | 'medium' | 'high';
  note: string;
};

export type SkinProfileAnalysis = {
  skinTypeCanonical: string;     // dry | oily | combination | normal | sensitive
  parameters: {
    hydration: SkinAnalysisParameter;
    luminosity: SkinAnalysisParameter;
    sensitivity: SkinAnalysisParameter;
    poreVisibility: SkinAnalysisParameter;
    pigmentation: SkinAnalysisParameter;
  };
  narrative: string;             // 3-4 paragraph warm interpretation
  recommendations: string[];     // 3-5 short suggestions
  createdAt: string;             // ISO timestamp
};

export type Memory = {
  last_analysis_summary?: LastAnalysisSummary;
  routine_preference?: RoutinePreference;
  archive_signals?: ArchiveSignals;
  concerns_extracted?: string[];
  last_reflection?: LastReflection;
  skin_profile?: SkinProfile;
  skin_profile_analysis?: SkinProfileAnalysis;
};

/**
 * Fetch the entire memory object for a user.
 * Returns {} if the row exists but memory is empty/null.
 * Returns null if the row does not exist.
 */
export async function getMemory(userId: string): Promise<Memory | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('memory')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return (data.memory as Memory) ?? {};
}

/**
 * Read and merge existing profile memory. A failed read must not overwrite it.
 * Concurrent writes can still conflict because the merge runs in the client.
 */
export async function patchMemory(userId: string, patch: Partial<Memory>): Promise<boolean> {
  try {
    const { data, error: readError } = await supabase
      .from('profiles')
      .select('memory')
      .eq('id', userId)
      .maybeSingle();
    if (readError) return false;
    const merged: Memory = { ...((data?.memory as Memory | null) ?? {}), ...patch };
    const operation = data
      ? supabase.from('profiles').update({ memory: merged }).eq('id', userId)
      : supabase.from('profiles').insert({ id: userId, memory: merged });
    const { data: saved, error } = await operation.select('id').maybeSingle();
    return !error && !!saved;
  } catch {
    return false;
  }
}
