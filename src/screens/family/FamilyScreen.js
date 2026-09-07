// src/screens/family/FamilyScreen.js
// Parent/child linking — read-only progress view, no controls over the
// child's account. Every profile can act as both sides at once (generate
// a code for your own parent, and separately have children linked to
// you), so this screen always shows all three sections rather than
// picking one role up front. See src/api/familyService.js for the RPCs
// and supabase/migrations/20260828_family_linking.sql for the schema.

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import {
  generateFamilyCode, redeemFamilyCode, getMyChildren, unlinkChild, unlinkMyParent,
} from '../../api/familyService';
import { getRank, getRankLabel } from '../../logic/rankUtils';
import TourSpot from '../../components/TourSpot';

function SectionLabel({ label, c, t, s }) {
  return <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.sm, marginTop: s.lg, paddingHorizontal: 2 }}>{label}</Text>;
}

export default function FamilyScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  const [code, setCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [generating, setGenerating] = useState(false);

  const [codeInput, setCodeInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(true);

  const loadChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      setChildren(await getMyChildren());
    } catch (e) {
      console.warn('FamilyScreen loadChildren', e.message);
    }
    setLoadingChildren(false);
  }, []);

  useFocusEffect(useCallback(() => { loadChildren(); }, [loadChildren]));

  const doGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateFamilyCode();
      setCode(result?.code || null);
      setExpiresAt(result?.expires_at || null);
    } catch (e) {
      Alert.alert('Could not generate a code', e.message);
    }
    setGenerating(false);
  };

  const copyCode = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', 'Give this code to your parent — it expires in 15 minutes.');
  };

  const doRedeem = async () => {
    if (!codeInput.trim()) return;
    setRedeeming(true);
    try {
      const result = await redeemFamilyCode(codeInput);
      setCodeInput('');
      await loadChildren();
      Alert.alert('Linked!', `You're now following ${result?.display_name || 'their'} progress.`);
    } catch (e) {
      Alert.alert('Could not link', e.message);
    }
    setRedeeming(false);
  };

  const confirmUnlink = (child) => {
    Alert.alert(
      `Unlink ${child.display_name}?`,
      'You will stop seeing their progress. They can send you a new code any time to link again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink', style: 'destructive', onPress: async () => {
            try {
              await unlinkChild(child.id);
              setChildren((prev) => prev.filter((x) => x.id !== child.id));
            } catch (e) {
              Alert.alert('Could not unlink', e.message);
            }
          },
        },
      ]
    );
  };

  const minutesLeft = expiresAt ? Math.max(0, Math.round((new Date(expiresAt) - Date.now()) / 60000)) : 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ backgroundColor: c.bg1, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: s.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>👨‍👩‍👧 Family</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}>
        {/* ── My children (parent side) ── */}
        <SectionLabel label="My Children" c={c} t={t} s={s} />
        {loadingChildren ? (
          <ActivityIndicator color={c.teal} style={{ marginVertical: s.lg }} />
        ) : children.length === 0 ? (
          <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border, marginBottom: s.sm }}>
            <Text style={{ fontSize: t.sm, color: c.text3 }}>No children linked yet — enter their invite code below.</Text>
          </View>
        ) : (
          children.map((child) => {
            const rank = getRank(child.points || 0);
            const rankInfo = getRankLabel(rank);
            return (
              <TouchableOpacity
                key={child.id}
                onPress={() => navigation.navigate('ChildProgress', { child })}
                onLongPress={() => confirmUnlink(child)}
                activeOpacity={0.85}
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: rankInfo.color }}
              >
                <Text style={{ fontSize: 24 }}>{rankInfo.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{child.display_name}</Text>
                  <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>
                    Level {child.level} · {rankInfo.label} · 🔥 {child.streak_count || 0}d streak
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.text4} />
              </TouchableOpacity>
            );
          })
        )}
        {children.length > 0 && (
          <Text style={{ fontSize: 11, color: c.text4, marginTop: 2 }}>Long-press a child to unlink.</Text>
        )}

        {/* ── Link a child (enter their code) ── */}
        <SectionLabel label="Link a Child" c={c} t={t} s={s} />
        <TourSpot id="family-link">
        <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border }}>
          <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.md }}>
            Ask your child to open Family on their account and generate a code, then enter it here.
          </Text>
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <TextInput
              value={codeInput}
              onChangeText={(v) => setCodeInput(v.toUpperCase())}
              placeholder="XXXXXX"
              placeholderTextColor={c.text4}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              style={{ flex: 1, fontSize: t.md, letterSpacing: 2, textAlign: 'center', color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md }}
            />
            <TouchableOpacity
              onPress={doRedeem}
              disabled={redeeming || !codeInput.trim()}
              style={{ backgroundColor: c.teal, borderRadius: r.md, paddingHorizontal: s.lg, alignItems: 'center', justifyContent: 'center', opacity: (redeeming || !codeInput.trim()) ? 0.5 : 1 }}
            >
              {redeeming ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.sm }}>Link</Text>}
            </TouchableOpacity>
          </View>
        </View>
        </TourSpot>

        {/* ── My invite code (child side) ── */}
        <SectionLabel label="My Invite Code" c={c} t={t} s={s} />
        <TourSpot id="family-invite">
        <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, borderWidth: 0.5, borderColor: c.border, alignItems: 'center' }}>
          <Text style={{ fontSize: t.sm, color: c.text3, marginBottom: s.md, textAlign: 'center' }}>
            Give this to a parent so they can follow your progress — read-only, they can't change anything on your account.
          </Text>
          {code ? (
            <>
              <Text style={{ fontSize: 32, fontWeight: '800', letterSpacing: 6, color: c.gold, fontFamily: 'monospace', marginBottom: 4 }}>{code}</Text>
              <Text style={{ fontSize: t.xs, color: c.text4, marginBottom: s.md }}>
                {minutesLeft > 0 ? `Expires in ${minutesLeft} min` : 'Expired — generate a new one'}
              </Text>
              <View style={{ flexDirection: 'row', gap: s.sm }}>
                <TouchableOpacity onPress={copyCode} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: s.lg, paddingVertical: s.sm, borderRadius: r.full, backgroundColor: c.teal + '18', borderWidth: 1, borderColor: c.teal + '55' }}>
                  <Ionicons name="copy-outline" size={14} color={c.teal} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: c.teal }}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={doGenerate} disabled={generating} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: s.lg, paddingVertical: s.sm, borderRadius: r.full, backgroundColor: c.bg2, borderWidth: 1, borderColor: c.border }}>
                  {generating ? <ActivityIndicator size="small" color={c.text3} /> : <Ionicons name="refresh" size={14} color={c.text3} />}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: c.text3 }}>New code</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              onPress={doGenerate}
              disabled={generating}
              style={{ backgroundColor: c.gold, borderRadius: r.md, paddingVertical: s.md, paddingHorizontal: s.xl, alignItems: 'center', opacity: generating ? 0.6 : 1 }}
            >
              {generating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.sm }}>Generate Invite Code</Text>}
            </TouchableOpacity>
          )}
        </View>
        </TourSpot>

        <TouchableOpacity
          onPress={() => Alert.alert('Unlink your parent?', 'They will stop seeing your progress.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unlink', style: 'destructive', onPress: () => unlinkMyParent().catch((e) => Alert.alert('Error', e.message)) },
          ])}
          style={{ marginTop: s.lg, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 12, color: c.text4 }}>Unlink my parent</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
