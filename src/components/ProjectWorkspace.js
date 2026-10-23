// src/components/ProjectWorkspace.js
// The founder's builder workspace (descartes_onboarding_portfolio_builder.html):
// a "Live Sync" bar with Preview / Code, Copy, Download and Publish; the live
// page in a browser frame; and the panels that change it. The portfolio gets
// the full PortfolioEditor; a lab gets its words and its parts.
//
// Every change re-renders the same file the person takes home
// (src/logic/buildRender.js), so the preview, the code view and the
// download never disagree.
//
// "Deploy" on the founder's demo pretended to publish to a live address.
// Here it's honest: the file is production-ready, and Publish lists the
// free ways to put it online (for 18+; links are adult-only in this app,
// src/logic/tailoring.js canShareLinks) or keeps it as a download.

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './ui';
import RichText from './RichText';
import TourSpot from './TourSpot';
import BuildPreview from './BuildPreview';
import PortfolioEditor, { Panel, Field } from './PortfolioEditor';
import PartPicker from './PartPicker';
import { renderBuild } from '../logic/buildRender';
import { kindOf, buildTitle, buildFilename, setAnswers } from '../logic/builds';
import { shareFile } from '../logic/shareFile';
import { notify } from '../logic/confirm';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, Consolas, monospace' });
const BAR_NAMES = { page: 'Portfolio Builder' };

// `title`: what the bar calls it (the welcome uses the founder's site names).
export default function ProjectWorkspace({ build, onChange, me = null, adult = false, onExported, onPicked, title }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent, shadows, isDark } = useTheme();
  const kind = kindOf(build);
  const [view, setView] = useState('preview');
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [words, setWords] = useState(() => ({ ...build.answers }));
  const html = useMemo(() => renderBuild(build, me), [build, me]);
  const copiedTimer = useRef(null);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);
  useEffect(() => { setWords({ ...build.answers }); }, [build.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!kind) return null;
  const isPage = kind.id === 'page';
  const slug = buildFilename(build);

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(html);
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch (e) { notify('Could not copy', e?.message || 'Try Download instead.'); }
  };
  const download = async () => {
    try {
      await shareFile({ filename: slug, content: html, mimeType: 'text/html', uti: 'public.html', dialogTitle: buildTitle(build) });
      onExported?.();
    } catch (e) { notify('Could not export', e?.message || 'Try again.'); }
  };

  const barButton = (icon, label, onPress, primary) => (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, height: 34, borderRadius: r.md,
        backgroundColor: primary ? accent.primary : c.bg0, borderWidth: primary ? 0 : 1, borderColor: c.border }, primary && shadows.sm]}>
      <Ionicons name={icon} size={14} color={primary ? accent.onPrimary : c.text2} />
      <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: primary ? accent.onPrimary : c.text2 }}>{label}</Text>
    </TouchableOpacity>
  );
  const segment = (key, label) => {
    const on = view === key;
    return (
      <TouchableOpacity onPress={() => setView(key)} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label}
        style={[{ paddingHorizontal: 12, height: 28, borderRadius: r.sm, justifyContent: 'center', backgroundColor: on ? c.bg1 : 'transparent' }, on && shadows.sm]}>
        <Text style={{ fontSize: t.xs, fontWeight: on ? t.bold : t.semibold, color: on ? c.text1 : c.text3 }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const editWords = (key, value) => {
    const next = { ...words, [key]: value };
    setWords(next);
    onChange(setAnswers(build, next));
  };

  return (
    <View>
      {/* The workspace bar */}
      <TourSpot id="welcome-project-bar">
        <View style={[{ padding: s.md, borderRadius: r.xl, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border }, shadows.md]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
            <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: accent.primary + '22', borderWidth: 1, borderColor: accent.primary + '55', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={kind.icon} size={15} color={accent.primary} />
            </View>
            <Text numberOfLines={1} style={{ flex: 1, fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>{title || BAR_NAMES[kind.id] || kind.label.replace(/^(a|an)\s+/i, '').replace(/^./, ch => ch.toUpperCase())}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: r.full, backgroundColor: c.teal + '18', borderWidth: 1, borderColor: c.teal + '40' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.teal }} />
              <Text style={{ fontSize: 11, fontWeight: t.bold, color: c.teal }}>Live sync</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: s.sm, marginTop: s.sm }}>
            <View style={{ flexDirection: 'row', padding: 3, borderRadius: r.md, backgroundColor: c.bg2 }}>
              {segment('preview', 'Preview')}
              {segment('code', 'Code HTML')}
            </View>
            <View style={{ flex: 1 }} />
            {barButton(copied ? 'checkmark' : 'copy-outline', copied ? 'Copied' : 'Copy', copy)}
            {barButton('download-outline', 'Download', download)}
            {barButton('cloud-upload-outline', 'Publish', () => setPublishing(true), true)}
          </View>
        </View>
      </TourSpot>

      {/* The page, in a browser frame */}
      <TourSpot id="welcome-project-preview">
        <View style={[{ marginTop: s.md, borderRadius: r.xl, overflow: 'hidden', borderWidth: 1, borderColor: c.border, backgroundColor: c.bg1 }, shadows.lg]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: s.md, paddingVertical: 9, backgroundColor: isDark ? c.bg2 : c.bg0, borderBottomWidth: 1, borderBottomColor: c.border }}>
            {['#ef6a5e', '#f5bf4f', '#61c454'].map(col => <View key={col} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: col }} />)}
            <View style={{ flex: 1, marginLeft: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: r.sm, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border }}>
              <Text numberOfLines={1} style={{ fontSize: 11, color: c.text3, fontFamily: MONO }}>{view === 'code' ? slug : `${slug.replace(/\.html$/, '')}-preview.local`}</Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: t.bold, color: accent.primary, letterSpacing: 0.8 }}>{view === 'code' ? 'SOURCE' : 'LIVE'}</Text>
          </View>
          {view === 'preview' ? (
            <BuildPreview html={html} height={440} scroll={kind.id !== 'game'} style={{ borderRadius: 0, borderWidth: 0 }} />
          ) : (
            <ScrollView style={{ height: 440, backgroundColor: isDark ? '#0b0f17' : '#fbfaf7' }} contentContainerStyle={{ padding: s.md }} nestedScrollEnabled>
              <Text selectable style={{ fontFamily: MONO, fontSize: 11, lineHeight: 16, color: c.text2 }}>{html}</Text>
            </ScrollView>
          )}
        </View>
      </TourSpot>

      {/* What changes it */}
      {isPage ? (
        <PortfolioEditor build={build} onChange={onChange} lookSpot onPicked={onPicked} />
      ) : (
        <>
          <Panel icon="color-palette-outline" title="Theme & parts">
            {kind.parts.map((p, i) => {
              const picker = <PartPicker key={p.id} build={build} part={p} onChange={onChange} onPicked={onPicked} />;
              // The welcome's tip points at the first row only; the panel is too tall.
              return i === 0 ? <TourSpot key={p.id} id="welcome-project-look">{picker}</TourSpot> : picker;
            })}
          </Panel>
          <Panel icon="create-outline" title="Your words">
            {kind.asks.map(ask => (
              <Field key={ask.key} label={ask.label} value={words[ask.key] || ''} onChangeText={v => editWords(ask.key, v)}
                placeholder={ask.placeholder} max={ask.max} keyboardType={ask.key === 'monthly' ? 'numeric' : 'default'} />
            ))}
            <Text style={{ fontSize: t.xs, color: c.text3 }}>The rest of the controls live inside it. Try them in the preview.</Text>
          </Panel>
        </>
      )}

      <Modal visible={publishing} transparent animationType="fade" onRequestClose={() => setPublishing(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(8, 10, 16, 0.55)', alignItems: 'center', justifyContent: 'center', padding: s.lg }}>
          <View style={[{ width: '100%', maxWidth: 440, padding: s.xl, borderRadius: r.xxl, backgroundColor: c.bg1, borderWidth: 1, borderColor: accent.primary + '55' }, shadows.lg]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm }}>
              <Ionicons name="cloud-upload-outline" size={20} color={accent.primary} />
              <Text style={{ flex: 1, fontSize: t.lg, fontWeight: t.bold, color: c.text1 }}>Put it online</Text>
              <TouchableOpacity onPress={() => setPublishing(false)} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10}>
                <Ionicons name="close" size={22} color={c.text3} />
              </TouchableOpacity>
            </View>
            <RichText style={{ fontSize: t.sm, color: c.text2, marginTop: s.md, lineHeight: 20 }} boldStyle={{ color: c.text1 }}>
              {`Your ${isPage ? 'portfolio' : 'project'} is **one production-ready file**. No account, no license, no subscription.`}
            </RichText>
            <View style={{ marginTop: s.md, padding: s.md, borderRadius: r.lg, backgroundColor: c.bg0, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ fontSize: 11, fontWeight: t.bold, color: c.text3, letterSpacing: 0.8 }}>YOUR FILE</Text>
              <Text style={{ fontSize: t.sm, color: accent.primary, fontFamily: MONO, marginTop: 2 }}>{slug}</Text>
            </View>
            {adult ? (
              <>
                <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1, marginTop: s.md }}>Free ways to publish</Text>
                {[
                  ['Netlify Drop', 'Drag the file onto the page. It’s live in seconds.', 'https://app.netlify.com/drop'],
                  ['GitHub Pages', 'Free hosting with your own address.', 'https://pages.github.com'],
                ].map(([name, what, url]) => (
                  <TouchableOpacity key={name} onPress={() => Linking.openURL(url).catch(() => {})} accessibilityRole="link" accessibilityLabel={`${name}: ${what}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginTop: s.sm, padding: s.md, borderRadius: r.lg, backgroundColor: c.bg0, borderWidth: 1, borderColor: c.border }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: c.text1 }}>{name}</Text>
                      <Text style={{ fontSize: t.xs, color: c.text3 }}>{what}</Text>
                    </View>
                    <Ionicons name="open-outline" size={16} color={c.text3} />
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <RichText style={{ fontSize: t.xs, color: c.text3, marginTop: s.md, lineHeight: 18 }} boldStyle={{ color: c.text2 }}>
                Putting it on the web opens with an account, **18+**. Until then it's yours to **download and keep**.
              </RichText>
            )}
            <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.lg }}>
              <Button label={copied ? 'Copied' : 'Copy code'} variant="secondary" icon="copy-outline" onPress={copy} style={{ flex: 1 }} />
              <Button label="Download" icon="download-outline" onPress={() => { download(); setPublishing(false); }} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
