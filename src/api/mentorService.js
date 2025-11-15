import { supabase } from './supabaseClient';

/**
 * Fetch active mentors. Optionally filter by subject (string).
 */
export async function fetchMentors({ subject = null, limit = 50 } = {}) {
  try {
    let q = supabase
      .from('mentors')
      .select('id, display_name, bio, subjects, hourly_rate, rating, rating_count')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(limit);

    if (subject) q = q.contains('subjects', [subject]);

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchMentors error', err);
    throw err;
  }
}

/**
 * Upsert mentor record for a profile id.
 * payload should include id (profile id), display_name, subjects (array), bio, hourly_rate, availability...
 */
export async function upsertMentor(payload) {
  try {
    const { data, error } = await supabase
      .from('mentors')
      .upsert(payload, { onConflict: ['id'] });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('upsertMentor error', err);
    throw err;
  }
}

/**
 * Create a mentorship request.
 */
export async function createMentorRequest({ mentorId, requesterId, message }) {
  try {
    const { data, error } = await supabase
      .from('mentor_requests')
      .insert([{ mentor_id: mentorId, requester_id: requesterId, message }]);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('createMentorRequest error', err);
    throw err;
  }
}
