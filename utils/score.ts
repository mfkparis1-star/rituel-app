/**
 * Rituel Score (Phase 16D D4) — soft wellness/identity signal.
 *
 * NOT a productivity score. NOT a streak counter. NOT a punishment system.
 * Reflective, encouraging, emotional reinforcement. Derived from real user
 * behavior already present in the DB.
 *
 * Five signals × 20 points = 0-100.
 * Four soft labels: Naissant / En éveil / En rituel / Rayonnant.
 *
 * Pure derive — no new tables, no migrations.
 */
import { supabase } from '../lib/supabase';
import { getRecentCheckins } from './checkins';
import { fetchOwnPosts } from './posts';

export type ScoreLabel = 'Naissant' | 'En éveil' | 'En rituel' | 'Rayonnant';

export type ScoreBreakdown = {
  checkins: number;     // 0-20
  routine: number;      // 0-20
  analysis: number;     // 0-20
  archive: number;      // 0-20
  community: number;    // 0-20
  total: number;        // 0-100
  label: ScoreLabel;
};

function labelFor(total: number): ScoreLabel {
  if (total <= 25) return 'Naissant';
  if (total <= 50) return 'En éveil';
  if (total <= 75) return 'En rituel';
  return 'Rayonnant';
}

/**
 * Compute the user's current Rituel Score from live data.
 * Returns null if the user is not signed in.
 */
export async function computeRitualScore(userId: string): Promise<ScoreBreakdown> {
  // 1. Check-in cadence — last 7 days
  const checkins = await getRecentCheckins(userId, 30);
  const sevenAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const distinctDays = new Set(
    checkins
      .filter((c) => new Date(c.created_at).getTime() >= sevenAgo)
      .map((c) => {
        const d = new Date(c.created_at);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
  );
  const checkinScore = Math.min(20, distinctDays.size * 3);

  // 2. Routine — morning + evening step counts
  const { data: steps } = await supabase
    .from('routine_steps')
    .select('time')
    .eq('user_id', userId);
  const morningCount = (steps ?? []).filter((s: { time: string }) => s.time === 'morning').length;
  const eveningCount = (steps ?? []).filter((s: { time: string }) => s.time === 'evening').length;
  const routineScore = (morningCount > 0 ? 10 : 0) + (eveningCount > 0 ? 10 : 0);

  // 3. Analysis — last 30 days
  const { data: profile } = await supabase
    .from('profiles')
    .select('skin_analyzed_at')
    .eq('id', userId)
    .maybeSingle();
  const analyzedAt = profile?.skin_analyzed_at ? new Date(profile.skin_analyzed_at).getTime() : 0;
  const thirtyAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const analysisScore = analyzedAt >= thirtyAgo ? 20 : analyzedAt > 0 ? 10 : 0;

  // 4. Archive — active product count
  const { data: products } = await supabase
    .from('products')
    .select('status')
    .eq('user_id', userId);
  const activeCount = (products ?? []).filter((p: { status: string }) => p.status === 'active').length;
  const archiveScore = activeCount >= 3 ? 20 : activeCount >= 1 ? 10 : 0;

  // 5. Community — own posts + likes given
  const ownPosts = await fetchOwnPosts(userId, 30);
  const ownPostScore = Math.min(10, ownPosts.length * 2);
  const { count: likedCount } = await supabase
    .from('post_likes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  const likeScore = Math.min(10, (likedCount ?? 0));
  const communityScore = ownPostScore + likeScore;

  const total = checkinScore + routineScore + analysisScore + archiveScore + communityScore;

  return {
    checkins: checkinScore,
    routine: routineScore,
    analysis: analysisScore,
    archive: archiveScore,
    community: communityScore,
    total,
    label: labelFor(total),
  };
}
