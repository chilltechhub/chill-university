// src/screens/library/discover/CommunityFeedScreen.js
// One feed for the whole community, with pill tabs instead of three top-level
// Discover rows.
//
// It was three screens (Breakthroughs, Top Talent, Community Projects) sharing
// this component with different config. That split a small early community's
// activity three ways, so each screen looked emptier than the community
// actually was — the worst possible first impression for a social section, and
// the reason a cold-start feed usually dies. One feed, filtered client-side,
// shows everything at once and still lets someone narrow to just projects or
// just showcased work.
//
// Tabs are not all the same query. "All Posts" and "Projects" are chronological
// (get_community_feed); "Top Talent" is ranked by the author's points
// (get_top_talent), because "exceptional work" and "most recent work" are
// different questions.

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import { useUIPrefs } from '../../../../context/UIPrefsContext';
import { useUserProgress } from '../../../../context/UserProgressContext';
import {
  getFeed, getTopTalent, publishPost, deleteMyPost, reportPost, blockUser,
  COMMUNITY_NOT_CONFIGURED, MINORS_CANNOT_PUBLISH, CONTENT_BLOCKED,
} from '../../../api/communityService';
import { communityAccess, restrictionMessage } from '../../../logic/accountAccess';

const CREST_COLORS = {
  teal: '#2bb5a0', gold: '#c9a84c', purple: '#8b4fc4', red: '#e05858',
  blue: '#3a7bd5', green: '#3ac860', orange: '#e07a30', silver: '#9a9aa8',
};
const BADGE_EMOJIS = {
  explorer: '🧭', builder: '🏗️', scholar: '📚',
  guardian: '🛡️', pioneer: '🌟', creator: '🎨',
};

// `kind` null on the All tab means "read every kind". `ranked` swaps the query
// for the points-ordered one.
const TABS = [
  { key: 'all',      label: 'All Posts',  kind: null,           ranked: false },
  { key: 'talent',   label: 'Top Talent', kind: 'showcase',     ranked: true  },
  { key: 'projects', label: 'Projects',   kind: 'project',      ranked: false },
];

// What you can post, and what each is for. Shown as a picker in the compose
// sheet now that one screen creates all three.
const KINDS = [
  { key: 'breakthrough', label: 'Breakthrough', icon: 'bulb-outline',   hint: 'Something that finally clicked' },
  { key: 'showcase',     label: 'Showcase',     icon: 'star-outline',   hint: 'Work you finished and are proud of' },
  { key: 'project',      label: 'Project',      icon: 'rocket-outline', hint: 'Something you want help with' },
];
const KIND_LABEL = { breakthrough: 'Breakthrough', showcase: 'Showcase', project: 'Project' };
const KIND_COLOR = { breakthrough: 'gold', showcase: 'gold', project: 'teal' };

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CommunityFeedScreen() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis } = useUIPrefs();
  const { profile } = useUserProgress();

  const [tab, setTab]           = useState('all');
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);
  const [notConfigured, setNC]  = useState(false);
  const [showCompose, setShow]  = useState(false);
  const [draft, setDraft]       = useState({ kind: 'breakthrough', title: '', body: '', link: '', tags: '' });
  const [saving, setSaving]     = useState(false);

  // The RPC is the real gate; this only keeps the UI honest so nobody writes a
  // post and is refused on submit. Same rule as the SQL — see logic/accountAccess.
  const { restricted: isRestricted, reason: restrictReason } = communityAccess(profile);
  const active = TABS.find(x => x.key === tab) || TABS[0];

  const load = useCallback(async (tabKey) => {
    const cfg = TABS.find(x => x.key === tabKey) || TABS[0];
    try {
      const rows = cfg.ranked ? await getTopTalent(30) : await getFeed(cfg.kind, 50);
      setPosts(rows);
      setNC(false);
    } catch (e) {
      if (e.message === COMMUNITY_NOT_CONFIGURED) setNC(true);
      else console.warn('CommunityFeed load', e.message);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(tab); }, [load, tab]));

  const switchTab = (key) => {
    if (key === tab) return;
    setTab(key);
    setLoading(true);
    setPosts([]);
    load(key);
  };

  const onRefresh = async () => { setRefresh(true); await load(tab); setRefresh(false); };

  const openCompose = () => {
    // Default the kind to whatever tab you're standing on, since that's almost
    // always what you meant to post.
    setDraft({
      kind: active.kind && active.kind !== 'showcase' ? active.kind
            : active.ranked ? 'showcase' : 'breakthrough',
      title: '', body: '', link: '', tags: '',
    });
    setShow(true);
  };

  const submit = async () => {
    const titleText = draft.title.trim();
    if (!titleText) return;
    setSaving(true);
    try {
      await publishPost({
        kind: draft.kind,
        title: titleText,
        body: draft.body.trim() || null,
        link: draft.link.trim() || null,
        tags: draft.tags.split(',').map(x => x.trim().toLowerCase()).filter(Boolean),
      });
      setShow(false);
      await load(tab);
    } catch (e) {
      if (e.message === CONTENT_BLOCKED) {
        Alert.alert(
          'That post can’t go up',
          'It contains language this community doesn’t allow. Edit it and try again.',
        );
      } else if (e.message === MINORS_CANNOT_PUBLISH) {
        Alert.alert('Not available', 'Sharing publicly is only available on adult accounts.');
      } else if (e.message === COMMUNITY_NOT_CONFIGURED) {
        setNC(true); setShow(false);
      } else {
        Alert.alert('Could not share', 'Something went wrong — try again.');
      }
    }
    setSaving(false);
  };

  const confirmDelete = (post) => {
    Alert.alert('Delete this post?', 'It will be removed from the community feed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setPosts(prev => prev.filter(p => p.id !== post.id));
        try { await deleteMyPost(post.id); } catch { load(tab); }
      } },
    ]);
  };

  // Report and block are both required of any app carrying user-generated
  // content (App Review 1.2), not optional polish.
  const promptReport = (post) => {
    const reasons = ['Spam or misleading', 'Offensive or abusive', 'Inappropriate for minors'];
    Alert.alert('Report this post?', 'Tell us what is wrong with it.', [
      ...reasons.map(reason => ({
        text: reason,
        onPress: async () => {
          try {
            await reportPost(post.id, reason);
            setPosts(prev => prev.filter(p => p.id !== post.id));
            Alert.alert('Thanks', 'Reported. It is hidden from your feed while it is reviewed.');
          } catch { Alert.alert('Could not report', 'Try again in a moment.'); }
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const promptBlock = (post) => {
    Alert.alert(`Block ${post.author_name}?`, 'You will stop seeing anything they post.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: async () => {
        setPosts(prev => prev.filter(p => p.author_id !== post.author_id));
        try { await blockUser(post.author_id); } catch { load(tab); }
      } },
    ]);
  };

  const openPostMenu = (post) => {
    if (post.is_mine) return confirmDelete(post);
    Alert.alert(post.author_name, undefined, [
      { text: 'Report post', onPress: () => promptReport(post) },
      { text: `Block ${post.author_name}`, style: 'destructive', onPress: () => promptBlock(post) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  /* ─── Chrome ─────────────────────────────────────────────────────────── */

  const Header = (
    <View style={{ backgroundColor: c.headerBg, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
      <View style={{ padding: s.lg, paddingBottom: s.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>
            {showEmojis ? '🧭 ' : ''}Community
          </Text>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 3 }}>
            Breakthroughs, showcased work and open projects
          </Text>
        </View>
        {!notConfigured && !isRestricted && (
          <TouchableOpacity
            onPress={openCompose}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.teal,
                     borderRadius: r.full, paddingHorizontal: s.md, paddingVertical: 8 }}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: t.xs, fontWeight: '700' }}>Share</Text>
          </TouchableOpacity>
        )}
      </View>

      {!notConfigured && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: s.lg, paddingBottom: s.sm, gap: s.sm }}
          style={{ flexGrow: 0 }}>
          {TABS.map(x => (
            <TouchableOpacity key={x.key} onPress={() => switchTab(x.key)}
              style={{ borderRadius: r.full, paddingHorizontal: s.md, paddingVertical: 6, borderWidth: 1,
                       backgroundColor: tab === x.key ? c.teal + '22' : c.bg0,
                       borderColor: tab === x.key ? c.teal : c.border }}>
              <Text style={{ fontSize: t.xs, fontWeight: tab === x.key ? '700' : '500',
                             color: tab === x.key ? c.teal : c.text3 }}>{x.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  if (notConfigured) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg0 }}>
        {Header}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: s.xl }}>
          <Ionicons name="cloud-offline-outline" size={44} color={c.text4} style={{ marginBottom: s.lg }} />
          <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, textAlign: 'center' }}>
            Community isn&apos;t switched on yet
          </Text>
          <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20 }}>
            The Discover database functions haven&apos;t been applied to this project yet.
            Run the community_discover migration and this fills in.
          </Text>
        </View>
      </View>
    );
  }

  const emptyCopy = {
    all:      { head: 'Nothing shared yet', body: 'Be the first — a breakthrough you had, work you finished, or a project you want help with.' },
    talent:   { head: 'Nothing showcased yet', body: 'Finished something you’re proud of? Put it forward. Showcases are ordered by standing, so consistent work rises.' },
    projects: { head: 'No open projects yet', body: 'Post something you’re building and what you need — an extra pair of hands, a tester, someone who knows the part you don’t.' },
  }[tab];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      {Header}

      {loading ? (
        <ActivityIndicator color={c.teal} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.teal} />}
        >
          {isRestricted && (
            <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.md, marginBottom: s.md,
                           borderWidth: 1, borderColor: c.border, flexDirection: 'row', gap: s.sm, alignItems: 'flex-start' }}>
              <Ionicons name="shield-checkmark-outline" size={16} color={c.teal} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: t.xs, color: c.text3, lineHeight: 17 }}>
                {restrictionMessage(restrictReason, { action: 'Posting publicly' })}
              </Text>
            </View>
          )}

          {posts.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 56 }}>
              {showEmojis
                ? <Text style={{ fontSize: 48, marginBottom: s.lg }}>🌱</Text>
                : <Ionicons name="sparkles-outline" size={44} color={c.teal} style={{ marginBottom: s.lg }} />}
              <Text style={{ fontSize: t.lg, fontWeight: t.bold, color: c.text1, marginBottom: s.sm, textAlign: 'center' }}>
                {emptyCopy.head}
              </Text>
              <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', lineHeight: 20, marginBottom: s.xl }}>
                {emptyCopy.body}
              </Text>
              {!isRestricted && (
                <TouchableOpacity onPress={openCompose}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.teal,
                           borderRadius: r.full, paddingHorizontal: s.xl, paddingVertical: 11 }}>
                  <Ionicons name="add-circle-outline" size={17} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: t.sm }}>Be the first</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : posts.map(post => {
            const crest = CREST_COLORS[post.author_color] || c.teal;
            // get_top_talent doesn't return `kind` (it's showcase by definition).
            const kind = post.kind || 'showcase';
            const kindTint = c[KIND_COLOR[kind]] || c.teal;
            return (
              <View key={post.id}
                style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.md, marginBottom: s.sm,
                         borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: crest }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.sm }}>
                  <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 1, borderColor: crest,
                                 backgroundColor: crest + '22', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12 }}>{BADGE_EMOJIS[post.author_badge] || '🧭'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.xs, fontWeight: '700', color: c.text1 }} numberOfLines={1}>
                      {post.author_name}{post.is_mine ? ' · you' : ''}
                    </Text>
                    <Text style={{ fontSize: 10, color: c.text4 }}>
                      LV {post.author_level}
                      {active.ranked && post.author_points != null ? ` · ${post.author_points} pts` : ''}
                      {' · '}{timeAgo(post.created_at)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => openPostMenu(post)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={post.is_mine ? 'trash-outline' : 'ellipsis-horizontal'} size={15} color={c.text4} />
                  </TouchableOpacity>
                </View>

                {/* On the mixed All tab you can't tell a project from a
                    breakthrough without this; on a filtered tab it's noise. */}
                {tab === 'all' && (
                  <View style={{ alignSelf: 'flex-start', backgroundColor: kindTint + '1f', borderRadius: r.full,
                                 paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 }}>
                    <Text style={{ fontSize: 10, color: kindTint, fontWeight: '700' }}>{KIND_LABEL[kind]}</Text>
                  </View>
                )}

                <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1, lineHeight: 20 }}>{post.title}</Text>
                {!!post.body && (
                  <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, marginTop: 4 }}>{post.body}</Text>
                )}
                {!!post.link && (
                  <TouchableOpacity onPress={() => Linking.openURL(post.link)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: s.sm }}>
                    <Ionicons name="link-outline" size={13} color={c.teal} />
                    <Text style={{ fontSize: t.xs, color: c.teal, flex: 1 }} numberOfLines={1}>{post.link}</Text>
                  </TouchableOpacity>
                )}
                {!!post.tags?.length && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: s.sm }}>
                    {post.tags.map((tag, i) => (
                      <View key={i} style={{ backgroundColor: c.bg2 || c.bg0, borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, color: c.text3 }}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Share sheet */}
      <Modal visible={showCompose} transparent animationType="slide" onRequestClose={() => setShow(false)}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, padding: s.xl, paddingBottom: 40, maxHeight: '88%' }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.lg }}>
              <Text style={{ fontSize: t.lg, fontWeight: '800', color: c.text1 }}>Share with the community</Text>
              <TouchableOpacity onPress={() => setShow(false)}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Kind picker — one screen now creates all three. */}
              <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.md }}>
                {KINDS.map(k => {
                  const on = draft.kind === k.key;
                  return (
                    <TouchableOpacity key={k.key} onPress={() => setDraft(d => ({ ...d, kind: k.key }))}
                      style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: s.sm, borderRadius: r.md,
                               borderWidth: 1, backgroundColor: on ? c.teal + '1f' : c.bg0,
                               borderColor: on ? c.teal : c.border }}>
                      <Ionicons name={k.icon} size={17} color={on ? c.teal : c.text4} />
                      <Text style={{ fontSize: 11, fontWeight: on ? '700' : '500', color: on ? c.teal : c.text3 }}>{k.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={{ fontSize: t.xs, color: c.text4, marginBottom: s.md }}>
                {KINDS.find(k => k.key === draft.kind)?.hint}
              </Text>

              <TextInput
                style={{ borderWidth: 1, borderColor: c.teal, borderRadius: r.md, padding: s.md, fontSize: t.md,
                         color: c.text1, backgroundColor: c.bg0, marginBottom: s.md }}
                value={draft.title} onChangeText={v => setDraft(d => ({ ...d, title: v }))}
                placeholder="Title" placeholderTextColor={c.text4} maxLength={140} autoFocus
              />
              <TextInput
                style={{ borderWidth: 1, borderColor: c.border, borderRadius: r.md, padding: s.md, fontSize: t.sm,
                         color: c.text1, backgroundColor: c.bg0, minHeight: 96, textAlignVertical: 'top', marginBottom: s.md }}
                value={draft.body} onChangeText={v => setDraft(d => ({ ...d, body: v }))}
                placeholder="Say more (optional)" placeholderTextColor={c.text4} multiline maxLength={2000}
              />
              <TextInput
                style={{ borderWidth: 1, borderColor: c.border, borderRadius: r.md, padding: s.md, fontSize: t.sm,
                         color: c.text1, backgroundColor: c.bg0, marginBottom: s.md }}
                value={draft.link} onChangeText={v => setDraft(d => ({ ...d, link: v }))}
                placeholder="Link (optional) — https://..." placeholderTextColor={c.text4} autoCapitalize="none"
              />
              <TextInput
                style={{ borderWidth: 1, borderColor: c.border, borderRadius: r.md, padding: s.md, fontSize: t.sm,
                         color: c.text1, backgroundColor: c.bg0, marginBottom: s.lg }}
                value={draft.tags} onChangeText={v => setDraft(d => ({ ...d, tags: v }))}
                placeholder="Tags, comma separated (optional)" placeholderTextColor={c.text4} autoCapitalize="none"
              />
              <Text style={{ fontSize: 11, color: c.text4, marginBottom: s.md, lineHeight: 16 }}>
                This is public to everyone using the app, and posts are screened before they
                appear. Don&apos;t include your full name, school, address, or contact details.
              </Text>
              <TouchableOpacity
                onPress={submit} disabled={saving || !draft.title.trim()}
                style={{ backgroundColor: draft.title.trim() ? c.teal : c.border, borderRadius: r.md,
                         paddingVertical: 14, alignItems: 'center' }}>
                {saving ? <ActivityIndicator color="#fff" />
                        : <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.sm }}>Post</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
