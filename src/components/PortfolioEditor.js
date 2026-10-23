// src/components/PortfolioEditor.js
// The founder's portfolio builder panels (descartes_onboarding_portfolio_builder.html),
// in the app's theme: Theme & Aesthetic, Component Visibility, Hero Details,
// Skills Badges, Project Cards, Current Phase, Philosophy Quote and Contact
// Links. Every edit shows in the live preview at once.
//
// Words and lists are free to change. The look is the page Build's parts
// (src/data/builds.js): the everyday options are open, and an upgrade opens
// right here by answering that part's one question (PartPicker).
//
// Text fields keep their own draft, so typing a space at the end of a word
// isn't trimmed away by the Build's clean-up (src/logic/builds.js squeeze).
//
// Used by the welcome's builder (ProjectWorkspace) and the Studio's
// BuildScreen (look={false}: the Studio has its own "Take it apart").

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import PartPicker from './PartPicker';
import TourSpot from './TourSpot';
import { kindOf, setAnswers, setContent, PAGE_LIMITS } from '../logic/builds';

const SECTIONS = [
  ['hero', 'Hero section'], ['skills', 'Skills matrix'], ['projects', 'Featured projects'],
  ['timeline', 'Life stage timeline'], ['quote', 'Descartes quote'], ['dream', 'Where I’m headed'], ['contact', 'Contact card'],
];

export function Panel({ icon, title, action, children }) {
  const { colors: c, typography: t, spacing: s, radius: r, shadows, accent } = useTheme();
  return (
    <View style={[{ backgroundColor: c.bg1, borderRadius: r.xl, padding: s.lg, marginTop: s.md, borderWidth: 1, borderColor: c.border }, shadows.sm]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, marginBottom: s.md }}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: accent.primary + '1f', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={15} color={accent.primary} />
        </View>
        <Text style={{ flex: 1, fontSize: t.sm, fontWeight: t.bold, color: c.text1, letterSpacing: 0.3 }}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Field({ label, value, onChangeText, placeholder, multiline, max, keyboardType }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  return (
    <View style={{ marginBottom: s.sm }}>
      {!!label && <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: 4 }}>{label}</Text>}
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={c.text3}
        multiline={multiline} maxLength={max} keyboardType={keyboardType} accessibilityLabel={label || placeholder}
        style={{ backgroundColor: c.bg0, borderWidth: 1, borderColor: c.border, borderRadius: r.md, paddingHorizontal: s.md, paddingVertical: 10,
          fontSize: t.sm, color: c.text1, minHeight: multiline ? 64 : undefined, textAlignVertical: multiline ? 'top' : 'center' }} />
    </View>
  );
}

const draftOf = (build) => {
  const ct = build?.content || {};
  return {
    name: build?.answers?.name || '', line: build?.answers?.line || '',
    bio: ct.bio || '', cta: ct.cta || '', quote: ct.quote || '', email: ct.email || '', github: ct.github || '',
    stage: { title: '', sub: '', desc: '', ...ct.stage },
    projects: (ct.projects || []).map(p => ({ ...p })),
  };
};

// `lookSpot`: mark the theme panel for the welcome's tips (welcome-project-look).
export default function PortfolioEditor({ build, onChange, look = true, lookSpot = false, onPicked }) {
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const kind = kindOf(build);
  const [draft, setDraft] = useState(() => draftOf(build));
  const [newSkill, setNewSkill] = useState('');
  // A different Build (the welcome swapped projects) starts a fresh draft.
  const forId = useRef(build.id);
  useEffect(() => {
    if (forId.current !== build.id) { forId.current = build.id; setDraft(draftOf(build)); }
  }, [build]);

  if (!build?.content || !kind) return null;
  const content = build.content;

  // One edit: the draft keeps exactly what they typed, the Build gets it clean.
  const edit = (patch) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    let b = build;
    if ('name' in patch || 'line' in patch) b = setAnswers(b, { name: next.name, line: next.line });
    const contentPatch = {};
    ['bio', 'cta', 'quote', 'email', 'github', 'stage', 'projects'].forEach(k => { if (k in patch) contentPatch[k] = next[k]; });
    if (Object.keys(contentPatch).length) b = setContent(b, contentPatch);
    onChange(b);
  };
  const setSection = (k, on) => onChange(setContent(build, { sections: { ...content.sections, [k]: on } }));
  const addSkill = () => {
    const v = newSkill.trim();
    if (!v || content.skills.length >= PAGE_LIMITS.skills) return;
    setNewSkill('');
    onChange(setContent(build, { skills: [...content.skills, v] }));
  };
  const removeSkill = (i) => onChange(setContent(build, { skills: content.skills.filter((_, j) => j !== i) }));
  const setProject = (i, patch) => edit({ projects: draft.projects.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const addProject = () => {
    if (draft.projects.length >= PAGE_LIMITS.projects) return;
    edit({ projects: [...draft.projects, { title: 'New project', desc: 'What it is and what it does.', tag: 'General' }] });
  };
  const removeProject = (i) => edit({ projects: draft.projects.filter((_, j) => j !== i) });

  const link = (label, onPress, a11y) => (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y || label} hitSlop={8}>
      <Text style={{ fontSize: t.xs, fontWeight: t.bold, color: accent.primary }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      {look && (
        <Panel icon="color-palette-outline" title="Theme & aesthetic">
          {kind.parts.map((p, i) => {
            const picker = <PartPicker key={p.id} build={build} part={p} onChange={onChange} onPicked={onPicked} />;
            // The tip points at the first row only (the palettes): the
            // whole panel is too tall to talk beside on a phone.
            return lookSpot && i === 0 ? <TourSpot key={p.id} id="welcome-project-look">{picker}</TourSpot> : picker;
          })}
        </Panel>
      )}

      <Panel icon="layers-outline" title="Component visibility">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
          {SECTIONS.map(([k, label]) => {
            const on = content.sections[k] !== false;
            return (
              <TouchableOpacity key={k} onPress={() => setSection(k, !on)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={label}
                style={{ flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: s.sm, padding: s.sm, borderRadius: r.md,
                  backgroundColor: on ? accent.primary + '12' : c.bg0, borderWidth: 1, borderColor: on ? accent.primary + '66' : c.border }}>
                <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18} color={on ? accent.primary : c.text3} />
                <Text style={{ flex: 1, fontSize: t.xs, fontWeight: t.semibold, color: on ? c.text1 : c.text3 }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Panel>

      <Panel icon="person-outline" title="Hero details">
        <Field label="Your name" value={draft.name} onChangeText={v => edit({ name: v })} placeholder="e.g. Sam Rivera" max={40} />
        <Field label="Headline / role" value={draft.line} onChangeText={v => edit({ line: v })} placeholder="e.g. Student & Web Developer" max={90} />
        <Field label="Personal bio" value={draft.bio} onChangeText={v => edit({ bio: v })} placeholder="Two lines about what you build" multiline max={240} />
        <Field label="Call-to-action button" value={draft.cta} onChangeText={v => edit({ cta: v })} placeholder="View My Projects" max={40} />
      </Panel>

      <Panel icon="flash-outline" title="Skills badges">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {content.skills.map((sk, i) => (
            <View key={`${sk}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 10, paddingRight: 6, paddingVertical: 6, borderRadius: r.md, backgroundColor: c.bg0, borderWidth: 1, borderColor: c.border }}>
              <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text1 }}>{sk}</Text>
              <TouchableOpacity onPress={() => removeSkill(i)} accessibilityRole="button" accessibilityLabel={`Remove ${sk}`} hitSlop={8}>
                <Ionicons name="close" size={14} color={c.text3} />
              </TouchableOpacity>
            </View>
          ))}
          {!content.skills.length && <Text style={{ fontSize: t.xs, color: c.text3 }}>No skills yet. Add your first.</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.sm }}>
          <View style={{ flex: 1 }}>
            <Field value={newSkill} onChangeText={setNewSkill} placeholder="Add a skill, e.g. Photography" max={40} />
          </View>
          <TouchableOpacity onPress={addSkill} accessibilityRole="button" accessibilityLabel="Add skill"
            style={{ height: 40, paddingHorizontal: s.md, borderRadius: r.md, backgroundColor: accent.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={18} color={accent.onPrimary} />
          </TouchableOpacity>
        </View>
      </Panel>

      <Panel icon="rocket-outline" title="Project cards" action={draft.projects.length < PAGE_LIMITS.projects ? link('+ Add project', addProject, 'Add a project card') : null}>
        {draft.projects.map((p, i) => (
          <View key={i} style={{ padding: s.sm, borderRadius: r.md, backgroundColor: c.bg0, borderWidth: 1, borderColor: c.border, marginBottom: s.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: s.sm }}>
              <View style={{ flex: 1 }}>
                <Field value={p.title} onChangeText={v => setProject(i, { title: v })} placeholder="Project title" max={60} />
              </View>
              <TouchableOpacity onPress={() => removeProject(i)} accessibilityRole="button" accessibilityLabel={`Remove ${p.title || 'project'}`} hitSlop={8} style={{ paddingTop: 10 }}>
                <Ionicons name="trash-outline" size={16} color={c.text3} />
              </TouchableOpacity>
            </View>
            <Field value={p.desc} onChangeText={v => setProject(i, { desc: v })} placeholder="Short description" max={160} />
            <Field value={p.tag} onChangeText={v => setProject(i, { tag: v })} placeholder="Category tag" max={30} />
          </View>
        ))}
        {!draft.projects.length && <Text style={{ fontSize: t.xs, color: c.text3 }}>No project cards. The section hides until you add one.</Text>}
      </Panel>

      <Panel icon="school-outline" title="Current phase">
        <Field label="Stage" value={draft.stage.title} onChangeText={v => edit({ stage: { ...draft.stage, title: v } })} placeholder="e.g. College Student" max={40} />
        <Field label="Focus" value={draft.stage.sub} onChangeText={v => edit({ stage: { ...draft.stage, sub: v } })} placeholder="e.g. University / Training" max={60} />
        <Field label="What you're doing now" value={draft.stage.desc} onChangeText={v => edit({ stage: { ...draft.stage, desc: v } })} placeholder="One line" multiline max={160} />
      </Panel>

      <Panel icon="chatbubble-ellipses-outline" title="Philosophy quote">
        <Field value={draft.quote} onChangeText={v => edit({ quote: v })} placeholder="It is not enough to have a good mind; the main thing is to use it well." multiline max={160} />
      </Panel>

      <Panel icon="mail-outline" title="Contact links">
        <Field label="Email" value={draft.email} onChangeText={v => edit({ email: v })} placeholder="you@example.com" keyboardType="email-address" max={80} />
        <Field label="GitHub or website" value={draft.github} onChangeText={v => edit({ github: v })} placeholder="github.com/you" max={80} />
        <Text style={{ fontSize: t.xs, color: c.text3 }}>Only what you fill in shows on your page.</Text>
      </Panel>
    </View>
  );
}
