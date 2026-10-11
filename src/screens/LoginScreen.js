// src/screens/LoginScreen.js
// Clean auth screen — space traveler theme, handles both login and signup

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, Animated, Linking, Image } from 'react-native';
// Bright-teal variant of the icon mark: these screens are always dark.
const BRAND_MARK = require('../../assets/splash-icon-dark.png');
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabaseClient';
import { needsSecondStep, verifySignInCode } from '../api/mfa';
import { useNavigation } from '@react-navigation/native';
import { redeemOrgInviteCode } from '../api/organizationService';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../config/legal';

// If a signup happens before email confirmation, there's no session yet to
// redeem the code against — stash it here and retry the next time a
// session shows up (see maybeRedeemPendingOrgCode, called from
// goAfterAuth on every successful login, not just signup).
const PENDING_ORG_CODE_KEY = '@cth_pending_org_code';
// Set on any successful sign-in; decides which form a fresh launch opens on.
const SIGNED_IN_BEFORE_KEY = '@cth_signed_in_before';

// Enough to catch a typo before the server does; the server has the last word.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Supabase's auth messages, in words a person can act on. Anything not
// matched is shown as Supabase wrote it rather than hidden.
function friendlyAuthError(error) {
  const msg = error?.message || '';
  if (/invalid login credentials/i.test(msg)) return "That email and password don't match. Check both, or reset your password.";
  if (/email not confirmed/i.test(msg)) return 'Confirm your email first: open the link we sent you, then sign in.';
  if (/rate limit|too many|security purposes/i.test(msg)) return 'Too many tries in a row. Wait a minute, then try again.';
  if (/invalid.*email|email.*invalid|validate email/i.test(msg)) return "That email address doesn't look right. Check for a typo.";
  if (/password.*(at least|short|characters)/i.test(msg)) return 'Password is too short. It needs at least 6 characters.';
  if (/weak|pwned|compromised|leaked/i.test(msg)) return 'That password is too easy to guess or has shown up in a data leak. Pick a different one.';
  if (/signups? not allowed|signup is disabled/i.test(msg)) return 'New accounts are switched off right now. Try again later.';
  if (/network|fetch|timed? ?out/i.test(msg)) return "Couldn't reach the server. Check your connection and try again.";
  return msg || 'Something went wrong. Please try again.';
}

async function maybeRedeemPendingOrgCode() {
  try {
    const code = await AsyncStorage.getItem(PENDING_ORG_CODE_KEY);
    if (!code) return;
    await AsyncStorage.removeItem(PENDING_ORG_CODE_KEY); // clear first — never retry-loop a bad/expired code
    const result = await redeemOrgInviteCode(code);
    const label = result?.cohort_name || result?.organization_name;
    if (label) Alert.alert('Joined!', `You're now part of ${label}.`);
  } catch (e) {
    // Not fatal — the org system may not be configured yet, or the code
    // was invalid/expired. Silent: this runs on every login, not just the
    // one signup where the user actually typed the code.
    console.warn('maybeRedeemPendingOrgCode', e?.message || e);
  }
}

export default function LoginScreen({ onSuccess, onClose }) {
  const navigation = useNavigation();
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [orgCode,     setOrgCode]     = useState('');
  const [showOrg,     setShowOrg]     = useState(false); // signup: the code field, once asked for
  const [loading,     setLoading]     = useState(false);
  const [mode,        setMode]        = useState('login'); // login | signup | reset
  const [showPass,    setShowPass]    = useState(false);
  const [agreed,      setAgreed]      = useState(false); // signup: Terms + Privacy ticked
  // Two-step sign-in (src/api/mfa.js): set once the password step passes on
  // an account with an authenticator, or on arrival with a session that
  // hasn't done the code step (App.js routes those here).
  const [mfaUser,     setMfaUser]     = useState(null);
  const [mfaCode,     setMfaCode]     = useState('');
  const [mfaError,    setMfaError]    = useState(null);
  // What went wrong (or what to do next), shown in the form itself. These
  // were all Alert.alert pop-ups, and on web a pop-up is a browser dialog
  // that can be blocked or never seen, so a failed signup looked like a
  // button that did nothing. { kind: 'error' | 'info', text, action? }
  const [notice,      setNotice]      = useState(null);
  const fail = (text, action) => setNotice({ kind: 'error', text, action });
  const switchMode = (m) => { setMode(m); setNotice(null); };

  // A device nobody has signed in on opens on Create account. It opened on
  // "Welcome back, Traveler" for everyone, so the first thing a brand-new
  // person read was a greeting for someone else, with signing up a small
  // link under it.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(SIGNED_IN_BEFORE_KEY)
      .then(seen => { if (alive && !seen) setMode(m => (m === 'login' ? 'signup' : m)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (alive && session?.user && await needsSecondStep()) setMfaUser(session.user);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const submitMfa = async () => {
    if (mfaCode.trim().length !== 6 || loading) return;
    setLoading(true); setMfaError(null);
    try {
      await verifySignInCode(mfaCode);
      const user = mfaUser;
      setMfaUser(null); setMfaCode('');
      await goAfterAuth(user);
    } catch (e) {
      setMfaError(e.message || 'That code didn’t work.');
    } finally { setLoading(false); }
  };

  const cancelMfa = async () => {
    await supabase.auth.signOut();
    setMfaUser(null); setMfaCode(''); setMfaError(null);
  };

  const goAfterAuth = async (user) => {
  try {
    AsyncStorage.setItem(SIGNED_IN_BEFORE_KEY, '1').catch(() => {});
    await maybeRedeemPendingOrgCode();

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();

    const needsOnboarding = !profile || profile.onboarding_completed !== true;
    const target = needsOnboarding ? 'MultiStepOnboarding' : 'MainTabs';

    if (onSuccess) {
      // Reached as a Modal overlay (TopBar / the floating action button),
      // from a screen the guest was already on — not the root stack's own
      // 'Login' route, so there's no Login entry sitting in history to
      // worry about. Just close the modal; only navigate if onboarding is
      // actually required.
      onSuccess();
      if (needsOnboarding) navigation.navigate('MultiStepOnboarding');
      return;
    }

    // Reached as the root Stack's own 'Login' screen (fresh launch, no
    // session). reset(), not navigate() — navigate() just pushes the next
    // screen on top of Login, so Login is still underneath in history and
    // a swipe-back gesture pops right back to it. reset() clears Login out
    // of the stack entirely, so there's nothing behind the new screen to
    // swipe back to.
    navigation.reset({ index: 0, routes: [{ name: target }] });
  } catch (e) {
    console.warn('goAfterAuth', e);
    // Fallback — just call onSuccess and let App.js handle routing
    if (onSuccess) onSuccess();
  }
};

  const handleReset = async () => {
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail) { fail('Enter the email address on your account.'); return; }
    setNotice(null);
    setLoading(true);
    try {
      // Without this, Supabase falls back to whatever Site URL is set in
      // the dashboard (Authentication → URL Configuration) — which is what
      // sent the last reset link to a dead localhost:8081 that nothing was
      // running on. window.location.origin is only meaningful on web (this
      // exact origin also needs to be in that project's Redirect URLs
      // allow-list, or Supabase ignores it and falls back the same way).
      const redirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin
        : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(trimEmail, redirectTo ? { redirectTo } : undefined);
      // Supabase returns success here even for an email with no account —
      // that's deliberate on its side (don't let this screen reveal which
      // emails are registered), so the same confirmation covers both cases.
      if (error) { fail(friendlyAuthError(error)); return; }
      setMode('login');
      setNotice({ kind: 'info', text: `If there's an account for ${trimEmail}, a reset link is on its way. Check your email.` });
    } catch (e) {
      fail("Couldn't reach the server. Check your connection and try again.");
      console.warn('reset error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'reset') { await handleReset(); return; }

    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail) { fail('Enter your email address.'); return; }
    if (!EMAIL_SHAPE.test(trimEmail)) { fail("That email address doesn't look right. Check for a typo."); return; }
    if (!password) { fail('Enter a password.'); return; }
    if (mode === 'signup' && password.length < 6) {
      fail(`Password is too short: ${password.length} character${password.length === 1 ? '' : 's'}. It needs at least 6.`);
      return;
    }
    if (mode === 'signup' && !agreed) { fail('Tick the box to agree to the Terms and Privacy Policy.'); return; }

    const alreadyHave = () => fail(
      `${trimEmail} already has an account.`,
      { label: 'Sign in instead', onPress: () => switchMode('login') },
    );

    setNotice(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: trimEmail, password });
        if (error) {
          fail(friendlyAuthError(error), /invalid login/i.test(error.message || '')
            ? { label: 'Forgot password?', onPress: () => switchMode('reset') } : undefined);
          return;
        }
        if (data.user) {
          // 2FA on: the session is only aal1 until the code step.
          if (await needsSecondStep()) { setMfaUser(data.user); return; }
          await goAfterAuth(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimEmail, password,
          // When they agreed, kept with the account (auth user metadata).
          // No name asked here: onboarding asks "What should we call you?"
          // a minute later, and asking twice was one more field between a
          // new person and the app. The email handle is only a placeholder;
          // onboarding treats it as blank (MultiStepOnboarding).
          options: { data: { display_name: trimEmail.split('@')[0], terms_accepted_at: new Date().toISOString() } },
        });
        if (error) {
          // The commonest signup error by far is an account that already
          // exists (a second try, or forgetting you signed up). Offer the
          // way forward rather than a dead end.
          if (/already registered|already exists/i.test(error.message || '')) { alreadyHave(); return; }
          fail(friendlyAuthError(error));
          return;
        }

        // With email confirmation on, Supabase doesn't say an address is
        // taken (so the form can't be used to test which emails have
        // accounts): it returns a stand-in user with no identities and no
        // error. That used to fall through to "Check your email" for an
        // email that will never get one.
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          alreadyHave();
          return;
        }

        // Stashed regardless of whether a session exists yet — if email
        // confirmation is required, this survives until the user actually
        // logs in and goAfterAuth runs maybeRedeemPendingOrgCode.
        const trimCode = orgCode.trim();
        if (trimCode) await AsyncStorage.setItem(PENDING_ORG_CODE_KEY, trimCode);

        if (data.user) {
          // Manual profile create as safety net for trigger
          await supabase.from('profiles').upsert({
            id:                   data.user.id,
            display_name:         trimEmail.split('@')[0],
            username:             trimEmail.split('@')[0],
            email:                trimEmail,
            points:               0,
            xp:                   0,
            level:                1,
            rank:                 20,
            streak_count:         0,
            onboarding_completed: false,
          });

          if (data.session) {
            await goAfterAuth(data.user);
          } else {
            setMode('login');
            setNotice({ kind: 'info', text: `Almost there. We sent a confirmation link to ${trimEmail}. Open it, then sign in here.` });
          }
        }
      }
    } catch (e) {
      fail("Couldn't reach the server. Check your connection and try again.");
      console.warn('auth error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Close button */}
      {onClose && (
        <TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" style={s.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      )}

      {/* Stars bg decoration */}
      <View style={s.stars}>
        {['✦','·','✦','·','✦','·','✦'].map((ch, i) => (
          <Text key={i} style={[s.star, { opacity: 0.1 + i * 0.05, fontSize: 11 + (i % 3) * 4, top: 40 + i * 30, left: 20 + i * 42 }]}>{ch}</Text>
        ))}
      </View>

      <View style={s.content}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <Image source={BRAND_MARK} style={s.logoMark} accessibilityLabel="Deskartes logo" />
          <Text style={s.appName}>Deskartes</Text>
          <Text style={s.tagline}>by ChillTech Hub</Text>
        </View>

        {/* Two-step sign-in: the password was right, now the code. */}
        {mfaUser && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Enter your code</Text>
            <Text style={s.cardSub}>Open your authenticator app and type the 6-digit code for Deskartes.</Text>
            <View style={s.inputWrap}>
              <Ionicons name="keypad-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
              <TextInput
                style={[s.input, { letterSpacing: 4 }]}
                value={mfaCode} onChangeText={setMfaCode}
                placeholder="123456" placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="number-pad" maxLength={6} autoFocus
                autoComplete="one-time-code" textContentType="oneTimeCode"
                onSubmitEditing={submitMfa}
              />
            </View>
            {!!mfaError && <Text style={{ color: '#ef6a6a', fontSize: 13, marginBottom: 8, textAlign: 'center' }}>{mfaError}</Text>}
            <TouchableOpacity style={[s.btn, mfaCode.trim().length !== 6 && { opacity: 0.5 }]} onPress={submitMfa} disabled={loading || mfaCode.trim().length !== 6} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Verify</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.switchRow} onPress={cancelMfa}>
              <Text style={s.switchText}><Text style={s.switchLink}>Use a different account</Text></Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Card */}
        <View style={[s.card, mfaUser && { display: 'none' }]}>
          {/* Plain words: the first screen anyone sees. "Begin your
              mission", "launch" and "your base" were theme, not meaning
              (2026-10-10: "fix the first page, it's the first thing people
              land on"). */}
          <Text style={s.cardTitle}>
            {mode === 'login' ? 'Welcome back'
              : mode === 'reset' ? 'Reset your password'
              : 'Make your free account'}
          </Text>
          <Text style={s.cardSub}>
            {mode === 'login' ? 'Pick up where you left off.'
              : mode === 'reset' ? "Enter your email and we'll send a reset link."
              : <>Plan your days. Learn. Build. <Text style={{ fontWeight: '700' }}>One app.</Text></>}
          </Text>

          {/* Email */}
          <View style={s.inputWrap}>
            <Ionicons name="mail-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Email address"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={email}
              onChangeText={(v) => { setEmail(v); if (notice?.kind === 'error') setNotice(null); }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          {/* Password (not shown while recovering — reset only needs the email above) */}
          {mode !== 'reset' && (
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder={mode === 'signup' ? 'Password (6 or more characters)' : 'Password'}
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={password}
                onChangeText={(v) => { setPassword(v); if (notice?.kind === 'error') setNotice(null); }}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={showPass ? 'Hide password' : 'Show password'} onPress={() => setShowPass(v => !v)} style={{ padding: 4 }}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={16} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </View>
          )}

          {/* Organization code (signup only, optional) — joins a school/
              business/other org right at signup so the rest of the app
              (see src/data/orgLabels.js) can speak that org's vocabulary
              from the very first screen, instead of a bare personal
              account that joins one later from Settings. Behind a link:
              most people don't have one, and an empty box in the middle of
              the form read as something they were missing. */}
          {mode === 'signup' && showOrg && (
            <View style={s.inputWrap}>
              <Ionicons name="school-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Code from your school or team"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={orgCode}
                onChangeText={(v) => setOrgCode(v.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                autoFocus
              />
            </View>
          )}

          {mode === 'signup' && !showOrg && (
            <TouchableOpacity onPress={() => setShowOrg(true)} style={s.forgotRow} accessibilityRole="button">
              <Text style={s.forgotText}>Have a code from a school or team?</Text>
            </TouchableOpacity>
          )}

          {/* Forgot password (login only) */}
          {mode === 'login' && (
            <TouchableOpacity onPress={() => switchMode('reset')} style={s.forgotRow}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {/* Agreement — a tick, not a line of small print. Signup stays
              disabled until it's ticked. */}
          {mode === 'signup' && (
            <View style={s.agreeRow}>
              <TouchableOpacity
                onPress={() => setAgreed(a => !a)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreed }}
                accessibilityLabel="I agree to the Terms and Privacy Policy"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={22} color={agreed ? '#2bb5a0' : 'rgba(255,255,255,0.5)'} />
              </TouchableOpacity>
              <Text style={s.agreeText} onPress={() => setAgreed(a => !a)}>
                I agree to the{' '}
                {TERMS_URL ? (
                  <>
                    <Text style={s.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>Terms</Text>
                    {' and '}
                  </>
                ) : null}
                <Text style={s.legalLink} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>Privacy Policy</Text>
              </Text>
            </View>
          )}

          {notice && (
            <View
              style={[s.notice, notice.kind === 'error' ? s.noticeError : s.noticeInfo]}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              <Ionicons
                name={notice.kind === 'error' ? 'alert-circle-outline' : 'mail-unread-outline'}
                size={16}
                color={notice.kind === 'error' ? '#ff8a8a' : '#5fd4c0'}
                style={{ marginTop: 1 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.noticeText}>{notice.text}</Text>
                {notice.action && (
                  <Text style={s.noticeAction} onPress={notice.action.onPress} accessibilityRole="button">
                    {notice.action.label} →
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[s.btn, mode === 'signup' && !agreed && { opacity: 0.5 }]}
            onPress={handleSubmit}
            // Dimmed until the box is ticked, but still pressable: a disabled
            // button gave no reason, and a tap now says what's missing.
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={s.btnText}>
                    {mode === 'login' ? 'Sign in' : mode === 'reset' ? 'Send Reset Link' : 'Create account'}
                  </Text>
                  <Text style={s.btnEmoji}>{mode === 'login' ? '🚀' : mode === 'reset' ? '📡' : '🛸'}</Text>
                </>
            }
          </TouchableOpacity>

          {/* Switch mode */}
          {mode === 'reset' ? (
            <TouchableOpacity style={s.switchRow} onPress={() => switchMode('login')}>
              <Text style={s.switchText}>
                <Text style={s.switchLink}>← Back to sign in</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.switchRow} onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
              <Text style={s.switchText}>
                {mode === 'login' ? 'New here? ' : 'Have an account? '}
                <Text style={s.switchLink}>{mode === 'login' ? 'Create account' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>
          )}

          {/* Guest — always available, not just when this screen is a Modal
              overlay. Reached as the root Stack's own 'Login' screen (fresh
              launch, no session), onClose is undefined, so tapping this
              resets straight into MainTabs instead: guests skip onboarding
              entirely (it writes to a `profiles` row keyed on a real
              Supabase user id, which a guest doesn't have) and land on Home
              with local-only defaults — the same character/crest loadout
              and points/xp tracking TopBar and useCharacterLoadout already
              handle for a null `user` (see UserProgressContext's
              guestPoints/guestXp/recordGuestEvent). */}
          {/* A real second button, not faint small print: trying the app
              before handing over an email is how most people decide to
              stay (audit 4.1). */}
          <TouchableOpacity
            style={s.guestBtn}
            accessibilityRole="button"
            onPress={() => {
              if (onClose) { onClose(); return; }
              navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            }}
          >
            <Text style={s.guestText}>{onClose ? 'Keep looking around' : 'Try it first, no account needed'}</Text>
          </TouchableOpacity>
          {!onClose && (
            <Text style={s.guestSub}>Look around as a guest. Make an account to save your progress.</Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#080612', justifyContent: 'center' },
  closeBtn:    { position: 'absolute', top: 54, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20 },
  stars:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  star:        { position: 'absolute', color: '#fff' },
  content:     { paddingHorizontal: 24 },
  logoWrap:    { alignItems: 'center', marginBottom: 32 },
  logoEmoji:   { fontSize: 56, marginBottom: 8 },
  logoMark:    { width: 76, height: 76, marginBottom: 10 },
  ornament:    { color: '#c9a84c', fontSize: 13, letterSpacing: 8, marginBottom: 6 },
  appName:     { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline:     { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  card:        { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 24, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  cardTitle:   { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 6 },
  cardSub:     { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 24 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingHorizontal: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
  inputIcon:   { marginRight: 8 },
  forgotRow:   { alignSelf: 'flex-end', marginBottom: 8, marginTop: -4 },
  notice:      { flexDirection: 'row', gap: 8, borderRadius: 10, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12 },
  noticeError: { backgroundColor: 'rgba(239,106,106,0.12)', borderColor: 'rgba(239,106,106,0.45)' },
  noticeInfo:  { backgroundColor: 'rgba(43,181,160,0.12)', borderColor: 'rgba(43,181,160,0.45)' },
  noticeText:  { color: '#f2f4f8', fontSize: 13.5, lineHeight: 19 },
  noticeAction:{ color: '#5fd4c0', fontSize: 13.5, fontWeight: '700', marginTop: 6 },
  forgotText:  { fontSize: 12.5, color: '#2bb5a0', fontWeight: '600' },
  input:       { flex: 1, paddingVertical: 14, fontSize: 15, color: '#fff' },
  btn:         { backgroundColor: '#2bb5a0', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnEmoji:    { fontSize: 16 },
  legalText:   { marginTop: 14, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  agreeRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  agreeText:   { flex: 1, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.75)' },
  legalLink:   { color: '#2bb5a0', textDecorationLine: 'underline' },
  switchRow:   { marginTop: 18, alignItems: 'center' },
  switchText:  { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  switchLink:  { color: '#2bb5a0', fontWeight: '600' },
  guestBtn:    { marginTop: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 14, paddingVertical: 14 },
  guestText:   { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.92)', textAlign: 'center' },
  guestSub:    { fontSize: 12, color: 'rgba(255,255,255,0.62)', textAlign: 'center', marginTop: 8, lineHeight: 17 },
});
