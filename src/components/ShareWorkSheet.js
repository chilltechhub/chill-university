// src/components/ShareWorkSheet.js
// Sharing your work (docs/shake-up-plan-2026-10-21.md §4.5, P8). One sheet
// for one piece of work or the whole Showcase:
//
//   Take it home    the file: a Build's own page, or the work as a page,
//                   or the Showcase as one offline page. For everyone.
//   Picture card    an image with the title and one line. For everyone.
//   Ask for feedback  (one piece of work) the file, then a message with
//                   three things to look at, from the unit's self-check.
//   Share link      18+ only, signed in: a read-only page at /s/<token>,
//                   revocable here at once. Under 18 or no birth date: the
//                   file only, said plainly (allowed.js communityAccess).
//
// Feedback notes are private: they go in the Showcase file only when you
// tick "Include feedback notes", and never in a link unless you did.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import useDeliverables from '../logic/useDeliverables';
import { UNIT_BY_ID } from '../data/units';
import { PATH_KITS } from '../data/pathKits';
import { loadBuilds } from '../api/buildService';
import { buildTitle, buildFilename, receipt } from '../logic/builds';
import { renderBuild, renderShowcase, renderDeliverable, renderPictureCard } from '../logic/buildRender';
import { showcaseItem, handedInWork, askFeedbackText, deliverableCounts, statusLabel } from '../logic/deliverables';
import { receipts } from '../logic/receipts';
import { shareFile } from '../logic/shareFile';
import { shareText } from '../logic/shareOut';
import { communityAccess } from '../logic/allowed';
import { createShareLink, listShareLinks, revokeShareLink, shareUrl } from '../api/shareLinkService';

const slug = (s) => String(s || 'my-work').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'my-work';

/**
 * target: { kind: 'deliverable', deliverable } | { kind: 'showcase' }
 */
export default function ShareWorkSheet({ visible, onClose, target }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const { user, profile } = useUserProgress();
  const { list } = useDeliverables();
  const [builds, setBuilds] = useState([]);
  const [withFeedback, setWithFeedback] = useState(false);
  const [links, setLinks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  const userId = user?.id || null;
  const { restricted, reason } = communityAccess(user ? profile : null);
  const canLink = !!user && !restricted;
  const isShowcase = target?.kind === 'showcase';
  const d = target?.deliverable || null;
  const unit = d ? UNIT_BY_ID[d.unitKey] : null;
  const targetId = isShowcase ? 'showcase' : d?.id;

  useEffect(() => {
    if (!visible) return undefined;
    let alive = true;
    setNote(null);
    loadBuilds(userId).then(l => { if (alive) setBuilds(l || []); }).catch(() => {});
    if (canLink) listShareLinks().then(l => { if (alive) setLinks(l.filter(x => x.target_id === targetId)); });
    return () => { alive = false; };
  }, [visible, userId, canLink, targetId]);

  const name = profile?.display_name || profile?.traveler_name || '';
  const itemOf = (x) => {
    const u = UNIT_BY_ID[x.unitKey];
    const b = x.ref ? builds.find(bb => bb.id === x.ref) : null;
    return showcaseItem(x, u, { pathLabel: PATH_KITS[u?.path]?.label || '', buildTitle: b ? buildTitle(b) : '' });
  };

  // The page this shares, as it is right now.
  const page = useMemo(() => {
    if (!visible || !target) return null;
    if (isShowcase) {
      const work = handedInWork(list);
      const rc = receipts({ builds: builds.map(b => ({ receipt: receipt(b) })), work: deliverableCounts(list) });
      return {
        title: name ? `${name}: my work` : 'My work',
        line: `${work.length} ${work.length === 1 ? 'thing' : 'things'} handed in`,
        filename: 'my-work.html',
        html: renderShowcase({ name, items: work.map(itemOf), receipts: rc.items, feedback: withFeedback }),
      };
    }
    if (!d) return null;
    const b = d.kind === 'build' && d.ref ? builds.find(bb => bb.id === d.ref) : null;
    return {
      title: d.title,
      line: [unit?.label, statusLabel(d)].filter(Boolean).join(' · '),
      filename: b ? buildFilename(b) : `${slug(d.title)}.html`,
      html: b ? renderBuild(b) : renderDeliverable(itemOf(d), { feedback: withFeedback }),
    };
  }, [visible, target, isShowcase, list, builds, withFeedback, d, unit, name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible || !target) return null;

  const takeHome = async () => {
    const res = await shareFile({ filename: page.filename, content: page.html, mimeType: 'text/html', uti: 'public.html', dialogTitle: page.title });
    setNote(res === 'downloaded' ? 'Downloaded.' : null);
  };
  const pictureCard = async () => {
    const res = await shareFile({ filename: `${slug(page.title)}-card.svg`, content: renderPictureCard({ title: page.title, line: page.line }), mimeType: 'image/svg+xml', uti: 'public.svg-image', dialogTitle: page.title });
    setNote(res === 'downloaded' ? 'Picture card downloaded.' : null);
  };
  const askFeedback = async () => {
    await shareFile({ filename: page.filename, content: page.html, mimeType: 'text/html', uti: 'public.html', dialogTitle: page.title });
    const res = await shareText({ title: 'Feedback?', message: askFeedbackText(d, unit) });
    setNote(res === 'copied' ? 'File saved, and the message is copied. Send both.' : 'Sent. When they answer, add it under Feedback I got.');
  };
  const makeLink = async () => {
    setBusy(true);
    const res = await createShareLink({ kind: isShowcase ? 'showcase' : 'deliverable', targetId, title: page.title, html: page.html });
    setBusy(false);
    if (res.error) { setNote(res.error); return; }
    setLinks(prev => [{ token: res.token, title: page.title, target_id: targetId, created_at: new Date().toISOString() }, ...prev]);
    if (res.url) { await Clipboard.setStringAsync(res.url).catch(() => {}); setNote('Link made and copied.'); } else setNote('Link made.');
  };
  const revoke = async (token) => {
    if (await revokeShareLink(token)) { setLinks(prev => prev.filter(l => l.token !== token)); setNote('Link revoked. It stops working now.'); }
    else setNote("Couldn't revoke it. Try again.");
  };

  const row = (icon, label, sub, onPress, a11y) => (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y || `${label}. ${sub}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: c.border }}>
      <Ionicons name={icon} size={20} color={accent.primary} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>{label}</Text>
        <Text style={{ fontSize: t.xs, color: c.text3 }}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={c.text3} />
    </TouchableOpacity>
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '85%' }}>
        <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: s.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: accent.primary }}>{isShowcase ? 'SHARE MY WORK' : 'SHARE'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={c.text3} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1, marginTop: 2, marginBottom: s.sm }} accessibilityRole="header">{page?.title}</Text>

          {!page ? <ActivityIndicator color={accent.primary} /> : (
            <>
              {row('download-outline', 'Take it home', 'A file that opens anywhere, offline. Yours.', takeHome)}
              {row('image-outline', 'Picture card', 'An image with the title and one line.', pictureCard)}
              {!isShowcase && !!unit && row('chatbubbles-outline', 'Ask for feedback', 'The file, plus three things to look at.', askFeedback)}

              <TouchableOpacity onPress={() => setWithFeedback(v => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: withFeedback }}
                accessibilityLabel="Include feedback notes in the file"
                style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: c.border }}>
                <Ionicons name={withFeedback ? 'checkbox' : 'square-outline'} size={20} color={withFeedback ? accent.primary : c.text3} />
                <Text style={{ flex: 1, fontSize: t.sm, color: c.text2 }}>Include <Text style={{ fontWeight: t.bold }}>feedback notes</Text>. They're private unless you tick this.</Text>
              </TouchableOpacity>

              {/* The link: 18+ and signed in only */}
              <View style={{ marginTop: s.md, padding: s.md, borderRadius: r.lg, backgroundColor: c.bg0, borderWidth: 0.5, borderColor: c.border }}>
                <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1 }}>Share link</Text>
                {!user ? (
                  <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>Sign in to make a link. The file works now.</Text>
                ) : restricted ? (
                  <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>
                    {reason === 'minor' ? 'Links are for 18 and over.' : 'Links need your date of birth (Settings).'} <Text style={{ fontWeight: t.bold, color: c.text2 }}>Take it home</Text> works for everyone.
                  </Text>
                ) : (
                  <>
                    <Text style={{ fontSize: t.sm, color: c.text3, marginTop: 2 }}>A read-only page, as it is now. <Text style={{ fontWeight: t.bold, color: c.text2 }}>Revoke</Text> it any time.</Text>
                    <TouchableOpacity onPress={makeLink} disabled={busy} accessibilityRole="button" accessibilityLabel="Make a share link"
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: s.sm, paddingVertical: 10, borderRadius: r.lg, backgroundColor: accent.primary }}>
                      {busy ? <ActivityIndicator color={accent.onPrimary} /> : <Ionicons name="link-outline" size={16} color={accent.onPrimary} />}
                      <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: accent.onPrimary }}>Make a link</Text>
                    </TouchableOpacity>
                    {links.map(l => (
                      <View key={l.token} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginTop: s.sm }}>
                        <Ionicons name="link" size={14} color={c.text3} />
                        <Text style={{ flex: 1, fontSize: t.xs, color: c.text2 }} numberOfLines={1}>{shareUrl(l.token) || `…/s/${l.token.slice(0, 8)}…`}</Text>
                        {!!shareUrl(l.token) && (
                          <TouchableOpacity onPress={() => Clipboard.setStringAsync(shareUrl(l.token)).then(() => setNote('Copied.')).catch(() => {})} accessibilityRole="button" accessibilityLabel="Copy this link" hitSlop={6}>
                            <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary }}>Copy</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => revoke(l.token)} accessibilityRole="button" accessibilityLabel="Revoke this link" hitSlop={6}>
                          <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: c.text3 }}>Revoke</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                )}
              </View>
              {!!note && <Text style={{ fontSize: t.sm, color: accent.primary, marginTop: s.md }}>{note}</Text>}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
