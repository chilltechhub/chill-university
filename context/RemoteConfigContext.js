// context/RemoteConfigContext.js
// App-wide feature flags & remote settings (app_config table). Fetched once
// at launch so `useFeatureFlag`/`useConfigValue` are cheap, synchronous
// reads anywhere in the tree — no per-screen loading state needed.
//
// To ship a change: edit the row in Supabase (Table Editor or SQL editor).
// Every user picks it up next app launch, no build required. Call
// `refresh()` from Settings or similar if you want a manual "check for
// updates" button instead of waiting for the next cold start.
//
// Usage:
//   const enabled = useFeatureFlag('show_leaderboard', true);
//   const { message } = useConfigValue('maintenance_mode', {});
//   const isDown = useFeatureFlag('maintenance_mode', false);

import React, {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
} from 'react';
import { fetchAppConfig } from '../src/api/remoteConfigService';

const RemoteConfigContext = createContext(null);

export function RemoteConfigProvider({ children }) {
  const [config, setConfig] = useState({});
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const map = await fetchAppConfig();
    setConfig(map);
    setReady(true);
    return map;
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = useMemo(() => ({ config, ready, refresh }), [config, ready, refresh]);

  return (
    <RemoteConfigContext.Provider value={value}>
      {children}
    </RemoteConfigContext.Provider>
  );
}

export function useRemoteConfig() {
  const ctx = useContext(RemoteConfigContext);
  if (!ctx) throw new Error('useRemoteConfig must be used within a RemoteConfigProvider');
  return ctx;
}

// Convenience hook for a single boolean flag. Missing row = fallback, so a
// flag can be introduced in code before its row exists in Supabase without
// breaking anything.
export function useFeatureFlag(key, fallback = false) {
  const { config } = useRemoteConfig();
  const row = config[key];
  return row ? row.enabled : fallback;
}

// Convenience hook for a flag's payload (app_config.value), regardless of
// whether the flag itself is enabled.
export function useConfigValue(key, fallback = null) {
  const { config } = useRemoteConfig();
  const row = config[key];
  return row && row.value !== null && row.value !== undefined ? row.value : fallback;
}
