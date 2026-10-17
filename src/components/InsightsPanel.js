// src/components/InsightsPanel.js
// The real-life half of the Insights screen (StatsScreen.js): four numbers,
// one chart of things done per day, and where it went by life area. Data
// from src/api/insightsService.js.
//
// Chart rules (the dataviz guide): one series, so no legend; bars no wider
// than 24px with a 2px gap, rounded at the top and square at the baseline;
// text in text colours, never the bar colour; tap a bar for its number; an
// accessibility label that says the whole chart in words.

import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { getInsights, INSIGHT_DAYS } from '../api/insightsService';
import { SkeletonTiles } from './Skeleton';

const CHART_H = 96;

const fmtMinutes = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ''}`.trim() : `${m}m`);
const dayLabel = (iso, opts = { weekday: 'short', month: 'short', day: 'numeric' }) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', opts);

export default function InsightsPanel({ userId }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [data, setData] = useState(null);
  const [picked, setPicked] = useState(null); // index of the tapped day

  useFocusEffect(useCallback(() => {
    let live = true;
    getInsights(userId).then(d => { if (live) setData(d); }).catch(() => {});
    return () => { live = false; };
  }, [userId]));

  if (!data) return <SkeletonTiles count={4} style={{ marginBottom: s.lg }} />;

  const total = data.days.reduce((n, d) => n + d.done, 0);
  const max = Math.max(1, ...data.days.map(d => d.done));
  const best = data.days.reduce((b, d) => (d.done > b.done ? d : b), data.days[0]);
  const delta = data.doneWeek - data.donePrevWeek;
  const pickedDay = picked != null ? data.days[picked] : null;

  const Tile = ({ label, value, note }) => (
    <View style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md }}
      accessible accessibilityLabel={`${label}: ${value}${note ? `. ${note}` : ''}`}>
      <Text style={{ fontSize: 12, color: c.text3 }}>{label}</Text>
      <Text style={{ fontSize: 26, fontWeight: '700', color: c.text1, marginTop: 2 }}>{value}</Text>
      {!!note && <Text style={{ fontSize: 12, color: c.text3, marginTop: 2 }} numberOfLines={2}>{note}</Text>}
    </View>
  );

  if (total === 0 && !data.habits.total && !data.focus.week && !data.knowledge.saved && !data.feelings.count) {
    return (
      <View style={{ backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.lg, marginBottom: s.lg }}>
        <Text style={{ fontSize: t.md, fontWeight: '700', color: c.text1 }}>Nothing to show yet</Text>
        <Text style={{ fontSize: t.sm, color: c.text2, marginTop: 4, lineHeight: 20 }}>
          Tick off a plan or a to-do, keep a habit, or run a focus session. <Text style={{ fontWeight: '700', color: c.text1 }}>It adds up here.</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: s.lg }}>
      {/* ── Four numbers ── */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginBottom: s.lg }}>
        <Tile label="Done this week" value={data.doneWeek}
          note={data.donePrevWeek || data.doneWeek ? `${delta >= 0 ? '+' : ''}${delta} vs last week` : null} />
        <Tile label="Habits kept" value={data.habits.total ? `${data.habits.kept} of ${data.habits.total}` : '—'}
          note={data.habits.total ? 'last 7 days' : 'No habits yet'} />
        <Tile label="Focus this week" value={fmtMinutes(data.focus.week)}
          note={data.focus.top ? `Most on ${data.focus.top.label} (${fmtMinutes(data.focus.top.minutes)})`
            : data.focus.prevWeek ? `${fmtMinutes(data.focus.prevWeek)} the week before` : 'From Work Mode'} />
        <Tile label="Used what you saved" value={data.knowledge.saved ? `${data.knowledge.used} of ${data.knowledge.saved}` : '—'}
          note={`Vault, last ${INSIGHT_DAYS / 7} weeks`} />
      </View>

      {/* ── Done per day ── */}
      <View style={{ backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md, marginBottom: s.lg }}
        accessible accessibilityLabel={`Things done per day, last ${INSIGHT_DAYS} days. ${total} in all. Best day ${dayLabel(best.date)}, with ${best.done}.`}>
        <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1 }}>Done per day</Text>
        <Text style={{ fontSize: 12, color: c.text3, marginBottom: s.sm }}>
          {pickedDay ? `${dayLabel(pickedDay.date)} · ${pickedDay.done} done` : `Last ${INSIGHT_DAYS} days · ${total} in all · tap a bar`}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          {/* The one y tick: the busiest day. */}
          <Text style={{ fontSize: 11, color: c.text3, width: 18, alignSelf: 'flex-start' }}>{max}</Text>
          <View style={{ flex: 1, height: CHART_H, flexDirection: 'row', alignItems: 'flex-end', gap: 2,
            borderBottomWidth: 1, borderBottomColor: c.border }}>
            {data.days.map((d, i) => {
              const h = d.done ? Math.max(4, Math.round((d.done / max) * CHART_H)) : 0;
              const dim = picked != null && picked !== i;
              return (
                <TouchableOpacity key={d.date} onPress={() => setPicked(p => (p === i ? null : i))}
                  accessibilityLabel={`${dayLabel(d.date)}: ${d.done} done`}
                  hitSlop={{ top: CHART_H, bottom: 8 }}
                  style={{ flex: 1, maxWidth: 24, height: CHART_H, justifyContent: 'flex-end' }}>
                  <View style={{ height: h, backgroundColor: c.teal, opacity: dim ? 0.35 : 1,
                    borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginLeft: 18, marginTop: 4 }}>
          <Text style={{ fontSize: 11, color: c.text3 }}>{dayLabel(data.days[0].date, { month: 'short', day: 'numeric' })}</Text>
          <Text style={{ fontSize: 11, color: c.text3 }}>Today</Text>
        </View>
      </View>

      {/* ── How you've felt: the daily check-in, one small chart per
          measure (small multiples, not four colours on one chart). ── */}
      {data.feelings.count > 0 && (
        <View style={{ backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md, marginBottom: s.lg }}>
          <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1 }}>How you've felt</Text>
          <Text style={{ fontSize: 12, color: c.text3, marginBottom: s.sm }}>
            From your check-ins · {data.feelings.count} day{data.feelings.count === 1 ? '' : 's'} in the last {INSIGHT_DAYS / 7} weeks
          </Text>
          {data.feelings.series.map(f => (
            <View key={f.key} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: 8 }}
              accessible accessibilityLabel={`${f.label}: average ${f.avg != null ? f.avg.toFixed(1) : 'none'} out of 5${f.lowerIsBetter ? ', lower is better' : ''}.`}>
              <View style={{ width: 64 }}>
                <Text style={{ fontSize: 12, color: c.text2 }}>{f.label}</Text>
                {f.lowerIsBetter && <Text style={{ fontSize: 11, color: c.text3 }}>lower is better</Text>}
              </View>
              <View style={{ flex: 1, height: 28, flexDirection: 'row', alignItems: 'flex-end', gap: 2, borderBottomWidth: 1, borderBottomColor: c.border }}>
                {f.points.map(p => (
                  <View key={p.date} style={{ flex: 1, maxWidth: 24, height: p.value ? Math.max(3, (p.value / 5) * 28) : 0,
                    backgroundColor: c.teal, opacity: 0.85, borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
                ))}
              </View>
              <Text style={{ width: 34, textAlign: 'right', fontSize: 12, fontWeight: '700', color: c.text1 }}>
                {f.avg != null ? f.avg.toFixed(1) : '—'}
              </Text>
            </View>
          ))}
          <Text style={{ fontSize: 11, color: c.text3 }}>Right-hand number: your average, out of 5</Text>
        </View>
      )}

      {/* ── By life area ── */}
      {data.areas.length > 0 && (
        <View style={{ backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md }}
          accessible accessibilityLabel={`Plans done by life area: ${data.areas.map(a => `${a.label} ${a.done}`).join(', ')}.`}>
          <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1, marginBottom: s.sm }}>Where it went</Text>
          {data.areas.map(a => (
            <View key={a.key} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: 6 }}>
              <Text style={{ width: 92, fontSize: 12, color: c.text2 }} numberOfLines={1}>{a.label}</Text>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: `${Math.max(4, (a.done / data.areas[0].done) * 85)}%`, height: 12, backgroundColor: a.color,
                  borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: c.text1 }}>{a.done}</Text>
              </View>
            </View>
          ))}
          <Text style={{ fontSize: 11, color: c.text3, marginTop: 2 }}>Planner items done, last {INSIGHT_DAYS / 7} weeks</Text>
        </View>
      )}
    </View>
  );
}
