// src/logic/usePetCare.js
// Everything about looking after the pet, shared by every screen that shows
// it (Training's and Profile's pet stage, the top bar's points, the hungry
// reminder): its bowl, its bond, its name, its daily gift, and the points
// spent on food. The rules live in petHunger.js and petBond.js; this is
// where they're stored.
//
// Signed in, the server holds it all (pet_status / feed_pet, 20261015120000;
// bond, name, gift, 20261015130000): one pet across devices, and food only
// costs points the account has. A guest, or a database without those files,
// keeps it on this device instead with the same rules, so the pet still gets
// hungry, eats and levels up either way. Gifts are the one thing that needs
// the server (they pay points), so they wait for it.
//
// Spent points come off what you can spend, never off your earned total:
// rank and unlocks read `points` (the lifetime total), and the points shown
// to spend are `points - spent`. See useSpendablePoints below.

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { supabase } from '../api/supabaseClient';
import { cacheRead, cacheWrite } from '../api/offlineCache';
import useAppActive from './useAppActive';
import {
  FULL_MS, foodById, heartsLeft, moodFor, fullUntilAfter, cantFeed, msUntilNextHeartLost,
} from './petHunger';
import { bondGain, bondLevel, cleanPetName, NAME_LEVEL, GIFT_LEVEL, giftReadyAt } from './petBond';
import { announceServerAward } from './gamificationService';

// ─── The shared store ───────────────────────────────────────────────────────
// owner: whose numbers these are ('guest' or a user id). clockOn: the bowl's
// clock has started (only once a pet exists; before that it reads as full).
// local: no pet tables on the server (or a guest), so this device keeps it.
// bondLocal: the server has the bowl but not bond yet (only the first file
// run), so bond and name are kept here meanwhile.
const EMPTY = {
  ready: false, local: false, bondLocal: false, fullUntil: null, spent: 0, clockOn: false,
  bond: 0, nickname: null, giftAt: null,
};
let store = { owner: null, ...EMPTY };
const listeners = new Set();
const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const getStore = () => store;
const setStore = (patch) => { store = { ...store, ...patch }; listeners.forEach(fn => fn()); };

const cacheKey = (owner) => `petCare:v1:${owner}`;
const saveLocal = () => cacheWrite(cacheKey(store.owner), {
  fullUntil: store.fullUntil, spent: store.spent, bond: store.bond, nickname: store.nickname, giftAt: store.giftAt,
});

const isMissing = (e) => !!e && (
  e.code === 'PGRST202' || e.code === '42883' || e.code === '42P01'
  || /does not exist|schema cache/i.test(e.message || ''));

const parseTime = (v) => (v ? Date.parse(v) : null);

let loading = null; // the load in flight: { owner, hasPet, promise }
let loadSeq = 0;    // only the newest load may write: an older reply could wipe a clock just started

async function load(owner, hasPet) {
  const seq = ++loadSeq;
  const stale = () => seq !== loadSeq || store.owner !== owner;
  if (store.owner !== owner) setStore({ owner, ...EMPTY });

  // Cached numbers first, so the hearts don't flash full on every launch.
  const saved = await cacheRead(cacheKey(owner));
  if (stale()) return;
  if (saved && !store.ready) {
    setStore({
      fullUntil: saved.fullUntil ?? null, spent: saved.spent || 0, clockOn: saved.fullUntil != null,
      bond: saved.bond || 0, nickname: saved.nickname || null, giftAt: saved.giftAt ?? null,
    });
  }

  if (owner !== 'guest') {
    const { data, error } = await supabase.rpc('pet_status', { p_has_pet: !!hasPet });
    if (stale()) return;
    if (!error) {
      const fullUntil = parseTime(data?.full_until);
      const hasBond = data && 'bond' in data;
      setStore({
        ready: true, local: false, bondLocal: !hasBond, fullUntil, spent: data?.spent || 0, clockOn: fullUntil != null,
        ...(hasBond ? { bond: data.bond || 0, nickname: data.nickname || null, giftAt: parseTime(data.gift_at) } : {}),
      });
      saveLocal();
      return;
    }
    if (!isMissing(error)) {
      // Offline or a hiccup: keep what was cached, try again next launch.
      console.warn('[usePetCare] pet_status', error.message);
      setStore({ ready: true });
      return;
    }
  }

  // Guest, or no pet tables on this database yet: this device keeps it.
  const patch = { ready: true, local: true, bondLocal: true };
  if (hasPet && store.fullUntil == null) {
    patch.fullUntil = Date.now() + FULL_MS; // a new pet starts full
    patch.clockOn = true;
  }
  setStore(patch);
  saveLocal();
}

function ensureLoaded(owner, hasPet) {
  const needsClock = hasPet && !store.clockOn;
  if (store.owner === owner && store.ready && !needsClock) return;
  if (loading && loading.owner === owner && (loading.hasPet || !hasPet)) return;
  const promise = load(owner, hasPet).finally(() => { if (loading?.promise === promise) loading = null; });
  loading = { owner, hasPet, promise };
}

// Buy one food and feed it. Resolves to { ok, reason, gained, levelUp,
// fullUntil } — reason is 'full', 'points' or 'error' when it didn't happen;
// gained is the bond it earned, levelUp the new level when it crossed into
// one, fullUntil the bowl after eating.
async function feed(foodId, wallet) {
  const food = foodById(foodId);
  const now = Date.now();
  const before = heartsLeft(store.fullUntil, now);
  const why = cantFeed(food, { hearts: before, wallet });
  if (why) return { ok: false, reason: why };
  const levelBefore = bondLevel(store.bond).level;
  const done = () => {
    const after = bondLevel(store.bond).level;
    return after > levelBefore ? after : null;
  };

  if (!store.local) {
    const { data, error } = await supabase.rpc('feed_pet', { p_food: food.id });
    if (!error) {
      if (!data?.ok) {
        setStore({ fullUntil: parseTime(data?.full_until), spent: data?.spent ?? store.spent });
        return { ok: false, reason: data?.reason || 'error' };
      }
      const fullUntil = parseTime(data.full_until);
      const gained = 'bond' in data ? (data.gained || 0) : bondGain(before, heartsLeft(fullUntil, now));
      setStore({
        fullUntil, spent: data.spent ?? store.spent, clockOn: true,
        bond: 'bond' in data ? data.bond : store.bond + gained,
      });
      saveLocal();
      return { ok: true, gained, levelUp: done(), fullUntil: store.fullUntil };
    }
    if (!isMissing(error)) {
      console.warn('[usePetCare] feed_pet', error.message);
      return { ok: false, reason: 'error' };
    }
    setStore({ local: true, bondLocal: true });
  }

  const fullUntil = fullUntilAfter(store.fullUntil, food, now);
  const gained = bondGain(before, heartsLeft(fullUntil, now));
  setStore({ fullUntil, spent: store.spent + food.cost, clockOn: true, bond: store.bond + gained });
  saveLocal();
  return { ok: true, gained, levelUp: done(), fullUntil: store.fullUntil };
}

// Name the pet (Pal and up). Empty clears it. Resolves to { ok, reason }.
async function setName(raw) {
  if (bondLevel(store.bond).level < NAME_LEVEL) return { ok: false, reason: 'level' };
  const name = cleanPetName(raw) || null;
  if (!store.bondLocal) {
    const { data, error } = await supabase.rpc('set_pet_name', { p_name: name || '' });
    if (!error) {
      if (!data?.ok) return { ok: false, reason: data?.reason || 'error' };
      setStore({ nickname: data.nickname || null });
      saveLocal();
      return { ok: true };
    }
    if (!isMissing(error)) return { ok: false, reason: 'error' };
    setStore({ bondLocal: true });
  }
  setStore({ nickname: name });
  saveLocal();
  return { ok: true };
}

// Open the daily gift (Great buddy and up, server only). Resolves to the
// points it paid (0 when it isn't ready or can't be paid here).
async function openGift() {
  if (store.local || store.bondLocal || bondLevel(store.bond).level < GIFT_LEVEL) return 0;
  const { data, error } = await supabase.rpc('claim_pet_gift');
  if (error) { console.warn('[usePetCare] claim_pet_gift', error.message); return 0; }
  if (data?.gift_at) setStore({ giftAt: parseTime(data.gift_at) });
  saveLocal();
  const pts = data?.points || 0;
  if (pts) announceServerAward(pts, 0, 'pet-gift');
  return pts;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * The pet's care: { ready, hearts, mood, fullUntil, spent, bond, nickname,
 * giftReady, giftAt, canGift, feed(foodId, wallet), setName(name), openGift() }.
 * `hasPet` starts the bowl's clock the first time a pet is on screen.
 * Re-renders by itself the moment a heart empties or the gift is ready.
 */
export default function usePetCare(userId, hasPet = false) {
  const owner = userId || 'guest';
  const s = useSyncExternalStore(subscribe, getStore, getStore);
  const appOpen = useAppActive();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => { ensureLoaded(owner, hasPet); }, [owner, hasPet]);

  // Back in the app after a while: count the hours that went by.
  useEffect(() => { if (appOpen) setNow(Date.now()); }, [appOpen]);

  const mine = s.owner === owner;
  const fullUntil = mine && s.clockOn ? s.fullUntil : null;
  const bond = mine ? s.bond : 0;
  // Gifts are paid by the server, so only where it keeps the bond.
  const canGift = mine && !s.local && !s.bondLocal && bondLevel(bond).level >= GIFT_LEVEL;
  const giftAt = mine ? s.giftAt : null;
  const giftWait = canGift ? giftReadyAt(giftAt) - now : null;

  useEffect(() => {
    const waits = [msUntilNextHeartLost(fullUntil, now), giftWait > 0 ? giftWait : null].filter(v => v != null);
    if (!waits.length || !appOpen) return undefined;
    const id = setTimeout(() => setNow(Date.now()), Math.min(...waits) + 250);
    return () => clearTimeout(id);
  }, [fullUntil, giftWait, now, appOpen]);

  const hearts = heartsLeft(fullUntil, now);
  const feedIt = useCallback(async (foodId, wallet) => {
    const res = await feed(foodId, wallet);
    setNow(Date.now());
    return res;
  }, []);
  const openIt = useCallback(async () => {
    const pts = await openGift();
    setNow(Date.now());
    return pts;
  }, []);

  return {
    // Known once the server answered or this device had numbers saved.
    ready: mine && (s.ready || s.clockOn),
    hearts,
    mood: moodFor(hearts),
    fullUntil,
    spent: mine ? s.spent : 0,
    bond,
    nickname: mine ? s.nickname : null,
    canGift,
    giftAt,
    giftReady: canGift && giftWait <= 0,
    feed: feedIt,
    setName,
    openGift: openIt,
  };
}

/**
 * Points you can spend: everything earned minus what's been spent on pet
 * food. `points` is the lifetime total from useUserProgress.
 */
export function useSpendablePoints(userId, points) {
  const owner = userId || 'guest';
  const s = useSyncExternalStore(subscribe, getStore, getStore);
  useEffect(() => { ensureLoaded(owner, false); }, [owner]);
  const spent = s.owner === owner ? s.spent : 0;
  return Math.max(0, (points || 0) - spent);
}
