// src/logic/useGameFacts.js
// Pool of on-topic "Did You Know" facts for a game, sourced from Supabase
// (app_content, type='game_fact', key=<gameId> — see
// supabase/migrations/20260831_game_facts.sql). Same cache-then-network
// pattern as fetchContentPool's other callers.
//
// Unlike the old useGameFact (one fact, fetched once, shown at game open —
// removed per product decision: facts no longer show before a round
// starts), this fetches the WHOLE pool once and hands back a `next()`
// roller so callers can pull a fresh random fact repeatedly — once per
// correct answer (GameShell) and once per round-complete screen (GameOver)
// — without re-hitting the network each time. `next()` avoids immediately
// repeating the fact it just gave out (when the pool has more than one).

import { useRef, useState, useEffect, useCallback } from 'react';
import { fetchContentPool } from '../api/remoteConfigService';

export default function useGameFacts(gameId) {
  const poolRef = useRef([]);
  const lastRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!gameId) return;
    let alive = true;
    fetchContentPool('game_fact', gameId).then((rows) => {
      if (!alive) return;
      poolRef.current = rows.map(r => r.body).filter(Boolean);
      setReady(true);
    });
    return () => { alive = false; };
  }, [gameId]);

  const next = useCallback(() => {
    const pool = poolRef.current;
    if (!pool.length) return null;
    if (pool.length === 1) { lastRef.current = pool[0]; return pool[0]; }
    let pick;
    do {
      pick = pool[Math.floor(Math.random() * pool.length)];
    } while (pick === lastRef.current);
    lastRef.current = pick;
    return pick;
  }, []);

  return { ready, next };
}
