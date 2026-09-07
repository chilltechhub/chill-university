// src/logic/useFolders.js
// A small local-first folder registry — same AsyncStorage-backed pattern as
// useGradeLevel.js / useCharacterLoadout.js. `namespace` keeps each
// screen's folders separate (e.g. 'research', 'resources'); `userId` keeps
// them separate per account on a shared device.
//
// Folders themselves are just labels the user manages here; which entry
// belongs to which folder is stored on the entry itself (captures.url_meta.folder)
// by the screen using this hook, the same way starred/visits already are.

import { useState, useEffect, useCallback } from 'react';
import { cacheRead, cacheWrite } from '../api/offlineCache';

export const FOLDER_COLORS = ['#5c9ce0', '#4caf7d', '#9a6fd6', '#c9a84c', '#d97a7a', '#3fb8cf'];

// `legacyNamespaces` is for screens that absorbed other screens: the first
// time the new namespace is read and has nothing stored, the old namespaces'
// folders are merged into it and saved. Folder ids are kept exactly as they
// were, so every item still pointing at one (captures.url_meta.folder) lands
// in the same folder it was already in. Two folders that happened to share a
// name across old screens both survive — dropping either would orphan its
// items.
export default function useFolders(namespace, userId, legacyNamespaces = []) {
  const key = `folders:${namespace}:${userId || 'anon'}`;
  const legacyKey = legacyNamespaces.join(',');
  const [folders, setFolders] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    setReady(false);
    (async () => {
      const saved = await cacheRead(key);
      let next = Array.isArray(saved) ? saved : null;

      if (!next && legacyKey) {
        const legacy = await Promise.all(
          legacyKey.split(',').map(ns => cacheRead(`folders:${ns}:${userId || 'anon'}`))
        );
        const seen = new Set();
        next = legacy.flatMap(list => (Array.isArray(list) ? list : []))
          .filter(f => f && f.id && !seen.has(f.id) && seen.add(f.id));
        if (next.length) await cacheWrite(key, next);
      }

      if (!alive) return;
      setFolders(next || []);
      setReady(true);
    })();
    return () => { alive = false; };
  }, [key, legacyKey]);

  const persist = useCallback((next) => {
    setFolders(next);
    cacheWrite(key, next);
  }, [key]);

  const createFolder = useCallback((name, color) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;
    const folder = {
      id: `f_${Date.now()}_${Math.round(Math.random() * 1000)}`,
      name: trimmed,
      color: color || FOLDER_COLORS[folders.length % FOLDER_COLORS.length],
    };
    persist([...folders, folder]);
    return folder.id;
  }, [folders, persist]);

  const renameFolder = useCallback((id, name, color) => {
    persist(folders.map(f => (f.id === id ? { ...f, name: (name || '').trim() || f.name, color: color || f.color } : f)));
  }, [folders, persist]);

  const deleteFolder = useCallback((id) => {
    persist(folders.filter(f => f.id !== id));
  }, [folders, persist]);

  return { folders, ready, createFolder, renameFolder, deleteFolder };
}
