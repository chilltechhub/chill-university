// src/components/lifeareas/actionUi.js
// Shared wording and styling for the Life Area action panel pieces.

import { formatTime } from '../../api/areaActionsService';

// Dark ink on an area colour. Every area colour clears 4.5:1 against it,
// which white text on the lighter ones (Mental, Social) does not.
export const INK = '#12161f';

const SCREEN_NAMES = {
  WayfinderScreen: 'Wayfinder',
  ProjectsScreen: 'the Workshop',
  CaptureInbox: 'Capture',
  PlannerScreen: 'the Planner',
};

// Plainer words for under-13s, same meaning.
const TIER_LABELS = {
  quick: { default: '2-minute win', kid: 'Takes 2 minutes' },
  learn: { default: '1-minute read', kid: 'Quick read' },
  habit: { default: 'Habit', kid: 'Every day' },
  step:  { default: 'Step', kid: 'Do it today' },
};

export const TIER_ICONS = { quick: 'flash', learn: 'book', habit: 'repeat', step: 'flag' };

export function tierLabel(tier, band) {
  const l = TIER_LABELS[tier] || TIER_LABELS.step;
  return band === 'kid' ? l.kid : l.default;
}

// Deck accents: quick = teal, learn = gold, habit/step = the area's own.
export function tierColor(tier, c, areaColor) {
  if (tier === 'quick') return c.teal;
  if (tier === 'learn') return c.gold;
  return areaColor;
}

export function buttonLabel(action, band) {
  const p = action.payload || {};
  switch (action.handler) {
    case 'read': return 'Read it · 1 min';
    case 'timer': return `Start a ${p.minutes}-minute timer`;
    case 'task': return 'Add to today’s tasks';
    case 'routine': return 'Add to my planner';
    case 'screen': return `Open ${SCREEN_NAMES[p.screen] || 'it'}`;
    case 'link': return 'Open it';
    case 'reminder': return `Remind me at ${formatTime(p.time)}`;
    default: return band === 'kid' ? 'I did it' : 'I did this';
  }
}

export function buttonIcon(action) {
  switch (action.handler) {
    case 'read': return 'book-outline';
    case 'timer': return 'timer-outline';
    case 'task': return 'add-circle-outline';
    case 'routine': return 'calendar-outline';
    case 'screen': return 'arrow-forward-circle-outline';
    case 'link': return 'open-outline';
    case 'reminder': return 'notifications-outline';
    default: return 'checkmark-circle-outline';
  }
}
