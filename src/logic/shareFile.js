// src/logic/shareFile.js
// Hand the person a file: a download on web, the share sheet with a real
// file on a phone (Save to Files, Calendar, Drive, Mail...). Used by Export
// My Data (.json) and Add to my calendar (.ics).
//
// The phone path writes the file to the cache folder with expo-file-system
// and shares it with expo-sharing. A build from before those modules were
// added falls back to sharing the text itself, which small files survive.
import { Platform, Share } from 'react-native';

function nativeFileModules() {
  if (Platform.OS === 'web') return null;
  try {
    return { fs: require('expo-file-system'), sharing: require('expo-sharing') };
  } catch {
    return null;
  }
}

// Resolves 'downloaded' (web), 'shared', or 'shared-text' (old build fallback).
export async function shareFile({ filename, content, mimeType, uti, dialogTitle }) {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }

  const mods = nativeFileModules();
  if (mods && await mods.sharing.isAvailableAsync()) {
    const file = new mods.fs.File(mods.fs.Paths.cache, filename);
    file.create({ overwrite: true });
    file.write(content);
    await mods.sharing.shareAsync(file.uri, { mimeType, UTI: uti, dialogTitle });
    return 'shared';
  }

  await Share.share({ title: filename, message: content });
  return 'shared-text';
}
