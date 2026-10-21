// src/screens/today/SidePanel.js
// "Add from ideas": starter sets and single ideas by life area. Moved out
// of PlannerScreen.js for the shake-up (docs/shake-up-plan-2026-10-21.md P1).

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AREAS, getPresetComponents, generateInstances } from '../../api/plannerService';
import { PANEL_W } from './plannerShared';

// ─── Side panel (add components) ─────────────────────────────────────────────
export default function SidePanel({ visible, onClose, userId, onAdded, c, t, s, r }) {
  const slideX  = useRef(new Animated.Value(PANEL_W)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [selectedArea, setArea]       = useState(null);
  const [components,   setComponents] = useState([]);
  const [loading,      setLoading]    = useState(false);
  const [scheduled,    setScheduled]  = useState(new Set());
  const [busy,         setBusy]       = useState({});

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideX, { toValue: visible ? 0 : PANEL_W, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
    if (!visible) setTimeout(() => { setArea(null); setComponents([]); setScheduled(new Set()); }, 250);
  }, [visible]);

  const selectArea = async (key) => {
    setArea(key);
    setLoading(true);
    try {
      const comps = await getPresetComponents(AREAS[key].preset);
      setComponents(comps || []);
    } catch (e) { console.warn('SidePanel', e); }
    setLoading(false);
  };

  const schedule = async (comp) => {
    if (scheduled.has(comp.id) || busy[comp.id]) return;
    setBusy(prev => ({ ...prev, [comp.id]: true }));
    try {
      await generateInstances(userId, comp);
      setScheduled(prev => new Set([...prev, comp.id]));
      onAdded(comp);
    } catch (e) { console.warn('schedule', e); }
    setBusy(prev => ({ ...prev, [comp.id]: false }));
  };

  const scheduleAll = async () => {
    for (const comp of components) {
      if (!scheduled.has(comp.id)) await schedule(comp);
    }
  };

  const areaObj   = selectedArea ? AREAS[selectedArea] : null;
  const areaColor = areaObj?.color || c.teal;
  const byGroup   = { daily: [], weekly: [], monthly: [] };
  components.forEach(comp => { if (byGroup[comp.cadence]) byGroup[comp.cadence].push(comp); });

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 100 }}>
      <Animated.View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#000', opacity: Animated.multiply(opacity, 0.5) }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: PANEL_W, backgroundColor: c.bg0, transform: [{ translateX: slideX }], shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 20 }}>
        {/* Header */}
        <View style={{ backgroundColor: c.headerBg, padding: s.lg, borderBottomWidth: 0.5, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: s.md }}>
          <TouchableOpacity accessibilityLabel="Next" accessibilityRole="button" onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="chevron-forward" size={22} color={c.text3} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>Add to Planner</Text>
            <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Tap any item to schedule it</Text>
          </View>
        </View>

        <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingBottom: 40 }}>
          {!selectedArea ? (
            <View style={{ padding: s.lg, gap: s.sm }}>
              {Object.entries(AREAS).filter(([, a]) => a.preset).map(([key, area]) => (
                <TouchableOpacity key={key} onPress={() => selectArea(key)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, borderWidth: 0.5, borderColor: c.border }}>
                  <Text style={{ fontSize: 26 }}>{area.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>{area.label}</Text>
                    <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Daily, weekly & monthly</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.text4} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={{ padding: s.lg }}>
              <TouchableOpacity onPress={() => { setArea(null); setComponents([]); setScheduled(new Set()); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.lg }}>
                <Ionicons name="chevron-back" size={16} color={c.teal} />
                <Text style={{ fontSize: t.xs, color: c.teal, fontWeight: t.semibold }}>All areas</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.md }}>
                <Text style={{ fontSize: 22 }}>{areaObj?.emoji}</Text>
                <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: areaColor }}>{areaObj?.label}</Text>
              </View>

              {loading ? <ActivityIndicator color={areaColor} style={{ marginTop: s.xl }} /> : (
                <>
                  {components.length > 0 && scheduled.size < components.length && (
                    <TouchableOpacity onPress={scheduleAll}
                      style={{ backgroundColor: areaColor, borderRadius: r.md, padding: s.md, alignItems: 'center', marginBottom: s.lg }}>
                      <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Schedule all {components.length}</Text>
                    </TouchableOpacity>
                  )}
                  {scheduled.size === components.length && components.length > 0 && (
                    <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, alignItems: 'center', marginBottom: s.lg, borderWidth: 1, borderColor: c.teal }}>
                      <Text style={{ color: c.teal, fontWeight: t.bold }}>✓ All scheduled</Text>
                    </View>
                  )}
                  {['daily','weekly','monthly'].map(cad => {
                    const items = byGroup[cad];
                    if (!items.length) return null;
                    return (
                      <View key={cad} style={{ marginBottom: s.lg }}>
                        <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>{cad}</Text>
                        {items.map(comp => {
                          const done = scheduled.has(comp.id);
                          const isBusy = busy[comp.id];
                          return (
                            <TouchableOpacity key={comp.id} onPress={() => schedule(comp)} disabled={done || isBusy}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: done ? areaColor : c.border, borderLeftWidth: 3, borderLeftColor: areaColor, opacity: done ? 0.6 : 1 }}>
                              {isBusy
                                ? <ActivityIndicator size="small" color={areaColor} style={{ width: 20 }} />
                                : <Ionicons name={done ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={done ? areaColor : c.text4} />
                              }
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: t.xs, fontWeight: t.medium, color: done ? c.text3 : c.text1, textDecorationLine: done ? 'line-through' : 'none' }}>{comp.title}</Text>
                                {comp.duration_minutes && <Text style={{ fontSize: 11, color: areaColor, marginTop: 2 }}>⏱ {comp.duration_minutes}m</Text>}
                              </View>
                              {done && <Text style={{ fontSize: 11, color: areaColor, fontWeight: t.bold }}>Added</Text>}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
