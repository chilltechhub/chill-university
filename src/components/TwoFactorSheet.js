// src/components/TwoFactorSheet.js
// Settings → Two-step sign-in. Off: set it up (scan the QR or type the key
// into an authenticator app, then confirm one code). On: turn it off.
// See src/api/mfa.js.
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './ui';
import { verifiedTotpFactor, startSetup, confirmSetup, turnOff } from '../api/mfa';
import { confirmAsync } from '../logic/confirm';

export default function TwoFactorSheet({ visible, onClose, onChanged }) {
  const { colors: c, typography: t, spacing: s, radius: r, style: ui } = useTheme();
  const [factor, setFactor] = useState(undefined); // undefined = loading, null = off
  const [setup, setSetup] = useState(null);         // { factorId, qrSvg, secret }
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setSetup(null); setCode(''); setError(null); setFactor(undefined);
    verifiedTotpFactor().then(setFactor).catch(e => { setFactor(null); setError(e.message); });
  }, [visible]);

  const begin = async () => {
    setBusy(true); setError(null);
    try { setSetup(await startSetup()); } catch (e) { setError(e.message || 'Couldn’t start setup.'); }
    setBusy(false);
  };

  const confirm = async () => {
    if (!/^\d{6}$/.test(code.trim())) { setError('Enter the 6-digit code from your app.'); return; }
    setBusy(true); setError(null);
    try {
      await confirmSetup(setup.factorId, code);
      setFactor(await verifiedTotpFactor());
      setSetup(null); setCode('');
      onChanged?.(true);
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const disable = async () => {
    if (!(await confirmAsync('Turn off two-step sign-in?', 'Signing in will only need your password again.', 'Turn off'))) return;
    setBusy(true); setError(null);
    try { await turnOff(factor.id); setFactor(null); onChanged?.(false); } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const copy = async () => { await Clipboard.setStringAsync(setup.secret); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const body = { fontSize: t.sm, color: c.text2, lineHeight: 20 };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
          <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.xl, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s.md }}>
              <Ionicons name="shield-checkmark-outline" size={22} color={c.teal} />
              <Text style={{ flex: 1, marginLeft: 8, fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>Two-step sign-in</Text>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Close"><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
            </View>

            {factor === undefined ? <ActivityIndicator color={c.teal} style={{ marginVertical: 24 }} /> : factor ? (
              <>
                <Text style={body}>On. Signing in asks for a code from your authenticator app after your password.</Text>
                <Button label="Turn off" variant="secondary" color={c.error} onPress={disable} busy={busy} style={{ marginTop: s.lg }} />
              </>
            ) : !setup ? (
              <>
                <Text style={body}>
                  Adds a second step when you sign in: a 6-digit code from an authenticator app (Google Authenticator,
                  Microsoft Authenticator, 1Password, Authy…). Someone with only your password can’t get in.
                </Text>
                <Button label="Set it up" onPress={begin} busy={busy} style={{ marginTop: s.lg }} />
              </>
            ) : (
              <>
                <Text style={body}>1. In your authenticator app, add an account and scan this code.</Text>
                <View style={{ alignSelf: 'center', backgroundColor: '#ffffff' /* style-ok: QR needs a white quiet zone */, padding: 12, borderRadius: ui.cardRadius, marginVertical: s.md }}>
                  {!!setup.qrSvg && <SvgXml xml={setup.qrSvg} width={180} height={180} />}
                </View>
                <Text style={body}>Or type this setup key:</Text>
                <TouchableOpacity onPress={copy} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginTop: 6 }} accessibilityLabel="Copy setup key">
                  <Text selectable style={{ flex: 1, fontSize: t.sm, color: c.text1, letterSpacing: 1 }}>{setup.secret}</Text>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={c.teal} />
                </TouchableOpacity>
                <Text style={[body, { marginTop: s.lg }]}>2. Enter the 6-digit code it shows.</Text>
                <TextInput
                  value={code} onChangeText={setCode} placeholder="123456" placeholderTextColor={c.text4}
                  keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" textContentType="oneTimeCode"
                  style={{ fontSize: 22, letterSpacing: 6, textAlign: 'center', color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 1, borderColor: c.border, padding: s.md, marginTop: 6 }}
                />
                <Button label="Turn on" onPress={confirm} busy={busy} style={{ marginTop: s.lg }} />
              </>
            )}
            {!!error && <Text style={{ fontSize: t.sm, color: c.error, marginTop: s.md }}>{error}</Text>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
