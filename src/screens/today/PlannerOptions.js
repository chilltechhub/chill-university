// src/screens/today/PlannerOptions.js
// The Planner's options: what's in the ⋯ menu, the life-area filter sheet,
// and the sheet a guest gets for the one thing that needs an account.
// Moved out of PlannerScreen.js for the shake-up
// (docs/shake-up-plan-2026-10-21.md P1).

import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import SignInPrompt from '../../components/SignInPrompt';
import { AREAS } from '../../api/plannerService';

/**
 * The ⋯ menu. A guest keeps everything that works on the plans kept on the
 * phone; "Add from ideas" and the weekly review read the account, so they
 * wait for one, and "Phone calendar" says why it needs one.
 */
//
// Today (shake-up P3) adds its own: "What's next?" (the FAB's, which steps
// aside on Today), the life-area filter (Calm keeps it in here), Edit layout
// and Calm/Full. "Add from ideas" moves to Today's + Add sheet (noIdeas).
export function plannerMenuItems({
  view, timeMode, guest, profileCount, showingAll,
  onIdeas, onToggleTime, onPhoneCalendar, onExport, onDuplicates, onWeeklyReview, onToggleScope,
  onWhatsNext, onFilter, areaCount = 0, onEditLayout, onCalm, calm, noIdeas = false,
}) {
  return [
    onWhatsNext && { label: "What's next?", icon: 'chatbubble-ellipses-outline', onPress: onWhatsNext },
    onFilter && { label: areaCount ? `Life areas (${areaCount} on)` : 'Filter by life area', icon: 'funnel-outline', onPress: onFilter },
    !guest && !noIdeas && { label: 'Add from ideas', icon: 'grid-outline', onPress: onIdeas },
    view === 'Daily' && {
      label: timeMode ? 'Show as a list' : 'Show by time of day',
      icon: timeMode ? 'list' : 'time-outline',
      onPress: onToggleTime,
    },
    { label: 'Phone calendar', icon: 'phone-portrait-outline', onPress: onPhoneCalendar },
    { label: 'Add to my calendar', icon: 'calendar-outline', onPress: onExport },
    { label: 'Tidy up duplicates', icon: 'copy-outline', onPress: onDuplicates },
    !guest && { label: 'Weekly review', icon: 'stats-chart-outline', onPress: onWeeklyReview },
    onEditLayout && view === 'Daily' && { label: 'Edit layout', icon: 'apps-outline', onPress: onEditLayout },
    onCalm && { label: calm ? 'Show everything (Full)' : 'Calm view', icon: 'leaf-outline', onPress: onCalm },
    // Widen across profiles: only once there's more than one.
    profileCount > 1 && {
      label: showingAll ? 'Show this profile only' : 'Show all profiles',
      icon: showingAll ? 'person-outline' : 'layers-outline',
      onPress: onToggleScope,
    },
  ];
}

export function AreaFilterSheet({ visible, onClose, activeAreas, onToggle, c, t, s }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <TouchableOpacity activeOpacity={1} style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: s.lg, paddingBottom: s.xxl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s.md }}>
            <Text style={{ flex: 1, fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>Show life areas</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Done">
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.teal }}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
            <TouchableOpacity onPress={() => onToggle('all')} accessibilityRole="button" accessibilityState={{ selected: activeAreas.size === 0 }}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: activeAreas.size === 0 ? c.gold : c.border, backgroundColor: activeAreas.size === 0 ? c.gold + '22' : 'transparent' }}>
              <Text style={{ fontSize: t.sm, fontWeight: '600', color: activeAreas.size === 0 ? c.gold : c.text3 }}>All</Text>
            </TouchableOpacity>
            {Object.entries(AREAS).map(([key, area]) => {
              const on = activeAreas.has(key);
              return (
                <TouchableOpacity key={key} onPress={() => onToggle(key)} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: on ? area.color : c.border, backgroundColor: on ? area.color + '22' : 'transparent' }}>
                  <Text style={{ fontSize: 13 }}>{area.emoji}</Text>
                  <Text style={{ fontSize: t.sm, fontWeight: '600', color: on ? area.color : c.text3 }}>{area.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// Copying plans to the phone's calendar keeps them in step from the account,
// so a guest is asked to sign in for that, and only that.
export function GuestSignInSheet({ visible, onClose, icon, title, body, c, t, s }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <TouchableOpacity activeOpacity={1} style={{ height: 360, backgroundColor: c.bg0, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' }}>
          <SignInPrompt icon={icon} title={title} body={body} />
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Not now"
            style={{ alignItems: 'center', paddingVertical: s.md, paddingBottom: s.xl }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text3 }}>Not now</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
