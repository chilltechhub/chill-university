// src/screens/PlannerScreen.js
// Main planner — daily/weekly/monthly views + area filter + preset setup

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, ActivityIndicator, RefreshControl,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/supabaseClient';
import {
  AREAS, CADENCES,
  getCheckin, getInstances,
  getSystemComponents, getPresetComponents,
  getUserSubscriptions, subscribeToPreset,
  generateInstances,
} from '../api/plannerService';
import DailyCheckin from '../components/DailyCheckin';
import AgendaItem   from '../components/AgendaItem';
import PlacementEditor from '../components/PlacementEditor';
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(false);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toISO(d)  { return d.toISOString().split('T')[0]; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

function getWeekDays(anchor) {
  const base = new Date(anchor);
  base.setDate(base.getDate() - base.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(base, i));
}

const VIEWS = ['Daily', 'Weekly', 'Monthly'];
const DAY_SHORT = ['S','M','T','W','T','F','S'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Area filter pill ─────────────────────────────────────────────────────────
function AreaFilter({ activeAreas, onToggle, c, t, s, r }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: s.lg, paddingVertical: s.sm, gap: s.sm }}>
      <TouchableOpacity
        style={[f_styles.chip, { borderColor: activeAreas.size === 0 ? c.gold : c.border, backgroundColor: activeAreas.size === 0 ? c.goldLight : 'transparent' }]}
        onPress={() => onToggle('all')}
      >
        <Text style={[f_styles.chipText, { color: activeAreas.size === 0 ? c.gold : c.text3 }]}>All</Text>
      </TouchableOpacity>
      {Object.entries(AREAS).map(([key, area]) => {
        const active = activeAreas.has(key);
        return (
          <TouchableOpacity key={key}
            style={[f_styles.chip, { borderColor: active ? area.color : c.border, backgroundColor: active ? area.color + '22' : 'transparent' }]}
            onPress={() => onToggle(key)}
          >
            <Text style={{ fontSize: 13 }}>{area.emoji}</Text>
            <Text style={[f_styles.chipText, { color: active ? area.color : c.text3 }]}>{area.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
const f_styles = StyleSheet.create({
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: '600' },
});

// ─── Setup sheet — pick presets to add ───────────────────────────────────────
function SetupSheet({ userId, onDone, c, t, s, r }) {
  const [selectedArea,     setSelectedArea]     = useState(null);
  const [presetComponents, setPresetComponents] = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [showPlacement,    setShowPlacement]    = useState(false);

  const availableAreas = Object.entries(AREAS).filter(([, a]) => a.preset);

  const selectArea = async (key) => {
    setSelectedArea(key);
    setLoading(true);
    const area = AREAS[key];
    const components = await getPresetComponents(area.preset);
    setPresetComponents(components);
    setLoading(false);
  };

  const handlePresetAdd = () => {
    if (!selectedArea || !presetComponents.length) return;
    setShowPlacement(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <View style={{ backgroundColor: c.headerBg, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>Set Up Your Planner</Text>
        <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 4 }}>Pick a life area to add a starter preset</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: s.lg, gap: s.sm, paddingBottom: 40 }}>
        <Text style={{ fontSize: t.xs, color: c.text4, lineHeight: 18, marginBottom: s.md }}>
          Each preset adds a curated set of daily, weekly, and monthly components for that life area. You'll place each one on your agenda before they go live.
        </Text>

        {availableAreas.map(([key, area]) => (
          <TouchableOpacity
            key={key}
            style={{ backgroundColor: c.bg1, borderRadius: 12, padding: s.lg, borderWidth: selectedArea === key ? 1.5 : 0.5, borderColor: selectedArea === key ? area.color : c.border, flexDirection: 'row', alignItems: 'center', gap: s.md }}
            onPress={() => selectArea(key)}
          >
            <Text style={{ fontSize: 28 }}>{area.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>{area.label} Starter</Text>
              <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Daily, weekly & monthly components</Text>
            </View>
            {selectedArea === key && <Ionicons name="checkmark-circle" size={22} color={area.color} />}
          </TouchableOpacity>
        ))}

        {loading && <ActivityIndicator color={c.teal} style={{ marginTop: s.lg }} />}

        {selectedArea && presetComponents.length > 0 && !loading && (
          <View style={{ backgroundColor: c.bg1, borderRadius: 12, padding: s.lg, borderWidth: 0.5, borderColor: AREAS[selectedArea].color + '55' }}>
            <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: AREAS[selectedArea].color, marginBottom: s.md, textTransform: 'uppercase', letterSpacing: 1 }}>
              Included — {presetComponents.length} components
            </Text>
            {presetComponents.map(comp => (
              <View key={comp.id} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: AREAS[selectedArea].color }} />
                <Text style={{ flex: 1, fontSize: t.xs, color: c.text2 }}>{comp.title}</Text>
                <Text style={{ fontSize: 10, color: AREAS[selectedArea].color, textTransform: 'uppercase' }}>{comp.cadence}</Text>
              </View>
            ))}
          </View>
        )}

        {selectedArea && presetComponents.length > 0 && !loading && (
          <TouchableOpacity
            style={{ backgroundColor: AREAS[selectedArea].color, borderRadius: 12, padding: s.lg, alignItems: 'center', marginTop: s.sm }}
            onPress={handlePresetAdd}
          >
            <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.md }}>
              Add {AREAS[selectedArea].label} Preset →
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onDone} style={{ padding: s.lg, alignItems: 'center' }}>
          <Text style={{ fontSize: t.sm, color: c.text3 }}>Skip for now — I'll add later</Text>
        </TouchableOpacity>
      </ScrollView>

      {showPlacement && (
        <PlacementEditor
  visible={showPlacement}
  userId={userId}
  components={presetComponents}
  areaKey={selectedArea}
  onDone={() => { setShowPlacement(false); onDone(); }}
  onCancel={() => setShowPlacement(false)}
/>
      )}
    </View>
  );
}

// ─── Daily view ───────────────────────────────────────────────────────────────
function DailyView({ userId, date, activeAreas, c, t, s, r }) {
  const [instances,  setInstances]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, [date, activeAreas]);

  const load = async () => {
    setLoading(true);
    try {
      let data = await getInstances(userId, { date: toISO(date) });
      if (activeAreas.size > 0) data = data.filter(i => activeAreas.has(i.area));
      setInstances(data);
    } catch {}
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleUpdate = (updated) => {
    setInstances(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
  };

  // Group by area
  const grouped = Object.entries(AREAS)
    .filter(([key]) => activeAreas.size === 0 || activeAreas.has(key))
    .map(([key, area]) => ({
      key, area,
      items: instances.filter(i => i.area === key && !i.skipped),
    }))
    .filter(g => g.items.length > 0);

  const completed = instances.filter(i => i.completed).length;
  const total     = instances.filter(i => !i.skipped).length;

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={c.teal} />;

  return (
    <ScrollView
      contentContainerStyle={{ padding: s.lg, paddingBottom: 80 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}
    >
      {/* Daily check-in */}
      <DailyCheckin userId={userId} date={toISO(date)} />

      {/* Progress bar */}
      {total > 0 && (
        <View style={{ marginBottom: s.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontSize: t.xs, color: c.text3 }}>Today's progress</Text>
            <Text style={{ fontSize: t.xs, color: c.teal, fontWeight: t.bold }}>{completed}/{total}</Text>
          </View>
          <View style={{ height: 5, backgroundColor: c.bg2, borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: c.teal, width: total ? `${(completed/total)*100}%` : '0%' }} />
          </View>
        </View>
      )}

      {grouped.length === 0 ? (
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <Text style={{ fontSize: 44, marginBottom: s.lg }}>📋</Text>
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm }}>Nothing scheduled today</Text>
          <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center' }}>Add a preset to populate your agenda</Text>
        </View>
      ) : (
        grouped.map(group => (
          <View key={group.key} style={{ marginBottom: s.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
              <Text style={{ fontSize: 16 }}>{group.area.emoji}</Text>
              <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: group.area.color, textTransform: 'uppercase', letterSpacing: 1 }}>
                {group.area.label}
              </Text>
              <Text style={{ fontSize: 10, color: c.text4 }}>
                {group.items.filter(i => i.completed).length}/{group.items.length}
              </Text>
            </View>
            {group.items.map(instance => (
              <AgendaItem key={instance.id} instance={instance} onUpdate={handleUpdate} />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ─── Weekly view ──────────────────────────────────────────────────────────────
function WeeklyView({ userId, anchor, activeAreas, onDayPress, c, t, s }) {
  const [instancesByDate, setByDate] = useState({});
  const [loading, setLoading]        = useState(true);
  const weekDays = getWeekDays(anchor);
  const today    = toISO(new Date());

  useEffect(() => { load(); }, [anchor, activeAreas]);

  const load = async () => {
    setLoading(true);
    try {
      let data = await getInstances(userId, { weekStart: toISO(weekDays[0]), weekEnd: toISO(weekDays[6]) });
      if (activeAreas.size > 0) data = data.filter(i => activeAreas.has(i.area));
      const map = {};
      data.forEach(inst => { if (!map[inst.date]) map[inst.date] = []; map[inst.date].push(inst); });
      setByDate(map);
    } catch {}
    setLoading(false);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={c.teal} />;

  return (
    <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 80 }}>
      {weekDays.map((day, i) => {
        const iso   = toISO(day);
        const items = instancesByDate[iso] || [];
        const isToday = iso === today;
        const done  = items.filter(i => i.completed).length;
        return (
          <TouchableOpacity key={i} onPress={() => onDayPress(day)}
            style={{ backgroundColor: c.bg1, borderRadius: 12, marginBottom: s.sm, borderWidth: isToday ? 1.5 : 0.5, borderColor: isToday ? c.teal : c.border, overflow: 'hidden' }}>
            {/* Day header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: s.md, gap: s.sm, borderBottomWidth: items.length ? 0.5 : 0, borderBottomColor: c.border }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isToday ? c.teal : c.bg2, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: isToday ? '#fff' : c.text1 }}>{day.getDate()}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: t.sm, fontWeight: t.bold, color: isToday ? c.teal : c.text1 }}>
                {day.toLocaleDateString('en-US', { weekday: 'long' })}
              </Text>
              {items.length > 0 && (
                <Text style={{ fontSize: t.xs, color: done === items.length ? c.teal : c.text4 }}>
                  {done}/{items.length} done
                </Text>
              )}
              <Ionicons name="chevron-forward" size={14} color={c.text4} />
            </View>
            {/* Item previews */}
            {items.slice(0, 3).map((inst, j) => {
              const area = AREAS[inst.area];
              return (
                <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingHorizontal: s.md, paddingVertical: 5, borderBottomWidth: j < Math.min(items.length, 3) - 1 ? 0.5 : 0, borderBottomColor: c.border }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: inst.completed ? c.teal : (area?.color || c.teal) }} />
                  <Text style={{ flex: 1, fontSize: t.xs, color: inst.completed ? c.text4 : c.text2, textDecorationLine: inst.completed ? 'line-through' : 'none' }} numberOfLines={1}>
                    {inst.title}
                  </Text>
                </View>
              );
            })}
            {items.length > 3 && (
              <Text style={{ fontSize: t.xs, color: c.text4, padding: s.sm, paddingLeft: s.md }}>
                +{items.length - 3} more
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Monthly view ─────────────────────────────────────────────────────────────
function MonthlyView({ userId, anchor, activeAreas, onDayPress, c, t, s }) {
  const [countByDate, setCountByDate] = useState({});
  const [doneByDate,  setDoneByDate]  = useState({});
  const [loading,     setLoading]     = useState(true);
  const today   = toISO(new Date());
  const year    = anchor.getFullYear();
  const month   = anchor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => { load(); }, [anchor, activeAreas]);

  const load = async () => {
    setLoading(true);
    try {
      let data = await getInstances(userId, { month: month + 1, year });
      if (activeAreas.size > 0) data = data.filter(i => activeAreas.has(i.area));
      const countMap = {}, doneMap = {};
      data.forEach(inst => {
        countMap[inst.date] = (countMap[inst.date] || 0) + 1;
        if (inst.completed) doneMap[inst.date] = (doneMap[inst.date] || 0) + 1;
      });
      setCountByDate(countMap);
      setDoneByDate(doneMap);
    } catch {}
    setLoading(false);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={c.teal} />;

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 80 }}>
      {/* Day-of-week headers */}
      <View style={{ flexDirection: 'row', marginBottom: s.sm }}>
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: c.text4, textTransform: 'uppercase' }}>{d}</Text>
        ))}
      </View>
      {/* Calendar grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
          const iso    = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const count  = countByDate[iso] || 0;
          const done   = doneByDate[iso] || 0;
          const isToday = iso === today;
          const allDone = count > 0 && done === count;
          return (
            <TouchableOpacity key={day}
              onPress={() => onDayPress(new Date(year, month, day))}
              style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isToday ? c.teal : 'transparent', borderWidth: isToday ? 0 : (count > 0 ? 1 : 0), borderColor: allDone ? c.teal : c.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: isToday ? '800' : '500', color: isToday ? '#fff' : allDone ? c.teal : c.text1 }}>{day}</Text>
              </View>
              {count > 0 && !allDone && (
                <View style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: c.gold }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Main PlannerScreen ───────────────────────────────────────────────────────
export default function PlannerScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [userId,        setUserId]       = useState(null);
  const [view,          setView]         = useState('Daily');
  const [anchor,        setAnchor]       = useState(new Date());
  const [activeAreas,   setActiveAreas]  = useState(new Set());
  const [showSetup,     setShowSetup]    = useState(false);
  const [hasComponents, setHasComp]      = useState(false);
  const [loading,       setLoading]      = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); checkSetup(user.id); }
      else setLoading(false);
    });
  }, []);

  const checkSetup = async (uid) => {
    const subs = await getUserSubscriptions(uid);
    setHasComp(subs.length > 0);
    setLoading(false);
  };

  const toggleArea = (key) => {
    if (key === 'all') { setActiveAreas(new Set()); return; }
    setActiveAreas(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const today    = new Date();
  const weekDays = getWeekDays(anchor);

  const prevPeriod = () => {
    const d = new Date(anchor);
    if (view === 'Daily')   d.setDate(d.getDate() - 1);
    if (view === 'Weekly')  d.setDate(d.getDate() - 7);
    if (view === 'Monthly') d.setMonth(d.getMonth() - 1);
    setAnchor(d);
  };

  const nextPeriod = () => {
    const d = new Date(anchor);
    if (view === 'Daily')   d.setDate(d.getDate() + 1);
    if (view === 'Weekly')  d.setDate(d.getDate() + 7);
    if (view === 'Monthly') d.setMonth(d.getMonth() + 1);
    setAnchor(d);
  };

  const onDayPress = (day) => { setAnchor(day); setView('Daily'); };

  const periodLabel = () => {
    if (view === 'Daily')  return anchor.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
    if (view === 'Weekly') return `${weekDays[0].toLocaleDateString('en-US',{month:'short',day:'numeric'})} — ${weekDays[6].toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
    if (view === 'Monthly')return anchor.toLocaleDateString('en-US', { month:'long', year:'numeric' });
  };

  const isToday = toISO(anchor) === toISO(today);

  if (loading) return <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:c.bg0 }}><ActivityIndicator color={c.teal} /></View>;

  if (!userId) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor:c.bg0 }}>
      <Text style={{ fontSize: t.lg, color: c.text3 }}>Sign in to use the Planner</Text>
    </View>
  );

  return (
    <View style={{ flex:1, backgroundColor:c.bg0 }}>
      {/* Header */}
      <View style={{ backgroundColor:c.headerBg, borderBottomWidth:0.5, borderBottomColor:c.border }}>
        {/* Title row */}
        <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:s.lg, paddingTop:s.md, paddingBottom:s.sm }}>
          <Text style={{ fontSize:t.xxl, fontWeight:t.bold, color:c.text1, flex:1 }}>📓 Planner</Text>
          <TouchableOpacity
            style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:c.teal, borderRadius:r.lg, paddingHorizontal:s.md, paddingVertical:6 }}
            onPress={() => setShowSetup(true)}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={{ fontSize:t.xs, color:'#fff', fontWeight:t.bold }}>Add preset</Text>
          </TouchableOpacity>
        </View>

        {/* View switcher */}
        <View style={{ flexDirection:'row', paddingHorizontal:s.lg, gap:s.sm, paddingBottom:s.sm }}>
          {VIEWS.map(v => (
            <TouchableOpacity key={v} onPress={() => setView(v)}
              style={{ paddingHorizontal:s.md, paddingVertical:5, borderRadius:r.full, backgroundColor: view===v ? c.teal : 'transparent', borderWidth:1, borderColor: view===v ? c.teal : c.border }}>
              <Text style={{ fontSize:t.xs, fontWeight:t.bold, color: view===v ? '#fff' : c.text3 }}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period navigator */}
        <View style={{ flexDirection:'row', alignItems:'center', paddingHorizontal:s.lg, paddingBottom:s.sm }}>
          <TouchableOpacity onPress={prevPeriod} style={{ padding:6 }}>
            <Ionicons name="chevron-back" size={18} color={c.text3} />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex:1, alignItems:'center' }} onPress={() => setAnchor(new Date())}>
            <Text style={{ fontSize:t.sm, fontWeight:t.semibold, color:isToday ? c.teal : c.text1 }}>
              {periodLabel()}
            </Text>
            {!isToday && view==='Daily' && (
              <Text style={{ fontSize:10, color:c.text4 }}>tap to return to today</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={nextPeriod} style={{ padding:6 }}>
            <Ionicons name="chevron-forward" size={18} color={c.text3} />
          </TouchableOpacity>
        </View>

        {/* Area filter */}
        <AreaFilter activeAreas={activeAreas} onToggle={toggleArea} c={c} t={t} s={s} r={r} />
      </View>

      {/* View content */}
      {!hasComponents ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:s.xl }}>
          <Text style={{ fontSize:48, marginBottom:s.lg }}>📓</Text>
          <Text style={{ fontSize:t.xl, fontWeight:t.bold, color:c.text1, marginBottom:s.sm, textAlign:'center' }}>Your planner is empty</Text>
          <Text style={{ fontSize:t.sm, color:c.text3, textAlign:'center', lineHeight:20, marginBottom:s.xl }}>
            Add a life area preset to populate your daily, weekly, and monthly agenda.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor:c.teal, borderRadius:r.lg, paddingVertical:s.md, paddingHorizontal:s.xl }}
            onPress={() => setShowSetup(true)}
          >
            <Text style={{ color:'#fff', fontWeight:t.bold, fontSize:t.md }}>Set up my planner</Text>
          </TouchableOpacity>
        </View>
      ) : view === 'Daily' ? (
        <DailyView userId={userId} date={anchor} activeAreas={activeAreas} c={c} t={t} s={s} r={r} />
      ) : view === 'Weekly' ? (
        <WeeklyView userId={userId} anchor={anchor} activeAreas={activeAreas} onDayPress={onDayPress} c={c} t={t} s={s} />
      ) : (
        <MonthlyView userId={userId} anchor={anchor} activeAreas={activeAreas} onDayPress={onDayPress} c={c} t={t} s={s} />
      )}

      {/* Setup modal */}
      <Modal visible={showSetup} animationType="slide" onRequestClose={() => setShowSetup(false)}>
        <SetupSheet
          userId={userId}
          onDone={async () => {
            setShowSetup(false);
            await checkSetup(userId);
          }}
          c={c} t={t} s={s} r={r}
        />
      </Modal>
    </View>
  );
}
