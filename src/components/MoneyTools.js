// src/components/MoneyTools.js
// Numbers that add up, for the money sections (AreaSectionScreen.js). The
// 2026-10-14 review found amounts there were only text: nothing added up.
//   <DebtPayoffCard>    your debts → months to debt-free and total interest,
//                       avalanche vs snowball side by side
//   <SavingsGoalCard>   a goal, what's saved, a monthly amount → progress
//                       and months to go
// Saved on the account (profiles.metadata.money), so it follows you to
// another phone. Estimates for planning, not financial advice.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../api/profileScopedClient';
import { saveStartChoices } from '../api/accessService';
import { payoffPlan, monthsToGoal } from '../logic/debtPayoff';

const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[$,%\s]/g, '')); return Number.isFinite(n) ? n : 0; };
const money = (n) => `$${Math.round(n).toLocaleString()}`;
const span = (m) => (m == null ? 'Never at this payment' : m < 12 ? `${m} month${m === 1 ? '' : 's'}` : `${Math.floor(m / 12)}y ${m % 12}m`);

function useMoney(userId) {
  const [money, setMoney] = useState(undefined);
  useEffect(() => {
    let live = true;
    if (!userId) { setMoney(null); return undefined; }
    supabase.from('profiles').select('metadata').eq('id', userId).maybeSingle()
      .then(({ data }) => { if (live) setMoney(data?.metadata?.money || {}); }, () => { if (live) setMoney({}); });
    return () => { live = false; };
  }, [userId]);
  const save = async (patch) => {
    const next = { ...(money || {}), ...patch };
    setMoney(next);
    await saveStartChoices(userId, { money: next });
  };
  return [money, save];
}

function Field({ label, value, onChange, placeholder, width, c, t, keyboard = 'decimal-pad' }) {
  return (
    <View style={{ width }}>
      <Text style={{ fontSize: 11, color: c.text3, marginBottom: 2 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={c.text3}
        keyboardType={keyboard} accessibilityLabel={label}
        style={{ borderWidth: 1, borderColor: c.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, color: c.text1, fontSize: t.sm, backgroundColor: c.bg0 }} />
    </View>
  );
}

const card = (c, s, r, color) => ({ backgroundColor: c.bg1, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: color, padding: s.md, gap: s.sm });

export function DebtPayoffCard({ userId, color }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [saved, save] = useMoney(userId);
  const [debts, setDebts] = useState(null);
  const [extra, setExtra] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (saved === undefined || debts) return;
    setDebts((saved?.debts?.length ? saved.debts : [{ name: '', balance: '', apr: '', min: '' }]).map(d => ({ ...d, balance: String(d.balance ?? ''), apr: String(d.apr ?? ''), min: String(d.min ?? '') })));
    setExtra(saved?.extra != null ? String(saved.extra) : '');
  }, [saved, debts]);

  const clean = useMemo(() => (debts || []).map(d => ({ name: d.name.trim() || 'Debt', balance: num(d.balance), apr: num(d.apr), min: num(d.min) })).filter(d => d.balance > 0), [debts]);
  const av = useMemo(() => payoffPlan(clean, num(extra), 'avalanche'), [clean, extra]);
  const sb = useMemo(() => payoffPlan(clean, num(extra), 'snowball'), [clean, extra]);
  const total = clean.reduce((n, d) => n + d.balance, 0);

  if (saved === undefined || !debts) return <ActivityIndicator color={color} />;
  const setDebt = (i, key, v) => setDebts(list => list.map((d, j) => (j === i ? { ...d, [key]: v } : d)));

  return (
    <View style={card(c, s, r, color)}>
      <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Payoff plan</Text>
      <Text style={{ fontSize: 12, color: c.text3 }}>Add each debt. See when you'd be debt-free, two ways.</Text>
      {debts.map((d, i) => (
        <View key={i} style={{ gap: 6, paddingTop: s.sm, borderTopWidth: i ? 0.5 : 0, borderTopColor: c.border }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Field label="Name" value={d.name} onChange={v => setDebt(i, 'name', v)} placeholder="e.g. Credit card" keyboard="default" c={c} t={t} />
            </View>
            {debts.length > 1 && (
              <TouchableOpacity onPress={() => setDebts(list => list.filter((_, j) => j !== i))} accessibilityRole="button" accessibilityLabel={`Remove ${d.name || 'this debt'}`} style={{ padding: 6 }}>
                <Ionicons name="close" size={18} color={c.text3} />
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ flex: 1 }}><Field label="Balance $" value={d.balance} onChange={v => setDebt(i, 'balance', v)} placeholder="3000" c={c} t={t} /></View>
            <View style={{ flex: 1 }}><Field label="Rate % (APR)" value={d.apr} onChange={v => setDebt(i, 'apr', v)} placeholder="24" c={c} t={t} /></View>
            <View style={{ flex: 1 }}><Field label="Minimum $/mo" value={d.min} onChange={v => setDebt(i, 'min', v)} placeholder="90" c={c} t={t} /></View>
          </View>
        </View>
      ))}
      <TouchableOpacity onPress={() => setDebts(list => [...list, { name: '', balance: '', apr: '', min: '' }])} accessibilityRole="button">
        <Text style={{ fontSize: t.sm, fontWeight: t.bold, color }}>+ Add a debt</Text>
      </TouchableOpacity>
      <Field label="Extra each month, on top of minimums ($)" value={extra} onChange={setExtra} placeholder="100" c={c} t={t} />

      {total > 0 && (
        <View style={{ flexDirection: 'row', gap: s.sm, marginTop: 4 }}>
          {[['Avalanche', 'Highest rate first', av], ['Snowball', 'Smallest balance first', sb]].map(([name, how, plan]) => (
            <View key={name} style={{ flex: 1, backgroundColor: c.bg0, borderRadius: 8, padding: s.sm }}
              accessible accessibilityLabel={`${name}: ${span(plan.months)}, ${money(plan.interest)} interest.`}>
              <Text style={{ fontSize: 12, fontWeight: t.bold, color: c.text1 }}>{name}</Text>
              <Text style={{ fontSize: 11, color: c.text3 }}>{how}</Text>
              <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginTop: 4 }}>{span(plan.months)}</Text>
              <Text style={{ fontSize: 12, color: c.text2 }}>{money(plan.interest)} interest</Text>
            </View>
          ))}
        </View>
      )}
      {total > 0 && av.months != null && sb.months != null && (
        <Text style={{ fontSize: 12, color: c.text2 }}>
          {Math.round(sb.interest - av.interest) > 0
            ? <>Avalanche saves <Text style={{ fontWeight: t.bold, color: c.text1 }}>{money(sb.interest - av.interest)}</Text>. Snowball clears <Text style={{ fontWeight: t.bold, color: c.text1 }}>{sb.order[0]}</Text> first, if quick wins keep you going.</>
            : 'Both ways cost about the same here. Pick the one you\'ll stick with.'}
        </Text>
      )}
      <TouchableOpacity disabled={busy} onPress={async () => {
        setBusy(true);
        await save({ debts: clean, extra: num(extra) });
        setBusy(false);
      }} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: color }}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 13, fontWeight: t.bold, color: '#fff' }}>Save</Text>}
      </TouchableOpacity>
      <Text style={{ fontSize: 11, color: c.text3 }}>An estimate to plan with, not financial advice.</Text>
    </View>
  );
}

export function SavingsGoalCard({ userId, color }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const [saved, save] = useMoney(userId);
  const [goal, setGoal] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (saved === undefined || goal) return;
    const g = saved?.goal || {};
    setGoal({ name: g.name || '', target: g.target != null ? String(g.target) : '', saved: g.saved != null ? String(g.saved) : '', monthly: g.monthly != null ? String(g.monthly) : '' });
  }, [saved, goal]);
  if (saved === undefined || !goal) return <ActivityIndicator color={color} />;

  const target = num(goal.target), have = num(goal.saved), monthly = num(goal.monthly);
  const pct = target > 0 ? Math.min(100, Math.round((have / target) * 100)) : 0;
  const months = target > 0 ? monthsToGoal(target, have, monthly) : null;
  const set = (key, v) => setGoal(g => ({ ...g, [key]: v }));

  return (
    <View style={card(c, s, r, color)}>
      <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Savings goal</Text>
      <Field label="What it's for" value={goal.name} onChange={v => set('name', v)} placeholder="e.g. Emergency fund" keyboard="default" c={c} t={t} />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <View style={{ flex: 1 }}><Field label="Goal $" value={goal.target} onChange={v => set('target', v)} placeholder="3000" c={c} t={t} /></View>
        <View style={{ flex: 1 }}><Field label="Saved so far $" value={goal.saved} onChange={v => set('saved', v)} placeholder="400" c={c} t={t} /></View>
        <View style={{ flex: 1 }}><Field label="Each month $" value={goal.monthly} onChange={v => set('monthly', v)} placeholder="150" c={c} t={t} /></View>
      </View>
      {target > 0 && (
        <View accessible accessibilityLabel={`${pct}% saved. ${money(have)} of ${money(target)}.${months != null ? ` ${months === 0 ? 'Done' : `${span(months)} to go`}.` : ''}`}>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: c.bg2, overflow: 'hidden' }}>
            <View style={{ width: `${pct}%`, height: 10, borderRadius: 5, backgroundColor: color }} />
          </View>
          <Text style={{ fontSize: 12, color: c.text2, marginTop: 4 }}>
            <Text style={{ fontWeight: t.bold, color: c.text1 }}>{pct}%</Text> · {money(have)} of {money(target)}
            {months === 0 ? ' · Done!' : months != null ? ` · ${span(months)} to go` : ' · add a monthly amount to see when'}
          </Text>
        </View>
      )}
      <TouchableOpacity disabled={busy} onPress={async () => {
        setBusy(true);
        await save({ goal: { name: goal.name.trim(), target, saved: have, monthly } });
        setBusy(false);
      }} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: color }}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 13, fontWeight: t.bold, color: '#fff' }}>Save</Text>}
      </TouchableOpacity>
    </View>
  );
}
