// src/components/planner/PlacementEditor.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { createInstance, generateInstances, AREAS } from '../api/plannerService';

const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getUpcomingDates(cadence) {
  const today = new Date();
  const dates = [];
  if (cadence === 'daily') {
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
  } else if (cadence === 'weekly') {
    for (let i = 0; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i * 7);
      const day = d.getDay();
      d.setDate(d.getDate() + (day === 1 ? 0 : day === 0 ? 1 : 8 - day));
      dates.push(d);
    }
  } else if (cadence === 'monthly') {
    for (let i = 0; i < 3; i++) {
      dates.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
    }
  }
  return dates;
}

function toISO(d) { return d.toISOString().split('T')[0]; }

// ─── Single component row ─────────────────────────────────────────────────────
function ComponentPlacer({ component, userId, area, onPlace, c, t, s }) {
  const [day,       setDay]       = useState(null);
  const [timeInput, setTimeInput] = useState('');
  const [placing,   setPlacing]   = useState(false);
  const [placed,    setPlaced]    = useState(false);

  const dates = getUpcomingDates(component.cadence);

  const handlePlace = async () => {
    if (!day) return;
    setPlacing(true);
    try {
      await generateInstances(userId, component);
      if (component.type === 'timed_block' && timeInput) {
        await createInstance(userId, component, toISO(day), timeInput);
      }
      setPlaced(true);
      onPlace(component.id);
    } catch (e) {
      console.warn('ComponentPlacer error', e);
    }
    setPlacing(false);
  };

  return (
    <View style={{
      borderRadius: 10, marginBottom: 8, borderWidth: 0.5,
      borderLeftWidth: 3, overflow: 'hidden',
      backgroundColor: c.bg1,
      borderColor: placed ? area.color : c.border,
      borderLeftColor: area.color,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: area.color }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: placed ? c.text3 : c.text1,
            textDecorationLine: placed ? 'line-through' : 'none' }}>
            {component.title}
          </Text>
          <Text style={{ fontSize: 10, marginTop: 2, textTransform: 'uppercase',
            letterSpacing: 0.5, color: area.color }}>
            {component.cadence} · {component.type}
            {component.duration_minutes ? ` · ${component.duration_minutes}m` : ''}
          </Text>
        </View>
        {placed && <Ionicons name="checkmark-circle" size={20} color={area.color} />}
      </View>

      {/* Placement controls */}
      {!placed && (
        <View style={{ padding: 12, paddingTop: 0 }}>
          <Text style={{ fontSize: 11, marginBottom: 6, color: c.text3 }}>
            {component.cadence === 'daily'  ? 'Start from which day?' :
             component.cadence === 'weekly' ? 'Which week to start?' :
                                             'Start from which month?'}
          </Text>

          {/* Day picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {dates.map((d, i) => {
                const isSel = day && toISO(d) === toISO(day);
                return (
                  <TouchableOpacity key={i} onPress={() => setDay(d)}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 6,
                      borderRadius: 8, borderWidth: 1,
                      borderColor: isSel ? area.color : c.border,
                      backgroundColor: isSel ? area.color + '22' : 'transparent',
                    }}>
                    <Text style={{ fontSize: 11, fontWeight: '600',
                      color: isSel ? area.color : c.text3 }}>
                      {component.cadence === 'monthly'
                        ? d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                        : `${DAYS_OF_WEEK[d.getDay()]} ${d.getDate()}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Time input for timed blocks */}
          {component.type === 'timed_block' && (
            <TextInput
              style={{
                borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 12,
                marginBottom: 8, color: c.text1,
                borderColor: c.border, backgroundColor: c.bg0,
              }}
              value={timeInput}
              onChangeText={setTimeInput}
              placeholder="Time (optional, e.g. 07:00)"
              placeholderTextColor={c.text4}
              keyboardType="numbers-and-punctuation"
            />
          )}

          {/* Schedule button */}
          <TouchableOpacity
            onPress={handlePlace}
            disabled={!day || placing}
            style={{
              borderRadius: 8, padding: 10, alignItems: 'center',
              backgroundColor: day ? area.color : c.bg2,
              opacity: (!day || placing) ? 0.6 : 1,
            }}>
            {placing
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={{ fontSize: 12, fontWeight: '700',
                  color: day ? '#fff' : c.text4 }}>
                  {component.cadence === 'daily'  ? 'Schedule (30 days)' :
                   component.cadence === 'weekly' ? 'Schedule (12 weeks)' :
                                                    'Schedule (6 months)'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main PlacementEditor ─────────────────────────────────────────────────────
export default function PlacementEditor({ visible, userId, components, areaKey, onDone, onCancel }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  // ALL hooks must be called before any conditional return
  const [placed, setPlaced] = useState(new Set());

  const area      = AREAS[areaKey] || AREAS.physical;
  const safeComps = components || [];
  const allPlaced = placed.size >= safeComps.length && safeComps.length > 0;

  const handlePlace = (componentId) => {
    setPlaced(prev => new Set([...prev, componentId]));
  };

  // Empty guard AFTER hooks


  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: c.bg0 }}>

        {/* Header */}
        <View style={{
          backgroundColor: c.headerBg,
          padding: s.lg, paddingTop: s.xxl,
          borderBottomWidth: 0.5, borderBottomColor: c.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, marginBottom: s.sm }}>
            <Text style={{ fontSize: 24 }}>{area.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>
                Place {area.label} Components
              </Text>
              <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>
                Choose when each item appears on your agenda
              </Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={{ padding: 6 }}>
              <Ionicons name="close" size={20} color={c.text3} />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          {safeComps.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
              <View style={{ flex: 1, height: 4, backgroundColor: c.bg2, borderRadius: 2, overflow: 'hidden' }}>
                <View style={{
                  height: 4, borderRadius: 2,
                  backgroundColor: area.color,
                  width: `${(placed.size / safeComps.length) * 100}%`,
                }} />
              </View>
              <Text style={{ fontSize: t.xs, color: area.color, fontWeight: t.bold }}>
                {placed.size}/{safeComps.length}
              </Text>
            </View>
          )}
        </View>

        {/* Component list */}
        <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 120 }}>
          {safeComps.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 36, marginBottom: s.lg }}>📋</Text>
              <Text style={{ fontSize: t.md, color: c.text3 }}>No components to place</Text>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: t.xs, color: c.text4, marginBottom: s.md, lineHeight: 16 }}>
                Pick a start day for each item. Daily items repeat for 30 days, weekly for 12 weeks, monthly for 6 months.
              </Text>
              {safeComps.map(comp => (
                <ComponentPlacer
                  key={comp.id}
                  component={comp}
                  userId={userId}
                  area={area}
                  onPlace={handlePlace}
                  c={c} t={t} s={s} r={r}
                />
              ))}
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: c.bg1, padding: s.lg,
          borderTopWidth: 0.5, borderTopColor: c.border,
          flexDirection: 'row', gap: s.sm,
        }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1, padding: s.md, alignItems: 'center',
              backgroundColor: c.bg0, borderRadius: r.md,
              borderWidth: 0.5, borderColor: c.border,
            }}>
            <Text style={{ color: c.text3, fontSize: t.sm }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDone}
            style={{
              flex: 2, padding: s.md, alignItems: 'center',
              backgroundColor: allPlaced ? area.color : c.teal,
              borderRadius: r.md,
            }}>
            <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>
              {allPlaced ? '✓ Done — go to agenda' : 'Go to agenda →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
