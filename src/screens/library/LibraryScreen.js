// src/screens/library/LibraryScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useUIPrefs } from '../../../context/UIPrefsContext';
import { useUserProgress } from '../../../context/UserProgressContext';
import { useTour } from '../../../context/TourContext';
import { supabase } from '../../api/profileScopedClient';
import { cacheRead, cacheWrite, isOnline } from '../../api/offlineCache';
import { getProjects, getDomainContent, getCaptureCount, completeTask } from '../../api/captureService';
import { CAPTURE_TYPES } from '../CaptureInbox';
import { CAREERS } from './careerexplore';
import { LIFE_AREAS } from './LifeAreaScreen';
import LevelRing from '../../components/LevelRing';
import PlayerMatchBackground from '../../components/PlayerMatchBackground';
import useCharacterLoadout from '../../logic/useCharacterLoadout';
import useSetting, { SETTING_KEYS } from '../../logic/useSetting';
import { FONTS } from '../../theme';
import TourSpot from '../../components/TourSpot';
import LockBadge from '../../components/LockBadge';
import { useFeatureGate } from '../../components/FeatureGate';
import { useAccess } from '../../../context/AccessContext';
import { featureForScreen } from '../../data/featureCatalog';
import { unlockHint } from '../../logic/featureAccess';
import { todayStr } from '../../logic/dateUtils';

// Same icon/color-by-type map CaptureInbox and ImportScreen already share,
// reused here for domain-filter result rows rather than a third copy.
const CAPTURE_TYPE_MAP = Object.fromEntries(CAPTURE_TYPES.map(ct => [ct.key, ct]));

// Same tagged-note pattern careerexplore.js persists "Target This Career"
// with — read-only here, this screen never writes a career target itself.
const CAREER_AREA_ID = 'professional';
const CAREER_TAG     = 'CareerExplorer';

// 'domains' stays the internal key (touches tourSteps.js's librarySubTab
// values and every activeTab==='domains' check in this file) — only the
// label changed. Order here is just the fallback before a saved
// LIBRARY_TAB_ORDER exists.
const TABS = [
  { key: 'domains',   label: 'Life' },
  { key: 'build',     label: 'Build' },
  { key: 'knowledge', label: 'Knowledge' },
];
const DEFAULT_TAB_ORDER = TABS.map(t => t.key);
const TABS_BY_KEY = Object.fromEntries(TABS.map(t => [t.key, t]));

// Exported so onboarding's "Look & Layout" step (MultiStepOnboarding.js)
// and Settings' "Library Sections" editor share this exact list instead of
// keeping their own copy that could drift out of sync — both flatten every
// hub's `items` regardless of `tab`, so that field doesn't affect them.
// `tab` says which of the three sub-views (see TABS above) a hub's cards
// render under.
export const LIBRARY_HUBS = [
  {
    id: 'academic',
    tab: 'build',
    title: 'Build',
    tagline: 'Execution, projects & career archives',
    icon: 'hammer-outline',
    accentKey: 'teal',
    items: [
      { label: 'The Workshop', screen: 'ProjectsScreen', icon: 'hammer-outline', desc: 'Blueprints, builds & shipped work', featured: true },
      { label: 'Portfolio Archives', screen: 'PortfolioScreen', icon: 'briefcase-outline', desc: 'Mastery & showcase' },
      // For the step before any of the above: not knowing yet what you want
      // to build, or be. Sits next to Career Expeditions, which it links into.
      { label: 'Wayfinder', screen: 'WayfinderScreen', icon: 'navigate-circle-outline', desc: 'Figure out what fits you' },
      { label: 'Career Expeditions', screen: 'CareerExplorationScreen', icon: 'compass-outline', desc: 'Professional horizons' },
    ],
  },
  {
    id: 'knowledge',
    tab: 'knowledge',
    title: 'Knowledge',
    tagline: 'Learning, notes & resources',
    icon: 'bulb-outline',
    accentKey: 'gold',
    items: [
      { label: 'Academy Classes', screen: 'ClassesStack', icon: 'ribbon-outline', desc: 'Structured learning modules & coursework', featured: true },
      { label: 'Idea Garden', screen: 'IdeaGardenScreen', icon: 'leaf-outline', desc: 'Cultivate & seed thoughts' },
      // One entry, three former ones: Notes Desk, the Research Vault, and
      // Resources & Instruments were all reading and writing the same
      // `captures` rows, so they're now type filters inside one screen.
      { label: 'Knowledge Vault', screen: 'KnowledgeScreen', icon: 'library-outline', desc: 'Notes, bookmarks, papers & tools' },
      { label: 'Planner', screen: 'PlannerScreen', icon: 'calendar-outline', desc: 'Agendas & key milestones' },
      // Was a registered route with help copy and tour steps written for it
      // but no entry point anywhere in the app until it landed in this hub.
      { label: 'Discover', screen: 'DiscoverScreen', icon: 'people-outline', desc: 'Breakthroughs, projects & mentors' },
    ],
  },
];

const LIFE_AREA_MAP = Object.fromEntries(LIFE_AREAS.map(a => [a.id, a]));

// A domain goes "check-in due" once it's been this long since its last
// rating — or if it's never been checked in at all.
const CHECKIN_DUE_DAYS = 7;

function fmtTime(t24) {
  if (!t24) return '';
  const [h, m] = t24.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}`;
}

function daysSince(iso) {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

function timeAgo(iso) {
  const d = daysSince(iso);
  if (d === null) return '';
  if (d === 0) return 'today';
  if (d === 1) return '1d';
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}mo`;
}

const PLANT_EMOJI = { tree: '🌳', flower: '🌸', plant: '🌿' };

// How long a second tap on the same domain still counts as a double tap.
const DOUBLE_TAP_MS = 260;

// ─── Segmented control — Domains | Build | Knowledge ───────────────────────────
// The screen title doubles as the view switcher — the sub-view's name is
// the heading, so there's no separate control taking up a whole row for
// something the title can say on its own. "Library" itself is still on the
// bottom tab bar, so nothing is lost by the heading naming the sub-view.
function TabDropdown({ tabs, active, onChange, onClose, onMove, styles, c }) {
  return (
    <>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <View style={styles.dropdown}>
        {tabs.map((tab, i) => {
          const isActive = tab.key === active;
          return (
            <View
              key={tab.key}
              style={[styles.dropdownItem, i === tabs.length - 1 && { borderBottomWidth: 0 }]}
            >
              <TouchableOpacity onPress={() => onChange(tab.key)} activeOpacity={0.7} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.dropdownItemText, isActive && { color: c.gold, fontWeight: '800' }]}>
                  {tab.label}
                </Text>
                {isActive && <Ionicons name="checkmark" size={16} color={c.gold} style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
              {/* Reorder — also sets which sub-view opens by default, since
                  that's just "whichever is first" (see LIBRARY_TAB_ORDER). */}
              <View style={{ flexDirection: 'row', gap: 2 }}>
                <TouchableOpacity
                  onPress={() => onMove(i, -1)}
                  disabled={i === 0}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  style={{ padding: 4, opacity: i === 0 ? 0.25 : 1 }}
                >
                  <Ionicons name="chevron-up" size={15} color={c.text3} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onMove(i, 1)}
                  disabled={i === tabs.length - 1}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  style={{ padding: 4, opacity: i === tabs.length - 1 ? 0.25 : 1 }}
                >
                  <Ionicons name="chevron-down" size={15} color={c.text3} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <Text style={styles.dropdownHint}>Reorder with the arrows — the top one opens first</Text>
      </View>
    </>
  );
}

// ─── Domain content row — one task/capture/planner item in a domain filter ─────
function DomainContentRow({ item, onToggleTask, onPress, c, t, s }) {
  let icon = 'ellipse-outline', color = c.text3;
  if (item.kind === 'task') {
    icon = item.done ? 'checkmark-circle' : 'ellipse-outline';
    color = item.done ? c.success : c.text3;
  } else if (item.kind === 'capture') {
    const meta = CAPTURE_TYPE_MAP[item.source] || CAPTURE_TYPE_MAP.note;
    icon = meta.icon; color = meta.color;
  } else if (item.kind === 'planner') {
    icon = 'repeat-outline'; color = c.teal;
  }
  return (
    <TouchableOpacity
      onPress={() => item.kind === 'task' ? onToggleTask(item) : onPress(item)}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: c.border }}
    >
      <Ionicons name={icon} size={17} color={color} />
      <Text
        style={{ flex: 1, fontSize: t.sm, color: item.done ? c.text4 : c.text1, textDecorationLine: item.done && item.kind === 'task' ? 'line-through' : 'none' }}
        numberOfLines={1}
      >
        {item.title}
      </Text>
      <Text style={{ fontSize: 10, color: c.text4, textTransform: 'uppercase' }}>{item.kind}</Text>
    </TouchableOpacity>
  );
}

// ─── Preview section + row ─────────────────────────────────────────────────────
// The "what's actually in here" strip under each tab's cards. Same header
// treatment the old Trophy Hall used (sectionContainer + sectionHeader), so
// these read as part of the screen rather than a new kind of block.
function PreviewSection({ title, action, onAction, styles, children }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action ? (
          <TouchableOpacity onPress={onAction}>
            <Text style={styles.sectionAction}>{action}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function PreviewRow({ emoji, icon, iconColor, title, sub, meta, onPress, isLast, styles, c }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.previewRow, isLast && { borderBottomWidth: 0 }]}
    >
      {emoji ? <Text style={{ fontSize: 15 }}>{emoji}</Text> : <Ionicons name={icon} size={16} color={iconColor || c.text3} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.previewTitle} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={styles.previewSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {meta ? <Text style={styles.previewMeta}>{meta}</Text> : null}
      <Ionicons name="chevron-forward" size={13} color={c.text4} />
    </TouchableOpacity>
  );
}

// ─── Add-life-area picker — the hidden ones from onboarding, addable later ──
function AddAreaModal({ visible, hidden, onAdd, onClose, c, t, s, r }) {
  const { showEmojis, showSubtext } = useUIPrefs();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, padding: s.xl, paddingBottom: 40, maxHeight: '75%' }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.lg }}>
            <Text style={{ fontSize: t.lg, fontWeight: '800', color: c.text1 }}>Add a Life Area</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
          </View>
          {hidden.length === 0 ? (
            <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center', paddingVertical: s.xl }}>
              All eight life areas are already showing.
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {hidden.map(area => (
                <TouchableOpacity
                  key={area.id}
                  onPress={() => onAdd(area.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}
                >
                  {showEmojis ? <Text style={{ fontSize: 22 }}>{area.emoji}</Text> : <Ionicons name={area.icon} size={20} color={area.color || c.teal} />}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.sm, fontWeight: '700', color: c.text1 }}>{area.label}</Text>
                    {showSubtext && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }} numberOfLines={1}>{area.subtitle}</Text>}
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color={c.teal} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function LibraryScreen() {
  const navigation = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const { level, points, rank, streakDays } = useUserProgress();
  const { currentStep, active: tourActive } = useTour();
  const { background: playerBackground } = useCharacterLoadout({ level, points, rank, streakDays });
  // Set from Settings → Appearance, not on this screen itself.
  const [bgMode] = useSetting(SETTING_KEYS.LIBRARY_BACKGROUND, 'plain');
  // Set from Settings → Library Sections, or onboarding's Look & Layout step.
  const [hiddenSections] = useSetting(SETTING_KEYS.HIDDEN_LIBRARY_SECTIONS, []);
  // Wayfinder gating. `gatedNavigate` opens the entry if it's available and
  // the unlock sheet if it isn't — a locked tile still does something when
  // tapped, which is the difference between a gate and a dead button.
  const { accessFor, gatedNavigate, sheet: unlockSheet } = useFeatureGate();
  const { purpose } = useAccess();

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [lifeAreas, setLifeAreas] = useState([]);
  const [areaQueue, setAreaQueue] = useState({});
  const [trophies, setTrophies] = useState([]); // completed projects — count feeds the Build tab's Portfolio card
  const [activeProjects, setActiveProjects] = useState([]); // Build tab's Workshop card
  const [targetCareer, setTargetCareer] = useState(null); // Build tab's Career card
  const [vaultCount, setVaultCount] = useState(0); // Knowledge tab's Vault card
  const [activeAreaIds, setActiveAreaIds] = useState(null); // null = show all (no onboarding pick on file, or legacy account)
  const [showAddArea, setShowAddArea] = useState(false);
  // Per-tab previews — what fills each tab below its cards.
  const [todayAgenda, setTodayAgenda] = useState([]); // Domains
  const [recentCaptures, setRecentCaptures] = useState([]); // Knowledge
  const [gardenIdeas, setGardenIdeas] = useState([]); // Knowledge

  // ── Sub-tab state ──
  // Order is user-customizable (reorder from the title dropdown) — the
  // first entry is also which sub-view opens by default. Reconciled the
  // same way widgetLayout is: known keys in their saved order, anything
  // new appended so a future 4th tab doesn't just vanish for someone with
  // a saved order already.
  const [tabOrder, setTabOrder] = useSetting(SETTING_KEYS.LIBRARY_TAB_ORDER, DEFAULT_TAB_ORDER);
  const orderedTabs = tabOrder.filter(k => TABS_BY_KEY[k]).map(k => TABS_BY_KEY[k]);
  TABS.forEach(t => { if (!orderedTabs.find(ot => ot.key === t.key)) orderedTabs.push(t); });

  const [activeTab, setActiveTabRaw] = useState(orderedTabs[0]?.key || 'domains');
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const [activeDomain, setActiveDomain] = useState(null);
  const [domainContent, setDomainContent] = useState([]);
  const [domainLoading, setDomainLoading] = useState(false);

  // Once the saved order actually loads (useSetting starts at the default
  // and re-reads async), land on its first tab — but only until the user
  // picks one themselves, so reordering later doesn't yank them off
  // whatever they're looking at.
  const userPickedTabRef = useRef(false);
  useEffect(() => {
    if (!userPickedTabRef.current) setActiveTabRaw(orderedTabs[0]?.key || 'domains');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabOrder]);

  const setActiveTab = (key) => { userPickedTabRef.current = true; setActiveTabRaw(key); };

  const moveTab = (index, direction) => {
    const keys = orderedTabs.map(t => t.key);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= keys.length) return;
    [keys[index], keys[swapWith]] = [keys[swapWith], keys[index]];
    setTabOrder(keys);
  };

  const styles = makeStyles(c, t, s, r);

  // The guided tour drives this screen's sub-tab from the outside (see
  // tourSteps.js's librarySubTab field) — only while it's actually active,
  // so it never fights a manual tap the rest of the time.
  useEffect(() => {
    if (tourActive && currentStep?.librarySubTab) setActiveTab(currentStep.librarySubTab);
  }, [tourActive, currentStep]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        loadAll(user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) loadAll(userId);
    }, [userId])
  );

  const loadAll = async (uid) => {
    const cacheKey = `library_hub_${uid}`;
    try {
      const cached = await cacheRead(cacheKey);
      if (cached) {
        setLifeAreas(cached.lifeAreas || []);
        setTrophies(cached.trophies || []);
        setActiveProjects(cached.activeProjects || []);
        setTargetCareer(cached.targetCareer || null);
        setVaultCount(cached.vaultCount || 0);
        setActiveAreaIds(cached.activeAreaIds ?? null);
        setAreaQueue(cached.areaQueue || {});
        setTodayAgenda(cached.todayAgenda || []);
        setRecentCaptures(cached.recentCaptures || []);
        setGardenIdeas(cached.gardenIdeas || []);
      }

      if (!(await isOnline())) return; // cached hub is as current as we can get right now

      const today = todayStr();
      const [areasRes, trophyRes, agendaRes, profileRes, activeProjRes, careerNoteRes, vaultTotal, recentCapRes, ideasRes] = await Promise.all([
        supabase.from('life_areas').select('*').eq('user_id', uid).order('sort_order'),
        // No .limit() any more — this now feeds the Build tab's Portfolio
        // Archives count instead of a Trophy Hall carousel, so the real
        // total matters, not just a handful to render as cards.
        supabase.from('projects').select('id,title,emoji,color,updated_at').eq('user_id', uid).eq('status', 'completed').is('deleted_at', null).order('updated_at', { ascending: false }),
        // Title/time as well as area now — this feeds both the per-domain
        // bubble count dots and the Domains tab's "Today" preview list.
        supabase.from('agenda_instances').select('id, title, area, start_time').eq('user_id', uid).eq('date', today).eq('completed', false).eq('skipped', false),
        supabase.from('profiles').select('active_life_areas').eq('id', uid).maybeSingle(),
        getProjects(uid, 'active'),
        supabase.from('area_notes').select('content').eq('user_id', uid).eq('area_id', CAREER_AREA_ID).ilike('content', `[${CAREER_TAG}]%`).order('created_at', { ascending: false }).limit(1),
        getCaptureCount(uid),
        supabase.from('captures').select('id, title, type, created_at').eq('user_id', uid).is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
        supabase.from('garden_cores').select('id, title, plant_type, color').eq('user_id', uid).is('deleted_at', null).order('created_at', { ascending: false }).limit(4),
      ]);
      if (areasRes.data) setLifeAreas(areasRes.data);
      if (trophyRes.data) setTrophies(trophyRes.data);
      setActiveProjects(activeProjRes || []);
      setVaultCount(vaultTotal || 0);
      setRecentCaptures(recentCapRes.data || []);
      setGardenIdeas(ideasRes.data || []);

      // Today's still-open agenda items, earliest first — timed ones ahead
      // of anytime ones, same ordering Home's activity list uses.
      const agendaRows = (agendaRes.data || [])
        .slice()
        .sort((a, b) => (a.start_time || '99:99').localeCompare(b.start_time || '99:99'));
      setTodayAgenda(agendaRows);

      // Career target — resolve the tagged note's career id against
      // careerexplore.js's own CAREERS list for a display name. No note
      // yet, or an id that no longer resolves, both just mean "nothing
      // targeted" rather than an error — never shown as a fabricated stat.
      const careerId = careerNoteRes.data?.[0]?.content?.replace(`[${CAREER_TAG}]`, '').trim();
      const career = careerId ? CAREERS.find(ca => ca.id === careerId) : null;
      setTargetCareer(career || null);

      // An empty array means "picked zero on purpose" (still show all, since
      // an empty Library is worse than a slightly-too-full one) — only a
      // genuinely unset column (never onboarded through the picker, or a
      // pre-existing account) means "show everything".
      const picked = profileRes.data?.active_life_areas;
      const nextActiveAreaIds = picked && picked.length > 0 ? picked : null;
      setActiveAreaIds(nextActiveAreaIds);

      // Today's remaining agenda items per life area, for the base-bubble dots.
      const nextAreaQueue = {};
      (agendaRes.data || []).forEach(row => { nextAreaQueue[row.area] = (nextAreaQueue[row.area] || 0) + 1; });
      setAreaQueue(nextAreaQueue);

      await cacheWrite(cacheKey, {
        lifeAreas: areasRes.data || [],
        trophies: trophyRes.data || [],
        activeProjects: activeProjRes || [],
        targetCareer: career || null,
        vaultCount: vaultTotal || 0,
        activeAreaIds: nextActiveAreaIds,
        areaQueue: nextAreaQueue,
        todayAgenda: agendaRows,
        recentCaptures: recentCapRes.data || [],
        gardenIdeas: ideasRes.data || [],
      });
    } catch (e) {
      console.warn('LibraryScreen load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefresh(true);
    if (userId) await loadAll(userId);
    setRefresh(false);
  };

  const addArea = async (areaId) => {
    const next = [...(activeAreaIds || LIFE_AREAS.map(a => a.id)), areaId];
    setActiveAreaIds(next);
    setShowAddArea(false);
    if (userId) {
      const hidden = LIFE_AREAS.map(a => a.id).filter(id => !next.includes(id));
      await supabase.from('profiles').update({ active_life_areas: next, hidden_life_areas: hidden }).eq('id', userId);
    }
  };

  // ── Domain filter (Domains tab) ──────────────────────────────────────────────
  // Single tap toggles the in-place filter below the grid; double tap and
  // long press both open the full Life Area check-in screen — same
  // tap-vs-hold split HomeScreen's STUDY/PLAY buttons already use, plus a
  // double tap because that's the more discoverable of the two.
  //
  // The single-tap action is deferred by DOUBLE_TAP_MS so a double tap
  // doesn't also fire the filter on its way through; that delay is short
  // enough not to read as lag on the single-tap path.
  const tapRef = useRef({ id: null, timer: null });
  useEffect(() => () => { if (tapRef.current.timer) clearTimeout(tapRef.current.timer); }, []);

  const openLifeArea = (area, saved, rating) =>
    navigation.navigate('LifeAreaScreen', {
      areaId: area.id,
      rating,
      lastCheck: saved?.last_check_date || null,
    });

  const handleDomainPress = (area, saved, rating) => {
    const pending = tapRef.current;
    if (pending.id === area.id && pending.timer) {
      clearTimeout(pending.timer);
      tapRef.current = { id: null, timer: null };
      openLifeArea(area, saved, rating);
      return;
    }
    if (pending.timer) clearTimeout(pending.timer);
    const timer = setTimeout(() => {
      tapRef.current = { id: null, timer: null };
      selectDomain(area.id);
    }, DOUBLE_TAP_MS);
    tapRef.current = { id: area.id, timer };
  };

  const selectDomain = async (domainId) => {
    if (activeDomain === domainId) { setActiveDomain(null); setDomainContent([]); return; }
    setActiveDomain(domainId);
    setDomainLoading(true);
    try {
      setDomainContent(userId ? await getDomainContent(userId, domainId) : []);
    } catch (e) {
      console.warn('LibraryScreen: domain content', e.message || e);
      setDomainContent([]);
    }
    setDomainLoading(false);
  };

  const toggleDomainTask = async (item) => {
    // Optimistic — this filtered list is a triage view, not the task's
    // system of record, so it doesn't need to wait on the round-trip.
    setDomainContent(prev => prev.map(d => d.id === item.id ? { ...d, done: !d.done } : d));
    try { await completeTask(item.raw.id, !item.done); }
    catch (e) { console.warn('LibraryScreen: complete task', e.message || e); }
  };

  const pressDomainItem = (item) => {
    if (item.kind === 'capture') navigation.navigate('KnowledgeScreen');
    else if (item.kind === 'planner') navigation.navigate('PlannerScreen');
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={c.gold} />
      </View>
    );
  }

  const visibleAreas = activeAreaIds ? LIFE_AREAS.filter(a => activeAreaIds.includes(a.id)) : LIFE_AREAS;
  const hiddenAreas = activeAreaIds ? LIFE_AREAS.filter(a => !activeAreaIds.includes(a.id)) : [];
  const nextActionProject = activeProjects.find(p => p.next_action);

  // Domains whose rating hasn't been touched in a while (or ever) — only
  // among the ones actually showing, so a deliberately hidden area never
  // nags. Capped so this stays a nudge rather than a wall of chips.
  const checkInDue = visibleAreas
    .map(area => {
      const saved = lifeAreas.find(a => a.label?.toLowerCase() === area.label.toLowerCase());
      return { area, saved, rating: saved?.progress || 0, days: daysSince(saved?.last_check_date) };
    })
    .filter(x => x.days === null || x.days >= CHECKIN_DUE_DAYS)
    .slice(0, 4);

  const renderHub = (hub) => {
    const accent = c[hub.accentKey] || c.teal;
    // Each entry is looked up in the feature catalog and ordered so anything
    // still shut sinks below what's open. Locked entries are not removed: a
    // Library that quietly shrinks is more disorienting than one that says
    // "not yet, and here's how". The exception is experimental work
    // (access.hidden), which stays out until it's asked for in the Compass
    // or Settings.
    const visibleItems = hub.items
      .filter(item => !hiddenSections.includes(item.screen))
      .map(item => {
        const feature = featureForScreen(item.screen);
        return { item, feature, access: feature ? accessFor(feature.id) : null };
      })
      .filter(entry => !entry.access?.hidden)
      .sort((a, b) => {
        const openA = a.access ? a.access.available : true;
        const openB = b.access ? b.access.available : true;
        if (openA !== openB) return openA ? -1 : 1;
        return 0;
      });
    if (visibleItems.length === 0) return null;
    // The screen title already names the view, so a hub whose title says
    // the same thing just repeats itself — keep only its tagline then.
    const showHubTitle = hub.title !== TABS.find(tb => tb.key === activeTab)?.label;
    return (
      <View key={hub.id} style={styles.hubContainer}>
        <TourSpot id={`hub-section-${hub.id}`}>
        <View style={[styles.hubHeader, !showHubTitle && { marginBottom: 12 }]}>
          <View style={{ flex: 1 }}>
            {showHubTitle && <Text style={styles.hubTitle}>{hub.title}</Text>}
            {showSubtext && <Text style={styles.hubTagline}>{hub.tagline}</Text>}
          </View>
        </View>
        </TourSpot>

        {/* Asymmetric grid — featured item takes full width */}
        <View style={styles.gridContainer}>
          {visibleItems.map(({ item, feature, access }, idx) => {
            const open = access ? access.available : true;
            // Everything not in the catalog behaves exactly as it did before —
            // open, and navigating straight through.
            const go = () => (feature
              ? gatedNavigate(feature.id, () => navigation.navigate(item.screen))
              : navigation.navigate(item.screen));
            const hint = access && !open ? unlockHint(access) : '';

            // Dynamic, real-data subtext for the three cards the redesign
            // spec calls for — falls back to the static desc when there's
            // nothing live yet. Never a fabricated number (e.g. Career has
            // no real "% complete" metric today, so it isn't shown one).
            let desc = item.desc;
            if (item.screen === 'ProjectsScreen') {
              desc = activeProjects.length > 0
                ? `${activeProjects.length} Active Project${activeProjects.length === 1 ? '' : 's'}${nextActionProject ? ` • Next: "${nextActionProject.next_action}"` : ''}`
                : item.desc;
            } else if (item.screen === 'PortfolioScreen') {
              desc = trophies.length > 0 ? `${trophies.length} Completed Project${trophies.length === 1 ? '' : 's'} & Case Studies` : item.desc;
            } else if (item.screen === 'CareerExplorationScreen') {
              desc = targetCareer ? `Target: ${targetCareer.title}` : item.desc;
            } else if (item.screen === 'KnowledgeScreen') {
              desc = vaultCount > 0 ? `${vaultCount}${vaultCount >= 100 ? '+' : ''} Bookmarks, Notes & Tools` : item.desc;
            }

            if (item.featured) {
              return (
                <TourSpot key={idx} id={`hub-${item.screen}`} style={{ width: '100%' }}>
                  <TouchableOpacity
                    style={[styles.featuredCard, { borderLeftColor: open ? accent : c.border }]}
                    onPress={go}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.labelRow}>
                        <Text style={[styles.featuredLabel, !open && styles.dimLabel]}>{item.label}</Text>
                        {access && <LockBadge access={access} size="xs" />}
                      </View>
                      {showSubtext && <Text style={styles.featuredDesc} numberOfLines={2}>{hint || desc}</Text>}
                    </View>
                    <View style={[styles.featuredIconBg, { backgroundColor: (open ? accent : c.text4) + '18' }]}>
                      <Ionicons name={item.icon} size={24} color={open ? accent : c.text4} />
                    </View>
                  </TouchableOpacity>
                </TourSpot>
              );
            }

            return (
              <TourSpot key={idx} id={`hub-${item.screen}`} style={styles.standardGridSpot}>
                <TouchableOpacity
                  style={styles.standardGridCard}
                  onPress={go}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardTopRow}>
                    <Ionicons name={item.icon} size={18} color={open ? c.text1 : c.text4} />
                    {open
                      ? <Ionicons name="arrow-forward" size={12} color={accent} />
                      : (access && <LockBadge access={access} size="xs" showLabel={false} />)}
                  </View>
                  <Text style={[styles.cardLabel, !open && styles.dimLabel]}>{item.label}</Text>
                  {showSubtext && (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {hint || desc}
                    </Text>
                  )}
                </TouchableOpacity>
              </TourSpot>
            );
          })}
        </View>
      </View>
    );
  };

  const activeDomainLabel = LIFE_AREAS.find(a => a.id === activeDomain)?.label;

  return (
    <View style={styles.container}>
      {bgMode === 'player' && <PlayerMatchBackground background={playerBackground} />}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.gold} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header — the title is the view switcher ── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity
              style={styles.titleBtn}
              onPress={() => setTabMenuOpen(o => !o)}
              activeOpacity={0.75}
            >
              <Text style={styles.headerTitle}>{TABS.find(tb => tb.key === activeTab)?.label || 'Library'}</Text>
              <Ionicons
                name={tabMenuOpen ? 'chevron-up' : 'chevron-down'}
                size={19}
                color={c.text3}
                style={{ marginTop: 5 }}
              />
            </TouchableOpacity>
            {/* The purpose, restated where the choosing happens. Tapping it
                goes to the Compass, which is the only place that can change
                what this screen leads with. */}
            {purpose && showSubtext && (
              <TouchableOpacity onPress={() => navigation.navigate('Compass')} activeOpacity={0.7}>
                <Text style={styles.purposeLine} numberOfLines={1}>
                  {showEmojis ? `${purpose.emoji} ` : ''}{purpose.label} · change
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TourSpot id="library-capture">
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={() => navigation.navigate('CaptureInbox')}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.captureBtnText}>Capture</Text>
          </TouchableOpacity>
          </TourSpot>
        </View>

        {/* ── Domains tab ── */}
        {activeTab === 'domains' && (
          <>
            <TourSpot id="library-life-areas">
            <View style={styles.sectionContainer}>
              <View style={styles.baseGrid}>
                {visibleAreas.map((area) => {
                  const saved = lifeAreas.find((a) => a.label?.toLowerCase() === area.label.toLowerCase());
                  const rating = saved?.progress || 0;
                  const queued = areaQueue[area.id] || 0;
                  const areaColor = area.color || c.teal;
                  const isActive = activeDomain === area.id;
                  return (
                    <TouchableOpacity
                      key={area.id}
                      style={styles.bubbleWrap}
                      onPress={() => handleDomainPress(area, saved, rating)}
                      onLongPress={() => openLifeArea(area, saved, rating)}
                      activeOpacity={0.85}
                    >
                      <LevelRing pct={(rating / 5) * 100} size={48} strokeWidth={3} color={areaColor} trackColor={c.bg2}>
                        <View style={[styles.bubble, { backgroundColor: areaColor + '1c' }, isActive && { borderWidth: 2, borderColor: areaColor }]}>
                          {showEmojis ? <Text style={styles.areaEmoji}>{area.emoji}</Text> : <Ionicons name={area.icon} size={16} color={areaColor} />}
                          {queued > 0 && (
                            <View style={[styles.bubbleDot, { backgroundColor: areaColor }]}>
                              <Text style={styles.bubbleDotText}>{queued}</Text>
                            </View>
                          )}
                        </View>
                      </LevelRing>
                      <Text style={styles.areaLabel} numberOfLines={1}>{area.label}</Text>
                    </TouchableOpacity>
                  );
                })}
                {hiddenAreas.length > 0 && (
                  <TouchableOpacity style={styles.bubbleWrap} onPress={() => setShowAddArea(true)} activeOpacity={0.85}>
                    <View style={[styles.bubble, styles.addBubble]}>
                      <Ionicons name="add" size={20} color={c.text3} />
                    </View>
                    <Text style={styles.areaLabel} numberOfLines={1}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
              {showSubtext && (
                <Text style={styles.domainHint}>Tap a domain to filter — double-tap or hold to open its check-in</Text>
              )}
            </View>
            </TourSpot>

            {/* With no domain selected, the tab would otherwise be a grid
                and a lot of nothing — so this is what's actually happening
                across the domains today. Hidden while a filter is active,
                since the filtered list is then the answer to the same
                question. */}
            {!activeDomain && (
              <>
                <PreviewSection
                  title="Today"
                  action="Planner →"
                  onAction={() => navigation.navigate('PlannerScreen')}
                  styles={styles}
                >
                  {todayAgenda.length === 0 ? (
                    <Text style={styles.previewEmpty}>Nothing scheduled today — your planner's clear.</Text>
                  ) : (
                    <View style={styles.previewCard}>
                      {todayAgenda.slice(0, 6).map((item, i, arr) => (
                        <PreviewRow
                          key={item.id}
                          emoji={LIFE_AREA_MAP[item.area]?.emoji || '•'}
                          title={item.title}
                          meta={fmtTime(item.start_time)}
                          onPress={() => navigation.navigate('PlannerScreen')}
                          isLast={i === Math.min(arr.length, 6) - 1}
                          styles={styles}
                          c={c}
                        />
                      ))}
                    </View>
                  )}
                </PreviewSection>

                {checkInDue.length > 0 && (
                  <PreviewSection title="Check-in due" styles={styles}>
                    <View style={styles.chipWrap}>
                      {checkInDue.map(({ area, saved, rating, days }) => (
                        <TouchableOpacity
                          key={area.id}
                          onPress={() => openLifeArea(area, saved, rating)}
                          activeOpacity={0.8}
                          style={[styles.dueChip, { borderColor: (area.color || c.teal) + '66' }]}
                        >
                          {showEmojis
                            ? <Text style={{ fontSize: 13 }}>{area.emoji}</Text>
                            : <Ionicons name={area.icon} size={13} color={area.color || c.teal} />}
                          <Text style={[styles.dueChipText, { color: area.color || c.teal }]}>{area.label}</Text>
                          <Text style={styles.dueChipDays}>{days === null ? 'never' : `${days}d`}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </PreviewSection>
                )}
              </>
            )}

            {activeDomain && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{activeDomainLabel} — tagged items</Text>
                  <TouchableOpacity onPress={() => { setActiveDomain(null); setDomainContent([]); }}>
                    <Text style={styles.sectionAction}>Clear ✕</Text>
                  </TouchableOpacity>
                </View>
                {domainLoading ? (
                  <ActivityIndicator color={c.gold} style={{ marginTop: 12 }} />
                ) : domainContent.length === 0 ? (
                  <Text style={styles.domainEmptyText}>
                    Nothing tagged to {activeDomainLabel} yet — tag a task or note with it from where you create one.
                  </Text>
                ) : (
                  <View style={styles.domainResultsCard}>
                    {domainContent.map(item => (
                      <DomainContentRow key={item.id} item={item} onToggleTask={toggleDomainTask} onPress={pressDomainItem} c={c} t={t} s={s} />
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* ── Build / Knowledge tabs ── */}
        {activeTab !== 'domains' && LIBRARY_HUBS.filter(hub => hub.tab === activeTab).map(renderHub)}

        {/* ── Build previews ── */}
        {activeTab === 'build' && (
          <>
            <PreviewSection
              title="Active builds"
              action="Workshop →"
              onAction={() => navigation.navigate('ProjectsScreen')}
              styles={styles}
            >
              {activeProjects.length === 0 ? (
                <Text style={styles.previewEmpty}>No builds in progress — start one from the Workshop.</Text>
              ) : (
                <View style={styles.previewCard}>
                  {activeProjects.slice(0, 5).map((p, i, arr) => (
                    <PreviewRow
                      key={p.id}
                      emoji={p.emoji || '🏗️'}
                      title={p.title}
                      sub={p.next_action ? `Next: ${p.next_action}` : 'No next step set'}
                      onPress={() => navigation.navigate('ProjectDetail', { project: p })}
                      isLast={i === Math.min(arr.length, 5) - 1}
                      styles={styles}
                      c={c}
                    />
                  ))}
                </View>
              )}
            </PreviewSection>

            {trophies.length > 0 && (
              <PreviewSection
                title="Recently shipped"
                action="Portfolio →"
                onAction={() => navigation.navigate('PortfolioScreen')}
                styles={styles}
              >
                <View style={styles.previewCard}>
                  {trophies.slice(0, 4).map((tr, i, arr) => (
                    <PreviewRow
                      key={tr.id}
                      emoji={tr.emoji || '🏆'}
                      title={tr.title}
                      meta={tr.updated_at ? new Date(tr.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                      onPress={() => navigation.navigate('PortfolioScreen')}
                      isLast={i === Math.min(arr.length, 4) - 1}
                      styles={styles}
                      c={c}
                    />
                  ))}
                </View>
              </PreviewSection>
            )}
          </>
        )}

        {/* ── Knowledge previews ── */}
        {activeTab === 'knowledge' && (
          <>
            <PreviewSection
              title="Recent in your vault"
              action="Vault →"
              onAction={() => navigation.navigate('KnowledgeScreen')}
              styles={styles}
            >
              {recentCaptures.length === 0 ? (
                <Text style={styles.previewEmpty}>Nothing captured yet — use Capture up top to save your first note or link.</Text>
              ) : (
                <View style={styles.previewCard}>
                  {recentCaptures.map((cp, i, arr) => {
                    const meta = CAPTURE_TYPE_MAP[cp.type] || CAPTURE_TYPE_MAP.note;
                    return (
                      <PreviewRow
                        key={cp.id}
                        icon={meta.icon}
                        iconColor={meta.color}
                        title={cp.title || 'Untitled'}
                        meta={timeAgo(cp.created_at)}
                        onPress={() => navigation.navigate('KnowledgeScreen')}
                        isLast={i === arr.length - 1}
                        styles={styles}
                        c={c}
                      />
                    );
                  })}
                </View>
              )}
            </PreviewSection>

            {gardenIdeas.length > 0 && (
              <PreviewSection
                title="Latest ideas"
                action="Idea Garden →"
                onAction={() => navigation.navigate('IdeaGardenScreen')}
                styles={styles}
              >
                <View style={styles.previewCard}>
                  {gardenIdeas.map((idea, i, arr) => (
                    <PreviewRow
                      key={idea.id}
                      emoji={PLANT_EMOJI[idea.plant_type] || '🌱'}
                      title={idea.title}
                      onPress={() => navigation.navigate('IdeaGardenScreen')}
                      isLast={i === arr.length - 1}
                      styles={styles}
                      c={c}
                    />
                  ))}
                </View>
              </PreviewSection>
            )}
          </>
        )}
      </ScrollView>

      {/* Sits above the ScrollView rather than inside it so it overlays the
          content the way a dropdown should, instead of pushing it down. */}
      {tabMenuOpen && (
        <TabDropdown
          tabs={orderedTabs}
          active={activeTab}
          onChange={(key) => { setActiveTab(key); setTabMenuOpen(false); }}
          onClose={() => setTabMenuOpen(false)}
          onMove={moveTab}
          styles={styles}
          c={c}
        />
      )}

      {unlockSheet}

      <AddAreaModal
        visible={showAddArea}
        hidden={hiddenAreas}
        onAdd={addArea}
        onClose={() => setShowAddArea(false)}
        c={c} t={t} s={s} r={r}
      />
    </View>
  );
}

const makeStyles = (c, t, s, r) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg0 },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg0 },
    scrollContent: { paddingBottom: 60, paddingTop: 54 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    titleBtn: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    headerTitle: {
      fontSize: t.xxxl,
      fontFamily: FONTS.display,
      fontWeight: '800',
      color: c.text1,
    },
    /* Anchored under the title. `top` clears scrollContent's paddingTop
       plus the title's own line height — the header is a fixed height, so
       this doesn't need measuring. */
    dropdown: {
      position: 'absolute',
      top: 96,
      left: 20,
      minWidth: 240,
      backgroundColor: c.bg1,
      borderRadius: r.lg,
      borderWidth: 0.5,
      borderColor: c.border,
      paddingHorizontal: 4,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
      zIndex: 30,
    },
    dropdownItem: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 10, paddingHorizontal: 12,
      borderBottomWidth: 0.5, borderBottomColor: c.border,
    },
    dropdownItemText: { fontSize: t.md, fontWeight: '600', color: c.text1 },
    dropdownHint: { fontSize: 10, color: c.text4, paddingHorizontal: 12, paddingVertical: 8, textAlign: 'center' },
    purposeLine: {
      fontSize: t.xs,
      color: c.text3,
      marginTop: 2,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dimLabel: {
      color: c.text3,
    },
    captureBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.teal,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: r.xl,
    },
    captureBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    sectionContainer: { marginBottom: 28 },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: FONTS.displaySemibold,
      fontWeight: '800',
      color: c.text1,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    sectionAction: { fontSize: 12, fontFamily: FONTS.mono, color: c.teal, fontWeight: '700' },
    /* ── Life areas — small bubbles ── */
    // Fixed 4 columns (4x2 for the usual 8 areas) rather than the old
    // organic flex-wrap, which fit a different count per row depending on
    // screen width — a real grid instead of a loosely wrapping row.
    // width:'25%' on each cell is what makes exactly 4 fit per line at any
    // screen size; easy to change to 3 ('33.33%') if that reads better.
    baseGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
    },
    // marginBottom rather than baseGrid's old rowGap: a `gap` property being
    // polyfilled as an extra flex child between items can eat into the
    // horizontal space a wrap calculation sees, which is exactly what
    // caused 4 same-width cells to wrap after 2 instead of filling the row
    // — confirmed live (measured each cell at exactly 25% of the padded
    // container, 4 of them summing to exactly the available width, and it
    // still wrapped early). margin never has that ambiguity.
    bubbleWrap: { alignItems: 'center', width: '25%', marginBottom: 18 },
    bubble: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
    },
    addBubble: {
      backgroundColor: c.bg2,
      borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed',
    },
    bubbleDot: {
      position: 'absolute', top: -3, right: -3,
      minWidth: 14, height: 14, borderRadius: 7, paddingHorizontal: 3,
      alignItems: 'center', justifyContent: 'center',
    },
    bubbleDotText: { fontSize: 8, fontFamily: FONTS.mono, fontWeight: '800', color: '#fff' },
    areaEmoji: { fontSize: 16 },
    areaLabel: { fontSize: 9, fontWeight: '700', color: c.text1, textAlign: 'center', marginTop: 5 },
    domainHint: { fontSize: 11, color: c.text4, textAlign: 'center', marginTop: 14, paddingHorizontal: 20 },
    domainEmptyText: { fontSize: t.sm, color: c.text4, paddingHorizontal: 20, lineHeight: 19 },
    domainResultsCard: {
      marginHorizontal: 20,
      backgroundColor: c.bg1, borderRadius: r.lg, padding: 14,
      borderWidth: 0.5, borderColor: c.border,
    },
    /* ── Per-tab previews ── */
    previewCard: {
      marginHorizontal: 20,
      backgroundColor: c.bg1, borderRadius: r.lg,
      paddingHorizontal: 14,
      borderWidth: 0.5, borderColor: c.border,
    },
    previewRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 11,
      borderBottomWidth: 0.5, borderBottomColor: c.border,
    },
    previewTitle: { fontSize: t.sm, color: c.text1, fontWeight: '600' },
    previewSub: { fontSize: 11, color: c.text3, marginTop: 2 },
    // text3 rather than text4 here and on the due-chip days: these carry
    // real information someone reads, and text4 measures badly against
    // both bg1 surfaces (see the contrast pass in the previous round).
    previewMeta: { fontSize: 11, color: c.text3, fontFamily: FONTS.mono },
    previewEmpty: { fontSize: t.sm, color: c.text4, paddingHorizontal: 20, lineHeight: 19 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
    dueChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 11, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1, backgroundColor: c.bg1,
    },
    dueChipText: { fontSize: 12, fontWeight: '700' },
    dueChipDays: { fontSize: 11, color: c.text3, fontFamily: FONTS.mono },
    /* Wing (hub) styling */
    hubContainer: { paddingHorizontal: 20, marginBottom: 32 },
    hubHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    hubTitle: { fontSize: 17, fontFamily: FONTS.displaySemibold, fontWeight: '800', color: c.text1 },
    hubTagline: { fontSize: 11, color: c.text3 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    /* Featured full-width card */
    featuredCard: {
      width: '100%',
      backgroundColor: c.bg1,
      borderRadius: r.lg,
      padding: 16,
      borderWidth: 0.5,
      borderColor: c.border,
      borderLeftWidth: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    featuredLabel: { fontSize: 15, fontWeight: '700', color: c.text1, marginBottom: 2 },
    featuredDesc: { fontSize: 12, color: c.text3 },
    featuredIconBg: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
    },
    /* Standard card — flexGrow/flexBasis, not a fixed width, so a lone
       leftover item (after hiding sections, or few Library sections
       overall) stretches to fill its row instead of sitting at a fixed
       half-width next to an empty gap. Two side by side still split ~evenly. */
    standardGridSpot: { flexGrow: 1, flexBasis: '46%' },
    standardGridCard: {
      flex: 1,
      backgroundColor: c.bg1,
      borderRadius: r.lg,
      padding: 12,
      borderWidth: 0.5,
      borderColor: c.border,
      justifyContent: 'space-between',
    },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardLabel: { fontSize: 13, fontWeight: '700', color: c.text1, marginBottom: 2 },
    cardDesc: { fontSize: 11, color: c.text3, lineHeight: 15 },
  });
