// src/api/recommendationEngine.js
// Scores content catalog items against user profile answers

import { supabase } from './supabaseClient';

// ─── Score a single catalog item against user profile ─────────────────────────
function scoreItem(item, profile) {
  let score = 0;
  const areas   = profile.active_life_areas || [];
  const topics  = profile.topics || [];
  const formats = profile.formats || [];
  const level   = profile.tech_level || 'beginner';
  const age     = profile.age_category || 'adult';

  // Life area match — highest weight
  const areaMatches = item.life_areas?.filter(a => areas.includes(a)).length || 0;
  score += areaMatches * 10;

  // Topic match
  const topicMatches = item.topics?.filter(tp => topics.includes(tp)).length || 0;
  score += topicMatches * 6;

  // Format match
  const formatMatches = item.formats?.filter(f => formats.includes(f)).length || 0;
  score += formatMatches * 4;

  // Tech level match
  const levels = ['beginner', 'intermediate', 'advanced'];
  const userLvl = levels.indexOf(level);
  const itemLvl = levels.indexOf(item.tech_level || 'beginner');
  if (itemLvl === userLvl) score += 5;
  else if (itemLvl === userLvl - 1) score += 2; // slightly below is ok
  else if (itemLvl > userLvl + 1) score -= 5;   // too advanced, penalize

  // Age match
  const ageMap = { teen: 'teen', young_adult: 'young_adult', adult: 'adult', professional: 'professional' };
  if (item.age_groups?.includes(ageMap[age])) score += 3;

  return score;
}

// Build reason string
function buildReason(item, profile) {
  const areas  = profile.active_life_areas || [];
  const matched = item.life_areas?.filter(a => areas.includes(a)) || [];
  if (matched.length > 0) return `Matches your ${matched.join(' & ')} focus`;
  if (item.topics?.some(tp => (profile.topics || []).includes(tp))) return 'Matches your interests';
  return 'Recommended for you';
}

// ─── Main recommendation function ────────────────────────────────────────────
export async function generateRecommendations(userId, profile) {
  try {
    // Load all active catalog items
    const { data: catalog, error } = await supabase
      .from('content_catalog')
      .select('*')
      .eq('is_active', true);

    if (error || !catalog?.length) return { games: [], classes: [] };

    // Score and sort
    const scored = catalog
      .map(item => ({ ...item, score: scoreItem(item, profile), reason: buildReason(item, profile) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const games   = scored.filter(i => i.type === 'game').slice(0, 4);
    const classes = scored.filter(i => i.type === 'class').slice(0, 4);

    // Cache recommendations in Supabase
    const rows = [...games, ...classes].map(item => ({
      user_id:    userId,
      content_id: item.id,
      score:      item.score,
      reason:     item.reason,
    }));

    if (rows.length > 0) {
      await supabase.from('user_recommendations')
        .upsert(rows, { onConflict: 'user_id,content_id' });
    }

    return { games, classes };
  } catch (e) {
    console.warn('generateRecommendations', e);
    return { games: [], classes: [] };
  }
}

// Fetch cached recommendations
export async function getRecommendations(userId) {
  const { data } = await supabase
    .from('user_recommendations')
    .select('*, content_catalog(*)')
    .eq('user_id', userId)
    .eq('dismissed', false)
    .order('score', { ascending: false });

  if (!data?.length) return { games: [], classes: [] };

  const items   = data.map(r => ({ ...r.content_catalog, score: r.score, reason: r.reason }));
  const games   = items.filter(i => i.type === 'game').slice(0, 4);
  const classes = items.filter(i => i.type === 'class').slice(0, 4);
  return { games, classes };
}
