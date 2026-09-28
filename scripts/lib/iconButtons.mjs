// scripts/lib/iconButtons.mjs
// Finds pressables whose only content is an icon — the buttons a screen reader
// announces as nothing unless they carry an accessibilityLabel. Shared by
// scripts/check-a11y.mjs (fails on unlabeled ones) and the one-off codemod
// that labelled the existing ones.

const TAGS = ['TouchableOpacity', 'Pressable', 'TouchableHighlight'];
const ICON_RE = /<(Ionicons|Feather|MaterialIcons|MaterialCommunityIcons)\b[^>]*?\bname=(?:"([^"]+)"|'([^']+)'|\{([^}]*)\})/;

// End of a JSX opening tag starting at `start` (the '<'): the '>' at brace
// depth 0 outside strings. Returns { end, selfClosing } or null.
function openingTagEnd(src, start) {
  let depth = 0;
  let quote = null;
  for (let i = start + 1; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { if (depth > 0 || ch !== '`') quote = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === '>' && depth === 0) return { end: i, selfClosing: src[i - 1] === '/' };
  }
  return null;
}

// Index of the matching `</Tag>` for an element whose opening tag ends at `from`.
function closingTagIndex(src, tag, from) {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = from;
  let depth = 1;
  let m;
  while ((m = re.exec(src))) {
    if (m[0].startsWith('</')) { depth--; if (depth === 0) return m.index; }
    else {
      const o = openingTagEnd(src, m.index);
      if (o && !o.selfClosing) depth++;
    }
  }
  return -1;
}

/**
 * Every pressable in `src` whose children contain an icon and no <Text> and no
 * bare text. Returns [{ tag, start, openEnd, line, iconName (null if dynamic),
 * labelled, hasRole, opening }].
 */
export function findIconButtons(src) {
  const out = [];
  const re = new RegExp(`<(${TAGS.join('|')})\\b`, 'g');
  let m;
  while ((m = re.exec(src))) {
    const tag = m[1];
    const o = openingTagEnd(src, m.index);
    if (!o || o.selfClosing) continue;
    const close = closingTagIndex(src, tag, o.end + 1);
    if (close < 0) continue;
    const children = src.slice(o.end + 1, close);
    const icon = children.match(ICON_RE);
    if (!icon) continue;
    if (/<Text\b|<Animated\.Text\b|<TextInput\b/.test(children)) continue;
    // Bare JSX text between tags (not whitespace, not {expr}).
    const stripped = children.replace(/\{[^{}]*\}/g, '').replace(/<[^>]*>/g, '');
    if (/[A-Za-z0-9]/.test(stripped)) continue;
    const opening = src.slice(m.index, o.end + 1);
    out.push({
      tag,
      start: m.index,
      openEnd: o.end,
      line: src.slice(0, m.index).split('\n').length,
      iconName: icon[2] || icon[3] || null,
      labelled: /\baccessibilityLabel=|\baria-label=/.test(opening),
      hasRole: /\baccessibilityRole=/.test(opening),
      opening,
    });
  }
  return out;
}

// A label for an icon name, or null when there's no confident one.
const LABELS = {
  'chevron-back': 'Back', 'arrow-back': 'Back', 'close': 'Close', 'close-circle': 'Close',
  'add': 'Add', 'add-circle': 'Add', 'trash': 'Delete', 'create': 'Edit', 'pencil': 'Edit',
  'settings': 'Settings', 'share': 'Share', 'share-social': 'Share', 'search': 'Search',
  'ellipsis-horizontal': 'More options', 'ellipsis-vertical': 'More options',
  'refresh': 'Refresh', 'copy': 'Copy', 'checkmark': 'Done', 'checkmark-circle': 'Done',
  'chevron-forward': 'Next', 'arrow-forward': 'Next', 'chevron-down': 'Show more', 'chevron-up': 'Show less',
  'star': 'Favorite', 'heart': 'Like', 'play': 'Play', 'pause': 'Pause', 'stop': 'Stop',
  'download': 'Download', 'bookmark': 'Save', 'link': 'Open link', 'calendar': 'Calendar',
  'time': 'Time', 'notifications': 'Notifications', 'filter': 'Filter', 'funnel': 'Filter',
  'information-circle': 'More info', 'help-circle': 'Help', 'eye': 'Show', 'eye-off': 'Hide',
  'lock-closed': 'Lock', 'person': 'Profile', 'home': 'Home', 'send': 'Send', 'mic': 'Record',
  'camera': 'Camera', 'image': 'Add image', 'attach': 'Attach', 'stats-chart': 'Stats',
  'bar-chart': 'Stats', 'grid': 'Layout', 'list': 'List view', 'swap-vertical': 'Reorder',
  'reorder-three': 'Reorder', 'move': 'Move', 'remove': 'Remove', 'remove-circle': 'Remove',
  'flag': 'Report', 'ban': 'Block', 'archive': 'Archive', 'sparkles': 'Fill with AI',
  'alarm': 'Reminder', 'open': 'Open', 'expand': 'Expand', 'contract': 'Collapse',
  'arrow-up': 'Move up', 'arrow-down': 'Move down', 'caret-up': 'Move up', 'caret-down': 'Move down',
  'arrow-undo': 'Undo', 'arrow-redo': 'Redo', 'shuffle': 'Shuffle', 'volume-high': 'Sound on',
  'volume-mute': 'Sound off', 'log-out': 'Sign out', 'cloud-upload': 'Upload', 'duplicate': 'Duplicate',
};
export function labelForIcon(name) {
  if (!name) return null;
  const base = name.replace(/-(outline|sharp)$/, '');
  return LABELS[base] || null;
}
