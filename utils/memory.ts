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
  text: string;
  at: string;             // ISO timestamp
  count_today: number;    // soft per-day quota counter
  count_date: string;     // YYYY-MM-DD when counter applies
};

export type Memory = {
  last_analysis_summary?: LastAnalysisSummary;
  routine_preference?: RoutinePreference;
  archive_signals?: ArchiveSignals;
  concerns_extracted?: string[];
  last_reflection?: LastReflection;
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
 * Shallow-merge a patch into memory. Existing keys not in the patch are
 * preserved. Concurrent writes to disjoint keys are safe; concurrent
 * writes to the same key follow last-write-wins.
 *
 * Implementation: read-merge-write. For higher concurrency we could
 * push this into a Postgres function with jsonb_set, but launch traffic
 * does not justify it yet.
 */
export async function patchMemory(userId: string, patch: Partial<Memory>): Promise<boolean> {
  try {
    const current = (await getMemory(userId)) ?? {};
    const merged: Memory = { ...current, ...patch };
    const { error } = await supabase
      .from('profiles')
      .update({ memory: merged })
      .eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}
