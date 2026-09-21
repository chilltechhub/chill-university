// context/PlusContext.js
// Plus, from the app's side: keeps RevenueCat logged in as whoever is signed
// in, loads the store's prices, and runs buy / restore.
//
// Two answers to "has this person got Plus?", on purpose:
//   - profiles.plan (AccessContext.isPlus) — the server's word, written only
//     by the revenuecat-sync edge function. The database gates
//     (unlock_feature) trust this and only this.
//   - the store's entitlement on this device — lands the instant a purchase
//     finishes, a few seconds before the webhook has updated the profile.
// `hasPlus` is either. It is used for what the app SHOWS; it can't open
// anything the server hasn't agreed to, because the server re-checks.
//
// Nothing here navigates — this provider sits outside the
// NavigationContainer. Screens open the paywall with
// navigation.navigate('Plus', { from }).

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useUserProgress } from './UserProgressContext';
import { useAccess } from './AccessContext';
import * as purchases from '../src/api/purchases';

const PlusContext = createContext(null);

export function PlusProvider({ children }) {
  const { user, profile, refreshProfile } = useUserProgress();
  const { isPlus, plusOnSale } = useAccess();
  const userId = user?.id || null;

  const [ready, setReady] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [packages, setPackages] = useState(null); // null = not loaded yet
  const [packagesError, setPackagesError] = useState(null);
  const [busy, setBusy] = useState(false);
  const supported = purchases.purchasesSupported();

  // Follow the signed-in user. Signing out logs RevenueCat out too, so the
  // next person on this phone doesn't inherit a receipt.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setCustomerInfo(null);
    setPackages(null);
    (async () => {
      const ok = await purchases.identify(userId);
      if (cancelled || !ok || !userId) return;
      const info = await purchases.getCustomerInfo();
      if (cancelled) return;
      setCustomerInfo(info);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!ready) return undefined;
    return purchases.onCustomerInfo(info => setCustomerInfo(info));
  }, [ready]);

  const storeEntitled = purchases.isEntitled(customerInfo);

  // The store says yes but the profile still says no: the webhook hasn't
  // landed (or was missed). Nudge the server once per session rather than
  // leaving someone who paid staring at a lock.
  const nudged = useRef(false);
  useEffect(() => {
    if (!storeEntitled || isPlus || nudged.current || !userId) return;
    nudged.current = true;
    purchases.syncPlan().then(() => refreshProfile?.());
  }, [storeEntitled, isPlus, userId, refreshProfile]);

  const loadPackages = useCallback(async () => {
    if (!ready) return;
    setPackagesError(null);
    try {
      setPackages(await purchases.getPlusPackages());
    } catch (e) {
      setPackages([]);
      setPackagesError(e?.message || 'Could not load prices from the store.');
    }
  }, [ready]);

  const buy = useCallback(async (pkg) => {
    setBusy(true);
    try {
      const res = await purchases.buy(pkg);
      if (res.customerInfo) setCustomerInfo(res.customerInfo);
      await refreshProfile?.();
      return res;
    } finally {
      setBusy(false);
    }
  }, [refreshProfile]);

  const restore = useCallback(async () => {
    setBusy(true);
    try {
      const res = await purchases.restore();
      if (res.customerInfo) setCustomerInfo(res.customerInfo);
      await refreshProfile?.();
      return res;
    } finally {
      setBusy(false);
    }
  }, [refreshProfile]);

  const hasPlus = isPlus || storeEntitled;

  const value = useMemo(() => ({
    supported,
    ready,
    onSale: plusOnSale === true,
    hasPlus,
    // Whether Plus-only CONTENT (the business courses past lesson one) is
    // shut for this person. Nothing is shut while Plus can't be bought:
    // a lock with no key is just a broken screen.
    contentLocked: plusOnSale === true && !hasPlus,
    plan: {
      expiresAt: profile?.plan_expires_at || null,
      period: profile?.plan_period || null,
      store: profile?.plan_store || null,
      willRenew: profile?.plan_will_renew ?? null,
    },
    packages,
    packagesError,
    loadPackages,
    busy,
    buy,
    restore,
    manageUrl: () => purchases.manageUrl(customerInfo, profile?.plan_store),
  }), [supported, ready, plusOnSale, hasPlus, profile, packages, packagesError, loadPackages, busy, buy, restore, customerInfo]);

  return <PlusContext.Provider value={value}>{children}</PlusContext.Provider>;
}

export function usePlus() {
  const ctx = useContext(PlusContext);
  if (!ctx) throw new Error('usePlus must be inside PlusProvider');
  return ctx;
}
