// scripts/probe-security.browser.js
// Security probes for docs/fix-plan.md Phase 1 (the profile lock-down).
//
// Run it in the browser console of a signed-in web preview (dev build — it
// finds the app's own Supabase client through Metro's module registry, so it
// never needs a password or a key). Every probe attempts a write the server
// should refuse, reads back what actually happened, and puts back anything
// that got through. PASS means the server refused it.
//
//   await probeSecurity()                        // this account only
//   await probeSecurity({ otherUserId: '…' })    // + cross-account probes
//
// Deliberately NOT probed here: publishing a community post with a bad link
// (pre-fix it would be briefly public). Pass { allowPublishProbe: true } on
// an adult test account to include it; it deletes the post straight away.

(function install() {
  function findClient() {
    if (window.__probeClient) return window.__probeClient;
    const mods = window.__r?.getModules?.();
    if (!mods) throw new Error('No Metro module registry — run this in a dev web preview.');
    for (const [, m] of mods) {
      const ex = m?.isInitialized && m.publicModule?.exports;
      const c = ex?.supabase;
      if (c && typeof c.from === 'function' && c.auth && typeof c.rpc === 'function' && !ex.SCOPED_TABLES) return c;
    }
    throw new Error('Could not find the Supabase client module.');
  }

  const refused = (err) => !!err;
  const missingFn = (err) => err && (err.code === 'PGRST202' || /Could not find the function/i.test(err.message || ''));

  window.probeSecurity = async function probeSecurity({ otherUserId = null, allowPublishProbe = false } = {}) {
    const sb = findClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('Sign in first.');
    const uid = user.id;
    const results = [];
    const add = (probe, pass, detail) => results.push({ probe, result: pass === null ? 'SKIP' : pass ? 'PASS' : 'FAIL', detail });

    const COLS = 'is_admin, parent_consent_given, parent_consent_at, kws_pv_status, is_minor, date_of_birth, country_code, xp, points, level, streak_count, last_active_date, parent_id, onboarding_completed, plan';
    const read = async () => (await sb.from('profiles').select(COLS).eq('id', uid).single()).data;
    const original = await read();

    // A self-edit probe: try the patch, read back, restore if it stuck.
    async function selfEdit(name, patch, stuck) {
      const { error } = await sb.from('profiles').update(patch).eq('id', uid);
      const after = await read();
      const got = stuck(after);
      if (got) {
        const restore = Object.fromEntries(Object.keys(patch).map(k => [k, original[k]]));
        await sb.from('profiles').update(restore).eq('id', uid);
      }
      add(name, !got, got ? 'write stuck (restored)' : error ? `refused: ${error.message}` : 'reverted by server');
    }

    await selfEdit('self-promote to admin', { is_admin: true }, a => a.is_admin === true);
    await selfEdit('self-grant parent consent', { parent_consent_given: true }, a => a.parent_consent_given === true && !original.parent_consent_given);
    await selfEdit('self-set KWS verified', { kws_pv_status: 'verified' }, a => a.kws_pv_status === 'verified' && original.kws_pv_status !== 'verified');
    await selfEdit('flip is_minor', { is_minor: !original.is_minor }, a => a.is_minor !== original.is_minor);
    if (original.date_of_birth) {
      await selfEdit('change birth date once set', { date_of_birth: '1990-01-01' }, a => a.date_of_birth !== original.date_of_birth);
      await selfEdit('change country once set', { country_code: original.country_code === 'DE' ? 'US' : 'DE' }, a => a.country_code !== original.country_code);
    } else {
      add('change birth date once set', null, 'no birth date on this account');
    }
    await selfEdit('self-set XP / points / level', { xp: 777777, points: 777777, level: 20 }, a => a.xp === 777777 || a.points === 777777 || a.level === 20);
    await selfEdit('self-set streak', { streak_count: 999, last_active_date: '2000-01-01' }, a => a.streak_count === 999);
    await selfEdit('self-grant Plus', { plan: 'plus' }, a => a.plan === 'plus' && original.plan !== 'plus');
    if (otherUserId) {
      await selfEdit('forge family link (parent_id)', { parent_id: otherUserId }, a => a.parent_id === otherUserId);
    } else {
      add('forge family link (parent_id)', null, 'pass otherUserId');
    }
    if (original.is_minor && !original.parent_consent_given) {
      await selfEdit('unconsented minor marks onboarding done', { onboarding_completed: true }, a => a.onboarding_completed === true && !original.onboarding_completed);
    } else {
      add('unconsented minor marks onboarding done', null, 'only meaningful on an unconsented minor');
    }

    // increment_user_progress
    {
      const before = await read();
      const neg = await sb.rpc('increment_user_progress', { p_user_id: uid, p_xp: 0, p_points: -1 });
      const afterNeg = await read();
      const negStuck = !neg.error && afterNeg.points < before.points;
      if (negStuck) await sb.rpc('increment_user_progress', { p_user_id: uid, p_xp: 0, p_points: 1 });
      add('negative points on self', !negStuck, neg.error ? `refused: ${neg.error.message}` : negStuck ? 'accepted (restored)' : 'no effect');

      const huge = await sb.rpc('increment_user_progress', { p_user_id: uid, p_xp: 100000, p_points: 100000 });
      const afterHuge = await read();
      const hugeStuck = !huge.error && afterHuge.points - before.points >= 100000;
      if (hugeStuck) await sb.rpc('increment_user_progress', { p_user_id: uid, p_xp: -100000, p_points: -100000 });
      add('oversized award on self', !hugeStuck, huge.error ? `refused: ${huge.error.message}` : hugeStuck ? 'accepted (restored)' : 'capped');

      if (otherUserId) {
        const cross = await sb.rpc('increment_user_progress', { p_user_id: otherUserId, p_xp: 0, p_points: 1 });
        if (!cross.error) await sb.rpc('increment_user_progress', { p_user_id: otherUserId, p_xp: 0, p_points: -1 });
        add('award points to another account', refused(cross.error),
          cross.error ? `refused: ${cross.error.message}` : 'accepted (reverted with -1)');
      } else {
        add('award points to another account', null, 'pass otherUserId');
      }
    }

    // New server functions exist and hold their line.
    {
      const r = await sb.rpc('record_parent_consent');
      add('consent without KWS verification', missingFn(r.error) ? null : refused(r.error),
        missingFn(r.error) ? 'record_parent_consent not deployed yet' : r.error ? `refused: ${r.error.message}` : 'ACCEPTED');
      if (!r.error) await sb.from('profiles').update({ parent_consent_given: original.parent_consent_given }).eq('id', uid);
    }

    // Paid gate on organizations.
    {
      const org = await sb.rpc('create_organization', { p_name: 'probe org (delete me)', p_type: 'other' });
      const created = org.data?.[0];
      if (created) await sb.rpc('leave_organization', { p_organization_id: created.id });
      const isPlus = original.plan === 'plus';
      add('create organization without Plus', isPlus ? null : !created,
        isPlus ? 'account has Plus' : created ? 'created (deleted again)' : `refused: ${org.error?.message}`);
    }

    // Invite codes are always 6 characters (the rounding bug made ~9% shorter).
    {
      const lens = [];
      for (let i = 0; i < 20; i++) {
        const c = await sb.rpc('generate_family_code');
        if (c.data?.[0]?.code) lens.push(c.data[0].code.length);
      }
      add('family codes are 6 characters', lens.length ? lens.every(n => n === 6) : null,
        lens.length ? `lengths: ${[...new Set(lens)].join(',')} over ${lens.length} codes` : 'could not generate');
    }

    if (allowPublishProbe) {
      const p = await sb.rpc('publish_community_post', { p_kind: 'win', p_title: 'probe (delete me)', p_body: null, p_link: 'javascript:alert(1)', p_tags: [] });
      if (p.data) await sb.rpc('delete_my_community_post', { p_post_id: p.data });
      add('post with javascript: link', !p.data, p.data ? 'published (deleted again)' : `refused: ${p.error?.message}`);
    }

    const final = await read();
    const drift = Object.keys(original).filter(k => JSON.stringify(original[k]) !== JSON.stringify(final[k]));
    add('profile left as found', drift.length === 0, drift.length ? `changed: ${drift.join(', ')}` : 'unchanged');

    console.table(results);
    return results;
  };
})();
