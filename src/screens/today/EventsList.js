// src/screens/today/EventsList.js
// Events saved in the app's own calendar (calendar_events, added from Home's
// calendar). Home's Today and Calm's week always showed them; the Planner's
// Day never did, so the same day looked different depending on where you
// opened it. Drawn like the phone's events above the plan.

import React from 'react';
import { View, Text } from 'react-native';
import { fmt12 } from '../../logic/plannerLayout';

export default function EventsList({ events, c, t, s, r }) {
  if (!events?.length) return null;
  return (
    <View style={{ marginHorizontal: s.lg, marginBottom: s.md }} accessibilityLabel={`${events.length} event${events.length === 1 ? '' : 's'}`}>
      <Text style={{ fontSize: 12, fontWeight: t.bold, color: c.text3, marginBottom: 6 }}>EVENTS</Text>
      {events.map(ev => (
        <View key={ev.id} accessibilityLabel={`${ev.title}, ${ev.all_day || !ev.time ? 'all day' : fmt12(ev.time)}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, padding: s.md, marginBottom: 6, borderRadius: r.md,
            backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: c.teal }}>
          <Text style={{ width: 68, fontSize: 12, color: c.text2, fontWeight: '600' }}>{ev.all_day || !ev.time ? 'All day' : fmt12(ev.time)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.sm, color: c.text1 }} numberOfLines={1}>{ev.title}</Text>
            {!!ev.description && <Text style={{ fontSize: 11, color: c.text3 }} numberOfLines={1}>{ev.description}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}
