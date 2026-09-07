// context/CommandPaletteContext.js
// Open/close state for the global search overlay (src/components/
// CommandPalette.js), plus the keyboard shortcut that opens it.
//
// It's a context rather than local state because two very different places
// need to open the same overlay: the keyboard (Cmd/Ctrl+K on web) and the
// floating action button's "Search" entry, which lives in a component two
// levels above the navigator. Same reasoning as FabPositionContext.js.

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

const CommandPaletteContext = createContext({
  open: false,
  openPalette: () => {},
  closePalette: () => {},
  togglePalette: () => {},
});

export function CommandPaletteProvider({ children }) {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);
  const togglePalette = useCallback(() => setOpen((v) => !v), []);

  // Cmd+K / Ctrl+K anywhere, the shortcut people already expect from every
  // other tool that has one. Web only — there's no hardware keyboard to
  // listen to on a phone, which is why the FAB carries a visible Search
  // entry as well.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    // Capture phase, so the shortcut still works while a text field has
    // focus — React Native Web's TextInput stops key events from bubbling.
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, openPalette, closePalette, togglePalette }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export const useCommandPalette = () => useContext(CommandPaletteContext);
