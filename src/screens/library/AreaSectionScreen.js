// src/screens/library/AreaSectionScreen.js
// Reusable detail screen for any life area sub-section
// Supports: notes with categories, mood/intensity logging, habits checklist, resources

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useUIPrefs } from '../../../context/UIPrefsContext';
import { supabase } from '../../api/profileScopedClient';
import { fetchContentPool } from '../../api/remoteConfigService';
import { cacheRead, cacheWrite, isOnline, offlineWrite } from '../../api/offlineCache';
import RelatedLinks from './RelatedLinks';
import { useUserProgress } from '../../../context/UserProgressContext';
import { AREA_COLORS } from '../../data/areaColors';
import { ageBandFor, bandAllows } from '../../logic/profileResolver';
import useAreaActions from '../../logic/useAreaActions';
import ActionPanel from '../../components/lifeareas/ActionPanel';
import ActionEditSheet from '../../components/lifeareas/ActionEditSheet';
import DetailsDrawer from '../../components/lifeareas/DetailsDrawer';
import GoDeeperList from '../../components/lifeareas/GoDeeperList';

// ─── Section configs — all 18 missing sub-sections ───────────────────────────
export const SECTION_CONFIGS = {

  // ── PHYSICAL ──────────────────────────────────────────────────────────────
  SleepRecoveryScreen: {
    title: 'Sleep & Recovery', emoji: '🌙', areaId: 'physical',
    description: 'Good sleep is the foundation of everything. Log your rest and recovery habits.',
    categories: ['Sleep', 'Rest Day', 'Recovery', 'Nap', 'Wind-down'],
    habits: ['Went to bed before midnight', 'Got 7-9 hours of sleep', 'No screens 1hr before bed', 'Took a rest day from exercise', 'Used a sleep routine'],
    logFields: [
      { key: 'hours', label: 'Hours slept', type: 'number', placeholder: 'e.g. 7.5' },
      { key: 'quality', label: 'Sleep quality (1-5)', type: 'rating' },
      { key: 'note', label: 'Notes', type: 'text', placeholder: 'e.g. Woke up twice, felt groggy...' },
    ],
    tips: ['Aim for the sleep your age needs: 9–12 hours for kids, 8–10 for teens, 7 or more for adults', 'Keep the same wake time even on weekends', 'Cool, dark room improves sleep quality', 'Avoid caffeine after 2pm'],
  },

  EnergyVitalityScreen: {
    title: 'Energy & Vitality', emoji: '⚡', areaId: 'physical',
    description: 'Track your daily energy, stress on your body, and health checkups.',
    categories: ['Energy Check', 'Health Checkup', 'Stress', 'Supplements', 'Doctor Visit'],
    habits: ['Checked in on my energy levels', 'Scheduled a health checkup', 'Managed physical stress', 'Took vitamins/supplements', 'Practiced breathwork'],
    logFields: [
      { key: 'energy', label: 'Energy level (1-5)', type: 'rating' },
      { key: 'note', label: 'What affected energy today?', type: 'text', placeholder: 'e.g. Poor sleep, too much coffee, great workout...' },
    ],
    tips: ['Energy follows sleep, nutrition, and movement', 'Sunlight in the morning boosts daytime energy', 'Dehydration is a major cause of fatigue'],
  },

  // ── MENTAL ────────────────────────────────────────────────────────────────
  StressAnxietyScreen: {
    title: 'Stress & Anxiety', emoji: '🫁', areaId: 'mental',
    description: 'Understand your stress patterns and build coping strategies.',
    categories: ['Stress Log', 'Anxiety', 'Coping', 'Breathing', 'Trigger'],
    habits: ['Identified a stress trigger', 'Practiced breathing or grounding', 'Took a break when overwhelmed', 'Journaled about anxiety', 'Reached out for support'],
    logFields: [
      { key: 'stress', label: 'Stress level (1-5)', type: 'rating' },
      { key: 'trigger', label: 'What triggered it?', type: 'text', placeholder: 'e.g. Work deadline, conflict with...' },
      { key: 'coping', label: 'How did you cope?', type: 'text', placeholder: 'e.g. Went for a walk, called a friend...' },
    ],
    tips: ['Name the feeling — "I feel anxious" reduces its intensity', '4-7-8 breathing: inhale 4s, hold 7s, exhale 8s', 'Anxiety peaks and passes — ride the wave'],
    resources: [{ label: '988 Crisis Lifeline', link: 'https://988lifeline.org' }, { label: 'Anxiety & Depression Association', link: 'https://adaa.org' }],
  },

  TherapySupportScreen: {
    title: 'Therapy & Support', emoji: '🫂', areaId: 'mental',
    description: 'Track therapy sessions, support resources, and mental health goals.',
    categories: ['Therapy Session', 'Support Group', 'Self-Help', 'Crisis Resources', 'Goals'],
    habits: ['Attended therapy or counseling', 'Practiced a therapy technique', 'Read a mental health resource', 'Checked in with a support person', 'Reviewed mental health goals'],
    logFields: [
      { key: 'type', label: 'Session type', type: 'text', placeholder: 'e.g. Individual therapy, group, self-help...' },
      { key: 'note', label: 'Key takeaway or notes', type: 'text', placeholder: 'e.g. Worked on boundary setting today...' },
    ],
    tips: ['Therapy works best with consistency', 'Between sessions: practice what you discussed', 'Good mental health is maintenance, not crisis response'],
    resources: [{ label: 'Psychology Today (Find a therapist)', link: 'https://psychologytoday.com' }, { label: '988 Crisis Lifeline', link: 'https://988lifeline.org' }],
  },

  // ── SOCIAL ────────────────────────────────────────────────────────────────
  CommunicationScreen: {
    title: 'Communication', emoji: '💬', areaId: 'social',
    description: 'Build better relationships through clearer communication and healthier boundaries.',
    categories: ['Boundary', 'Conflict', 'Listening', 'Feedback', 'Conversation'],
    habits: ['Set or maintained a boundary', 'Resolved a conflict', 'Practiced active listening', 'Asked for or gave feedback', 'Had a meaningful conversation'],
    logFields: [
      { key: 'situation', label: 'What happened?', type: 'text', placeholder: 'e.g. Set a boundary with a colleague...' },
      { key: 'outcome', label: 'How did it go?', type: 'text', placeholder: 'e.g. They respected it, felt uncomfortable but...' },
    ],
    tips: ['Use "I feel" statements instead of "You always"', 'Listen to understand, not to respond', 'Boundaries are limits you set, not demands on others'],
  },

  SocialHealthScreen: {
    title: 'Social Health', emoji: '👥', areaId: 'social',
    description: 'Monitor the quality and balance of your social life.',
    categories: ['Quality Time', 'Loneliness Check', 'New Connection', 'Social Energy', 'Community'],
    habits: ['Had quality time with someone', 'Checked in on a friend', 'Did something social', 'Reflected on loneliness', 'Joined or participated in a community'],
    logFields: [
      { key: 'social', label: 'Social energy level (1-5)', type: 'rating' },
      { key: 'note', label: 'Social note', type: 'text', placeholder: 'e.g. Felt lonely this week, need to reach out more...' },
    ],
    tips: ['Loneliness is a signal, not a flaw', 'Quality over quantity — a few deep connections beat many shallow ones', 'Community involvement reduces depression risk significantly'],
  },

  // ── FINANCIAL ─────────────────────────────────────────────────────────────
  IncomeEarningsScreen: {
    title: 'Income & Earnings', emoji: '📈', areaId: 'financial',
    description: 'Track your income streams, earnings goals, and revenue growth.',
    categories: ['Salary', 'Side Income', 'Freelance', 'Passive Income', 'Goal'],
    habits: ['Tracked income this week', 'Worked on a side income stream', 'Reviewed income goals', 'Invoiced a client', 'Found a new income opportunity'],
    logFields: [
      { key: 'source', label: 'Income source', type: 'text', placeholder: 'e.g. Main job, freelance project, sales...' },
      { key: 'amount', label: 'Amount (optional)', type: 'text', placeholder: 'e.g. $500, rough estimate' },
      { key: 'note', label: 'Notes', type: 'text', placeholder: 'e.g. Closed a new client...' },
    ],
    tips: ['Multiple income streams reduce financial risk', 'Track income monthly to see real trends', 'Even $50/mo from a side hustle adds up to $600/yr'],
  },

  BudgetSpendingScreen: {
    title: 'Budget & Spending', emoji: '💳', areaId: 'financial',
    description: 'Track your spending, manage your budget, and review subscriptions.',
    categories: ['Expense', 'Budget Review', 'Subscription', 'Impulse Buy', 'Savings Win'],
    habits: ['Logged an expense', 'Reviewed monthly budget', 'Cancelled an unused subscription', 'Avoided an impulse purchase', 'Stayed on budget today'],
    logFields: [
      { key: 'category', label: 'Spending category', type: 'text', placeholder: 'e.g. Food, entertainment, bills...' },
      { key: 'amount', label: 'Amount (optional)', type: 'text', placeholder: 'e.g. $45' },
      { key: 'note', label: 'Notes', type: 'text', placeholder: 'e.g. Ate out three times, review this...' },
    ],
    tips: ['50/30/20 is a common starting split: 50% needs, 30% wants, 20% savings (reviewed 2026)', 'Review subscriptions every 3 months — cancel unused ones', 'Track spending for one week to find surprises'],
  },

  SavingsInvestingScreen: {
    title: 'Savings & Investing', emoji: '🏦', areaId: 'financial',
    description: 'Build your emergency fund, track investments, and plan for the future.',
    categories: ['Emergency Fund', 'Investment', 'Retirement', 'Goal Progress', 'Research'],
    habits: ['Added to savings today', 'Reviewed investment portfolio', 'Contributed to retirement account', 'Researched an investment', 'Set a new savings goal'],
    logFields: [
      { key: 'type', label: 'Type of saving/investing', type: 'text', placeholder: 'e.g. Emergency fund, Roth IRA, stocks...' },
      { key: 'amount', label: 'Amount saved (optional)', type: 'text', placeholder: 'e.g. $100' },
      { key: 'note', label: 'Notes', type: 'text', placeholder: 'e.g. Researched index funds today...' },
    ],
    tips: ['Many guides suggest an emergency fund of 3–6 months of essential expenses (reviewed 2026)', 'Time in the market tends to beat timing it — missing a few strong days can cost years of gains', 'An index fund holds hundreds of companies, so one failing barely moves the total'],
    resources: [{ label: 'Investopedia (Free Education)', link: 'https://investopedia.com' }],
  },

  DebtCreditScreen: {
    title: 'Debt & Credit', emoji: '🧾', areaId: 'financial',
    description: 'Track debt payoff progress, monitor credit score, and build a payoff strategy.',
    categories: ['Debt Payment', 'Credit Score', 'Payoff Strategy', 'Progress', 'Refinance'],
    habits: ['Made a debt payment', 'Checked my credit score', 'Reviewed debt balances', 'Researched refinancing options', 'Followed payoff strategy'],
    logFields: [
      { key: 'debt', label: 'Debt type', type: 'text', placeholder: 'e.g. Credit card, student loan, car...' },
      { key: 'amount', label: 'Payment amount (optional)', type: 'text', placeholder: 'e.g. $200' },
      { key: 'note', label: 'Notes', type: 'text', placeholder: 'e.g. Extra payment on card with highest rate...' },
    ],
    tips: ['Avalanche method: pay highest interest first (saves most money)', 'Snowball method: pay smallest balance first (builds momentum)', 'Check your credit report free at AnnualCreditReport.com — the official site'],
  },

  // ── CREATIVE ─────────────────────────────────────────────────────────────
  ArtMusicScreen: {
    title: 'Art & Music', emoji: '🎵', areaId: 'creative',
    description: 'Log your creative practice — music, visual art, writing, performance.',
    categories: ['Music', 'Visual Art', 'Writing', 'Performance', 'Practice'],
    habits: ['Practiced an instrument', 'Created visual art', 'Wrote something', 'Performed or rehearsed', 'Listened deeply to music'],
    logFields: [
      { key: 'type', label: 'Creative activity', type: 'text', placeholder: 'e.g. Guitar practice, sketching, journaling...' },
      { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 30 minutes, 1 hour' },
      { key: 'note', label: 'What you worked on', type: 'text', placeholder: 'e.g. Learned a new chord progression...' },
    ],
    tips: ['Consistency beats intensity — 15 minutes daily beats 2 hours once a week', 'Create without judgment first, refine later', 'Inspiration is perishable — capture ideas immediately'],
  },

  ContentMediaScreen: {
    title: 'Content & Media', emoji: '📸', areaId: 'creative',
    description: 'Track content creation, photography, video, podcasting and social media.',
    categories: ['Content Created', 'Photo/Video', 'Social Post', 'Podcast', 'Strategy'],
    habits: ['Created content today', 'Took photos or video', 'Posted to social media', 'Worked on a podcast', 'Reviewed content strategy'],
    logFields: [
      { key: 'type', label: 'Content type', type: 'text', placeholder: 'e.g. Instagram post, YouTube video, blog...' },
      { key: 'platform', label: 'Platform', type: 'text', placeholder: 'e.g. Instagram, YouTube, TikTok...' },
      { key: 'note', label: 'Notes', type: 'text', placeholder: 'e.g. Posted a short video, got 200 views...' },
    ],
    tips: ['Batch content creation — record multiple things in one session', 'Post consistently rather than perfectly', 'Repurpose content across platforms to save time'],
  },

  LearningCuriosityScreen: {
    title: 'Learning & Curiosity', emoji: '📖', areaId: 'creative',
    description: 'Log books, courses, documentaries, and deep dives into topics you love.',
    categories: ['Book', 'Course', 'Documentary', 'Article', 'Deep Dive'],
    habits: ['Read for 20+ minutes', 'Watched a documentary', 'Completed a course module', 'Explored a new topic', 'Took notes on what I learned'],
    logFields: [
      { key: 'resource', label: 'What you learned from', type: 'text', placeholder: 'e.g. Book title, course name, YouTube channel...' },
      { key: 'topic', label: 'Topic / subject', type: 'text', placeholder: 'e.g. AI, history, psychology...' },
      { key: 'note', label: 'Key takeaway', type: 'text', placeholder: 'e.g. The main insight was...' },
    ],
    tips: ['Take notes while learning — writing solidifies memory', 'Teach what you learn to retain it better', 'Curiosity compounds — follow interesting threads'],
  },

  // ── PROFESSIONAL ─────────────────────────────────────────────────────────
  BusinessVenturesScreen: {
    title: 'Business & Ventures', emoji: '🏗️', areaId: 'professional',
    description: 'Log progress on your ventures, ideas pipeline, and business goals.',
    categories: ['Main Venture', 'Side Venture', 'Idea', 'Strategy', 'Client'],
    habits: ['Worked on my main venture', 'Moved a business task forward', 'Developed a business idea', 'Connected with a potential client', 'Reviewed business strategy'],
    logFields: [
      { key: 'venture', label: 'Which venture?', type: 'text', placeholder: 'e.g. My shop, a freelance service, a new idea...' },
      { key: 'task', label: 'What you worked on', type: 'text', placeholder: 'e.g. Built the Projects screen, onboarded client...' },
      { key: 'note', label: 'Progress notes', type: 'text', placeholder: 'e.g. Milestone reached, blocker encountered...' },
    ],
    tips: ['Ship something small weekly — momentum builds', 'Document your decisions for future reference', 'Revenue solves most business problems — focus there first'],
  },

  // ── SPIRITUAL ────────────────────────────────────────────────────────────
  PurposeValuesScreen: {
    title: 'Purpose & Values', emoji: '🧭', areaId: 'spiritual',
    description: 'Clarify your core values, life mission, and what drives you every day.',
    categories: ['Values', 'Purpose', 'Mission', 'Reflection', 'Alignment'],
    habits: ['Reflected on my core values today', 'Made a decision aligned with my values', 'Wrote about my life mission', 'Felt a sense of purpose', 'Reviewed what drives me'],
    logFields: [
      { key: 'value', label: 'Value or principle', type: 'text', placeholder: 'e.g. Integrity, creativity, family first...' },
      { key: 'note', label: 'Reflection', type: 'text', placeholder: 'e.g. I acted in line with my values today by...' },
    ],
    tips: ['Values don\'t change — priorities do', 'When decisions are hard, ask: "what would my best self do?"', 'Purpose is found through action, not just reflection'],
  },

  ReflectionPrayerScreen: {
    title: 'Reflection & Prayer', emoji: '🌅', areaId: 'spiritual',
    description: 'Log daily reflections, prayer, meditation, and gratitude practices.',
    categories: ['Prayer', 'Meditation', 'Reflection', 'Gratitude', 'Scripture'],
    habits: ['Prayed or meditated today', 'Wrote a gratitude list', 'Reflected on the day', 'Read scripture or spiritual text', 'Had a moment of stillness'],
    logFields: [
      { key: 'practice', label: 'Practice type', type: 'text', placeholder: 'e.g. Morning prayer, evening reflection...' },
      { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 10 minutes' },
      { key: 'note', label: 'Reflection or gratitude', type: 'text', placeholder: 'e.g. Grateful for... / Felt at peace when...' },
    ],
    tips: ['Gratitude shifts the brain from threat to abundance in seconds', 'Consistency in spiritual practice matters more than intensity', 'Even 5 minutes of stillness daily changes your baseline'],
  },

  PhilosophyWisdomScreen: {
    title: 'Philosophy & Wisdom', emoji: '📚', areaId: 'spiritual',
    description: 'Explore philosophy, personal beliefs, wisdom from books and teachings.',
    categories: ['Philosophy', 'Book', 'Teaching', 'Belief', 'Growth Mindset'],
    habits: ['Read a philosophy or wisdom text', 'Applied a philosophical principle', 'Reflected on a teaching or belief', 'Challenged a limiting belief', 'Practiced stoicism or mindfulness'],
    logFields: [
      { key: 'source', label: 'Source or topic', type: 'text', placeholder: 'e.g. Meditations by Marcus Aurelius, Stoicism...' },
      { key: 'insight', label: 'Key insight', type: 'text', placeholder: 'e.g. Epictetus says focus only on what you control...' },
    ],
    tips: ['Philosophy is practical — it changes how you respond to life', 'Stoicism: control your reactions, not external events', 'Return to foundational texts — wisdom doesn\'t expire'],
  },

  CommunityFaithScreen: {
    title: 'Community & Faith', emoji: '⛪', areaId: 'spiritual',
    description: 'Log participation in faith community, service, giving, and shared beliefs.',
    categories: ['Faith Community', 'Service', 'Giving', 'Worship', 'Fellowship'],
    habits: ['Attended a faith gathering', 'Volunteered or gave back', 'Prayed with others', 'Supported someone in my community', 'Gave financially or materially'],
    logFields: [
      { key: 'activity', label: 'Activity', type: 'text', placeholder: 'e.g. Church service, volunteering, bible study...' },
      { key: 'note', label: 'Notes or reflections', type: 'text', placeholder: 'e.g. Felt connected, message was about...' },
    ],
    tips: ['Community faith reduces isolation and builds resilience', 'Service shifts focus outward — reduces anxiety', 'Even small acts of giving create meaning'],
  },

  // ── DIGITAL ──────────────────────────────────────────────────────────────
  ScreenTimeFocusScreen: {
    title: 'Screen Time & Focus', emoji: '📱', areaId: 'digital',
    description: 'Track app usage, set limits, and protect your attention from distractions.',
    categories: ['Screen Time', 'Focus Block', 'Social Media', 'Digital Detox', 'Productivity'],
    habits: ['Stayed within screen time limits', 'Did a focus block without phone', 'Deleted or muted a distracting app', 'Took a social media break', 'Used phone in grayscale mode'],
    logFields: [
      { key: 'screen_time', label: 'Total screen time today', type: 'text', placeholder: 'e.g. 3h 20min (check Settings > Screen Time)' },
      { key: 'focus', label: 'Focus blocks completed', type: 'text', placeholder: 'e.g. 2 x 45min sessions' },
      { key: 'note', label: 'Notes', type: 'text', placeholder: 'e.g. Spent too long on TikTok, need to set limit...' },
    ],
    tips: ['Turn off all notifications except calls and messages', 'Put your phone in another room during deep work', 'Grayscale mode makes your phone less addictive — try it'],
  },

  ToolsSystemsScreen: {
    title: 'Tools & Systems', emoji: '⚙️', areaId: 'digital',
    description: 'Build your productivity stack — task management, notes, automation, and workflows.',
    categories: ['Productivity', 'Automation', 'Notes System', 'Task System', 'Review'],
    habits: ['Reviewed and updated my task system', 'Set up or improved an automation', 'Organized digital notes', 'Cleared email or messages inbox', 'Reviewed my weekly system'],
    logFields: [
      { key: 'tool', label: 'Tool or system', type: 'text', placeholder: 'e.g. Notion, CT App, Zapier, n8n...' },
      { key: 'what', label: 'What you did with it', type: 'text', placeholder: 'e.g. Set up an automation for new leads...' },
      { key: 'note', label: 'Notes', type: 'text', placeholder: 'e.g. Saved 30min/week with this...' },
    ],
    tips: ['A system you use is better than a perfect one you don\'t', 'Automate anything you do the same way 3+ times', 'Weekly review is the glue that holds any system together'],
  },
};

// ─── Rating component ─────────────────────────────────────────────────────────
function RatingInput({ label, value, onChange, color, c, t, s }) {
  return (
    <View style={{ marginBottom: s.md }}>
      <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1,2,3,4,5].map(v => (
          <TouchableOpacity key={v} onPress={() => onChange(v)}
            style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: value >= v ? color : color + '18', borderWidth: 1, borderColor: color + '55', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: t.sm, fontWeight: t.bold, color: value >= v ? '#fff' : color }}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Main AreaSectionScreen ───────────────────────────────────────────────────
export default function AreaSectionScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();

  // Determine which config to use — passed via route params OR via screenName
  const screenName = route.params?.screenName || route.name;
  const config = SECTION_CONFIGS[screenName];
  const { profile } = useUserProgress();
  const band = ageBandFor(profile);

  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [userId,   setUserId]   = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [showHabit,setShowHabit]= useState(false);
  const [category, setCategory] = useState('');
  const [fields,   setFields]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Tips — remote pool from Supabase (app_content, type='area_tip',
  // key=screenName), seeded with this section's hardcoded tips so there's
  // no empty flash before the fetch resolves and no regression if it fails.
  const [tips, setTips] = useState(config?.tips || []);

  // meta.age_bands on a tip limits who sees it (a debt-payoff method isn't
  // for a ten-year-old). No bands means everyone.
  useEffect(() => {
    if (!screenName) return;
    fetchContentPool('area_tip', screenName).then((rows) => {
      const mine = rows.filter((r) => bandAllows(r.meta?.age_bands, band));
      if (mine.length) setTips(mine.map((r) => r.body));
    });
  }, [screenName, band]);

  // The action panel. Completions it logs go straight into this screen's
  // history, so the Log tab shows them without a refetch.
  const aa = useAreaActions({
    screenTag: screenName,
    areaId: config?.areaId,
    navigation,
    onLogged: row => setEntries(prev => [row, ...prev]),
  });

  if (!config) return null;
  const color = AREA_COLORS[config.areaId];

  useEffect(() => {
    setCategory(config.categories[0]);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); load(user.id); }
      else setLoading(false);
    });
  }, []);

  const load = async (uid) => {
    setLoading(true);
    const cacheKey = `area_section_${uid}_${screenName}`;
    const cached = await cacheRead(cacheKey);
    if (cached) setEntries(cached);

    if (await isOnline()) {
      const { data } = await supabase.from('area_notes').select('*')
        .eq('user_id', uid).eq('area_id', config.areaId)
        .ilike('content', `%[${screenName}]%`)
        .order('created_at', { ascending: false }).limit(30);
      if (data) { setEntries(data); cacheWrite(cacheKey, data); }
    }
    setLoading(false);
  };

  const saveEntry = async () => {
    setSaving(true);
    const payload = { category, ...fields };
    const content = `[${screenName}][${category}] ${Object.entries(fields).filter(([k,v]) => v?.toString().trim()).map(([k,v]) => `${k}: ${v}`).join(' | ')}`;
    const entry = { user_id: userId, area_id: config.areaId, content, created_at: new Date().toISOString() };
    if (userId) {
      const { row: data } = await offlineWrite(supabase, 'area_notes', entry);
      if (data) setEntries(prev => [data, ...prev]);
    } else {
      setEntries(prev => [{ ...entry, id: Date.now().toString() }, ...prev]);
    }
    setFields({}); setShowAdd(false); setSaving(false);
  };

  const logHabit = async (habit) => {
    const entry = { user_id: userId, area_id: config.areaId, content: `[${screenName}][Habit] ✅ ${habit}`, created_at: new Date().toISOString() };
    if (userId) {
      const { row: data } = await offlineWrite(supabase, 'area_notes', entry);
      if (data) setEntries(prev => [data, ...prev]);
    } else {
      setEntries(prev => [{ ...entry, id: Date.now().toString() }, ...prev]);
    }
  };

  const del = async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (userId) await supabase.from('area_notes').delete().eq('id', id);
  };

  const parseEntry = (content) => {
    // Remove the screen name and category tags
    return content.replace(/\[[^\]]+\]/g, '').trim();
  };

  const getCategory = (content) => {
    const match = content.match(/\[([^\]]+)\]\[([^\]]+)\]/);
    return match ? match[2] : '';
  };

  // Group by date
  const grouped = entries.reduce((acc, e) => {
    const date = new Date(e.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(e);
    return acc;
  }, {});

  // The old tabs, unchanged, now inside the Details & history drawer.
  const renderLog = () => (
    <>
      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: s.md }}>
        <View style={{ flexDirection: 'row', gap: s.sm }}>
          {config.categories.map(cat => (
            <TouchableOpacity key={cat} onPress={() => setCategory(cat)}
              style={{ paddingHorizontal: s.md, paddingVertical: 6, borderRadius: r.full, borderWidth: 1, borderColor: category === cat ? color : c.border, backgroundColor: category === cat ? color + '22' : 'transparent' }}>
              <Text style={{ fontSize: t.xs, color: category === cat ? color : c.text3, fontWeight: category === cat ? t.bold : t.regular }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add entry button */}
      <TouchableOpacity onPress={() => setShowAdd(!showAdd)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: color + '18', borderRadius: r.md, padding: s.md, borderWidth: 1, borderColor: color + '33', borderStyle: 'dashed', marginBottom: s.md }}>
        <Ionicons name="add-circle" size={18} color={color} />
        <Text style={{ color, fontWeight: '600', fontSize: t.sm }}>Add {category} entry</Text>
      </TouchableOpacity>

      {/* Add form */}
      {showAdd && (
        <View style={{ backgroundColor: c.bg1, borderRadius: r.lg, padding: s.lg, marginBottom: s.md, borderWidth: 1, borderColor: color + '44' }}>
          {config.logFields.map(field => (
            <View key={field.key} style={{ marginBottom: s.md }}>
              {field.type === 'rating' ? (
                <RatingInput label={field.label} value={fields[field.key] || 0}
                  onChange={v => setFields(prev => ({ ...prev, [field.key]: v }))}
                  color={color} c={c} t={t} s={s} />
              ) : (
                <>
                  <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: 6 }}>{field.label}</Text>
                  <TextInput
                    style={{ backgroundColor: c.bg0, borderRadius: r.md, padding: s.md, fontSize: t.sm, color: c.text1, borderWidth: 1, borderColor: c.border, minHeight: field.type === 'text' ? 50 : 44, textAlignVertical: field.type === 'text' ? 'top' : 'center' }}
                    value={fields[field.key] || ''}
                    onChangeText={v => setFields(prev => ({ ...prev, [field.key]: v }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={c.text4}
                    multiline={field.type === 'text'}
                    keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
                  />
                </>
              )}
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <TouchableOpacity onPress={() => { setShowAdd(false); setFields({}); }}
              style={{ flex: 1, padding: s.md, alignItems: 'center', backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border }}>
              <Text style={{ color: c.text3 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveEntry} disabled={saving}
              style={{ flex: 2, padding: s.md, alignItems: 'center', backgroundColor: color, borderRadius: r.md, opacity: saving ? 0.6 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: t.bold }}>Save Entry</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Entries feed */}
      {loading ? <ActivityIndicator color={color} style={{ marginTop: 20 }} /> : (
        Object.keys(grouped).length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            {showEmojis ? <Text style={{ fontSize: 44, marginBottom: s.sm }}>{config.emoji}</Text> : <Ionicons name="list-outline" size={40} color={color} style={{ marginBottom: s.sm }} />}
            <Text style={{ fontSize: t.md, fontWeight: t.bold, color: c.text1, marginBottom: s.xs }}>No entries yet</Text>
            <Text style={{ fontSize: t.sm, color: c.text3, textAlign: 'center' }}>Tap above to start logging your {config.title.toLowerCase()}.</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([date, dayEntries]) => (
            <View key={date} style={{ marginBottom: s.lg }}>
              <Text style={{ fontSize: t.xs, color, fontWeight: t.bold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: s.sm }}>{date}</Text>
              {dayEntries.map(entry => (
                <View key={entry.id} style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: color }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <View style={{ backgroundColor: color + '22', borderRadius: r.full, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, color, fontWeight: t.bold }}>{getCategory(entry.content)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => del(entry.id)}>
                      <Ionicons name="close" size={14} color={c.text4} />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20 }}>{parseEntry(entry.content)}</Text>
                  <Text style={{ fontSize: 10, color: c.text4, marginTop: 4 }}>
                    {new Date(entry.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )
      )}
    </>
  );

  const renderHabits = () => (
    <>
      <Text style={{ fontSize: t.xs, color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.md }}>
        Tap to log a habit completion
      </Text>
      {config.habits.map((habit, i) => (
        <TouchableOpacity key={i} onPress={() => logHabit(habit)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color + '22', borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={16} color={color} />
          </View>
          <Text style={{ flex: 1, fontSize: t.sm, color: c.text1 }}>{habit}</Text>
          <Ionicons name="chevron-forward" size={14} color={c.text4} />
        </TouchableOpacity>
      ))}

      {/* Recent habit completions */}
      {entries.filter(e => e.content.includes('[Habit]')).length > 0 && (
        <>
          <Text style={{ fontSize: t.xs, color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginTop: s.lg, marginBottom: s.sm }}>Recent</Text>
          {entries.filter(e => e.content.includes('[Habit]')).slice(0, 5).map(entry => (
            <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, backgroundColor: c.bg1, borderRadius: r.md, padding: s.md, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
              <Ionicons name="checkmark-circle" size={18} color={color} />
              <Text style={{ flex: 1, fontSize: t.sm, color: c.text2 }}>{entry.content.replace(/\[[^\]]+\]/g, '').replace('✅', '').trim()}</Text>
              <Text style={{ fontSize: 10, color: c.text4 }}>
                {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          ))}
        </>
      )}
    </>
  );

  const renderTips = () => (
    <>
      <Text style={{ fontSize: t.xs, color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginBottom: s.md }}>
        {showEmojis ? '💡 ' : ''}Tips for {config.title}
      </Text>
      {tips.map((tip, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: s.md, backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border, borderLeftWidth: 3, borderLeftColor: color }}>
          <Text style={{ fontSize: t.md, color }}>{i + 1}</Text>
          <Text style={{ flex: 1, fontSize: t.sm, color: c.text2, lineHeight: 22 }}>{tip}</Text>
        </View>
      ))}
    </>
  );

  const renderDeeper = () => (
    <>
      <GoDeeperList resources={aa.resources} extra={config.resources || []} color={color} />
      <Text style={{ fontSize: t.xs, color, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: t.bold, marginTop: s.xl, marginBottom: s.md }}>
        Linked in the app
      </Text>
      <RelatedLinks areaId={config.areaId} color={color} c={c} t={t} s={s} r={r} />
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      {/* Header */}
      <View style={{ backgroundColor: c.bg1, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <View style={{ padding: s.lg, paddingTop: s.xxl }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: s.sm }}>
            <Ionicons name="chevron-back" size={20} color={color} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, marginBottom: s.sm }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: color + '22', borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
              {showEmojis ? <Text style={{ fontSize: 24 }}>{config.emoji}</Text> : <Ionicons name="list-outline" size={22} color={color} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: t.xl, fontWeight: t.bold, color: c.text1 }}>{config.title}</Text>
              {showSubtext && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{config.description}</Text>}
            </View>
          </View>
        </View>
      </View>

      <ScrollView automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.lg, paddingBottom: 60, gap: s.xl }} showsVerticalScrollIndicator={false}>
        <ActionPanel aa={aa} color={color} onEdit={() => setEditOpen(true)} />
        <DetailsDrawer
          color={color}
          summary="Links for going deeper, tips, your log and habits"
          initialTab="deeper"
          tabs={[
            { key: 'deeper', label: 'Go deeper', render: renderDeeper },
            { key: 'tips', label: 'Tips', render: renderTips },
            { key: 'log', label: 'Log', render: renderLog },
            { key: 'habits', label: 'Habits', render: renderHabits },
          ]}
        />
      </ScrollView>

      <ActionEditSheet visible={editOpen} onClose={() => setEditOpen(false)} aa={aa} color={color} title={config.title} />
    </View>
  );
}
