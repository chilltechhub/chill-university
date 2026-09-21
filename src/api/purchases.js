// src/api/purchases.js
// The one file that talks to RevenueCat. Everything else goes through
// context/PlusContext.js.
//
// Who has paid is decided on the server, not here: after any purchase or
// restore we ask the revenuecat-sync edge function to re-read RevenueCat and
// write profiles.plan (the column is locked against client writes — see
// 20260921120000_plus_subscriptions.sql). The store's answer on this device
// is only used to say "you're in" a few seconds before the profile catches up.
//
// Keys are RevenueCat's PUBLIC SDK keys (appl_… / goog_… / rcb_… or a
// test_… Test Store key) — they are meant to ship in the app. The secret
// sk_… key lives only in the edge function.
//
// The RevenueCat app user id is the Supabase user id. That's the whole link
// between a store receipt and a profile row, so logIn must happen before
// anything is sold.

import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

const { LOG_LEVEL, PURCHASES_ERROR_CODE } = Purchases;
import { supabase } from './supabaseClient';

export const ENTITLEMENT_ID = 'plus';

const KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  // Web has no App Store. This is a RevenueCat Web Billing key, or a Test
  // Store key while developing. Unset = web shows "subscribe in the app".
  web: process.env.EXPO_PUBLIC_REVENUECAT_WEB_KEY,
};

function apiKey() {
  return KEYS[Platform.OS] || null;
}

// Whether this build can sell anything at all.
export function purchasesSupported() {
  return !!apiKey();
}

let configuredFor = undefined; // undefined = never configured; null = anonymous

export async function identify(userId) {
  if (!purchasesSupported()) return false;
  try {
    if (configuredFor === undefined) {
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
      // Configured with the user id straight away, so no anonymous
      // RevenueCat customer is ever created for a signed-in person.
      Purchases.configure({ apiKey: apiKey(), appUserID: userId || null });
      configuredFor = userId || null;
      return true;
    }
    if (userId && configuredFor !== userId) {
      await Purchases.logIn(userId);
      configuredFor = userId;
    } else if (!userId && configuredFor) {
      await Purchases.logOut();
      configuredFor = null;
    }
    return true;
  } catch (e) {
    console.warn('purchases.identify', e?.message || e);
    return false;
  }
}

export function isEntitled(customerInfo) {
  return !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID];
}

export async function getCustomerInfo() {
  if (!configuredFor) return null;
  try { return await Purchases.getCustomerInfo(); } catch { return null; }
}

export function onCustomerInfo(listener) {
  if (!purchasesSupported() || configuredFor === undefined) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

// The Plus offering's packages, shaped for the paywall. Prices come from the
// store, already localised — never hard-code a price on the buy button.
export async function getPlusPackages() {
  if (!configuredFor) return [];
  const offerings = await Purchases.getOfferings();
  const offering = offerings.all?.[ENTITLEMENT_ID] || offerings.current;
  if (!offering) return [];
  return offering.availablePackages
    .filter(p => p.packageType === 'MONTHLY' || p.packageType === 'ANNUAL')
    .map(p => {
      const product = p.product;
      const intro = product.introPrice;
      return {
        id: p.identifier,
        kind: p.packageType === 'ANNUAL' ? 'yearly' : 'monthly',
        price: product.priceString,
        pricePerMonth: product.pricePerMonthString || null,
        // Only a FREE intro offer counts as a trial here. A discounted
        // intro price is a different promise and would need different copy.
        trialDays: intro && intro.price === 0 ? introDays(intro) : 0,
        raw: p,
      };
    })
    .sort((a, b) => (a.kind === 'yearly' ? 0 : 1) - (b.kind === 'yearly' ? 0 : 1));
}

function introDays(intro) {
  const n = intro.periodNumberOfUnits || 1;
  switch (intro.periodUnit) {
    case 'DAY': return n;
    case 'WEEK': return n * 7;
    case 'MONTH': return n * 30;
    case 'YEAR': return n * 365;
    default: return 0;
  }
}

// Resolves { ok, cancelled, customerInfo, error }. A cancelled sheet is not
// an error and must not be shown as one.
export async function buy(pkg) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg.raw);
    await syncPlan();
    return { ok: isEntitled(customerInfo), customerInfo };
  } catch (e) {
    if (e?.userCancelled || e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { ok: false, cancelled: true };
    }
    if (e?.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
      return { ok: false, pending: true };
    }
    return { ok: false, error: e?.message || 'The purchase did not go through.' };
  }
}

export async function restore() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    await syncPlan();
    return { ok: isEntitled(customerInfo), customerInfo };
  } catch (e) {
    return { ok: false, error: e?.message || 'Could not restore purchases.' };
  }
}

// Asks the server to re-read RevenueCat for the signed-in user and update
// profiles.plan. Safe to call any time; it can only ever reflect what the
// store has actually sold.
export async function syncPlan() {
  try {
    const { data, error } = await supabase.functions.invoke('revenuecat-sync', { body: {} });
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('purchases.syncPlan', e?.message || e);
    return null;
  }
}

// Only the store someone bought from can cancel it.
export function manageUrl(customerInfo, store) {
  if (customerInfo?.managementURL) return customerInfo.managementURL;
  if (store === 'play_store' || Platform.OS === 'android') {
    return 'https://play.google.com/store/account/subscriptions';
  }
  return 'https://apps.apple.com/account/subscriptions';
}
