// src/screens/classes/entrepreneurClass/ModuleScreen.js
// One module, rendered as a full readable page rather than a stack of cards.
//
// The card format works for a K-12 topic where the point is a concept and a
// quiz. It does not work for "how do I actually structure a business", where
// someone needs the reasoning, a worked example with real numbers, the
// mistakes people make, and then a set of steps to follow. So this screen is
// built for reading: prose sections, then the hands-on exercise, then the
// Vault artifact it produces.
//
// Modules with a written version (src/data/curriculum/modules/) render in
// full. Modules without one fall back to their structural version — shorter,
// but complete and still producing its deliverables. Nothing is ever a dead
// end waiting on content.

import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../../context/ThemeContext';
import { useUIPrefs } from '../../../../context/UIPrefsContext';
import { getLevel, DISCLAIMER } from '../../../data/ownershipCurriculum';
import { getModuleContent } from '../../../data/curriculum/moduleContent';
import { buildGuideLessonSteps } from '../../../data/curriculum/guideLessons';
import { useTour } from '../../../../context/TourContext';
import VaultExercise from '../../../components/VaultExercise';
import LessonQuiz from '../../../components/LessonQuiz';
import { FONTS } from '../../../theme';
import { usePlus } from '../../../../context/PlusContext';
import { isLessonFree } from '../../../logic/plusContent';

export default function ModuleScreen() {
  const { colors: c, typography: t, spacing: s, radius: r, shadows: sh } = useTheme();
  const { showEmojis } = useUIPrefs();
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const scrollRef = useRef(null);

  const { levelId, moduleIndex } = route.params || {};
  const level = getLevel(levelId);
  const structural = level?.modules?.[moduleIndex];
  const written = getModuleContent(levelId, moduleIndex);

  // Which lesson is expanded. Long-form lessons are long, so they open one at
  // a time — the alternative is a page nobody can navigate.
  const [openLesson, setOpenLesson] = useState(0);

  // Short-form walkthrough: the guide summarises this module in a few speech
  // bubbles and asks a couple of questions. Offered only where content
  // exists (src/data/curriculum/guideLessons.js) — a module without an entry
  // simply doesn't show the button, rather than opening an empty tour.
  const { startLesson } = useTour();
  const { contentLocked } = usePlus();
  const guideSteps = buildGuideLessonSteps(levelId, moduleIndex, {
    moduleTitle: structural?.title?.replace(/^Module \d+:\s*/, ''),
    disclaimer: DISCLAIMER,
  });

  const st = makeStyles(c, t, s, r, sh, width);

  if (!level || !structural) {
    return (
      <View style={[st.container, { alignItems: 'center', justifyContent: 'center', padding: s.xl }]}>
        <Text style={st.bodyText}>That module could not be found.</Text>
      </View>
    );
  }

  const color = level.color;
  // Written lessons are merged over their structural counterpart by key, so a
  // long-form page only has to supply depth — prose, examples, a quiz, the
  // step-by-step work — and inherits action, checklist and deliverable from
  // the structural level. That keeps the Vault contract (what gets saved,
  // under which title, counted toward which gate) in exactly one place.
  // Pages that do set their own checklist still win, since written overrides.
  const structuralByKey = Object.fromEntries(structural.lessons.map(l => [l.key, l]));
  const lessons = written?.lessons
    ? written.lessons.map(l => ({ ...structuralByKey[l.key], ...l }))
    : structural.lessons;
  const moduleNumber = moduleIndex + 1;

  // Plus: past the level's free first lesson, lessons show their title and
  // what they're for, but open the paywall instead of the lesson.
  const lessonLocked = (li) => contentLocked && !isLessonFree(level.modules, moduleIndex, li);
  const moduleLocked = lessons.every((_, li) => lessonLocked(li));
  const anyLocked = lessons.some((_, li) => lessonLocked(li));
  const openPlus = () => navigation.navigate('Plus', { from: 'business' });
  const totalModules = level.modules.length;

  const goToModule = (idx) => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setOpenLesson(0);
    navigation.setParams({ levelId, moduleIndex: idx });
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={st.container}
      contentContainerStyle={{ paddingBottom: 56 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={color} />
        </TouchableOpacity>
        <Text style={[st.kicker, { color }]}>
          {level.short} · Module {moduleNumber} of {totalModules}
        </Text>
        <Text style={st.title}>{structural.title.replace(/^Module \d+:\s*/, '')}</Text>
        <Text style={st.objective}>{written?.objective || structural.objective}</Text>

        {/* Two minutes, guide-narrated, with a couple of checks — for
            someone who wants the shape of the module before committing to
            the full read (or who is on a bus). */}
        {guideSteps && !moduleLocked && (
          <TouchableOpacity
            onPress={() => startLesson(guideSteps)}
            accessibilityRole="button"
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
              marginTop: 14, paddingVertical: 9, paddingHorizontal: 14,
              borderRadius: 20, borderWidth: 1, borderColor: color,
            }}>
            <Ionicons name="chatbubbles-outline" size={15} color={color} />
            <Text style={{ fontSize: 13, fontWeight: '700', color }}>Teach me this · 2 min</Text>
          </TouchableOpacity>
        )}
        {!!written?.duration && (
          <View style={st.metaRow}>
            <Ionicons name="time-outline" size={13} color={c.text4} />
            <Text style={st.metaText}>{written.duration}</Text>
            <Text style={st.metaDot}>·</Text>
            <Ionicons name="document-text-outline" size={13} color={c.text4} />
            <Text style={st.metaText}>{lessons.length} lessons</Text>
          </View>
        )}
      </View>

      {/* ── Intro ────────────────────────────────────────────────────── */}
      {written?.intro?.length > 0 && !moduleLocked && (
        <View style={[st.card, { borderLeftColor: color }]}>
          {written.intro.map((para, i) => (
            <Text key={i} style={[st.bodyText, i > 0 && { marginTop: 12 }]}>{para}</Text>
          ))}
        </View>
      )}

      {/* Modules without written content say so plainly rather than looking
          broken or half-finished. */}
      {anyLocked && (
        <TouchableOpacity onPress={openPlus} activeOpacity={0.85} style={[st.noticeCard, { borderLeftColor: c.gold }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="star" size={15} color={c.gold} />
            <Text style={[st.noticeText, { flex: 1 }]}>
              {moduleLocked
                ? 'This module is part of Plus. The first lesson of every level is free to try.'
                : 'This lesson is free. The rest of the level is part of Plus.'}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: c.gold }}>See Plus</Text>
          </View>
        </TouchableOpacity>
      )}

      {!written && !moduleLocked && (
        <View style={[st.noticeCard, { borderLeftColor: c.text4 }]}>
          <Text style={st.noticeText}>
            The full written guide for this module is still being written. Everything below is complete and
            usable — the lessons, the hands-on work, and the Vault deliverables all function. What's missing
            is the long-form explanation around them.
          </Text>
        </View>
      )}

      {/* ── Lessons ──────────────────────────────────────────────────── */}
      {lessons.map((lesson, li) => {
        const locked = lessonLocked(li);
        const isOpen = openLesson === li && !locked;
        return (
          <View key={lesson.key} style={[st.lessonCard, { borderTopColor: color }]}>
            <TouchableOpacity
              onPress={() => (locked ? openPlus() : setOpenLesson(isOpen ? -1 : li))}
              activeOpacity={0.75}
              style={st.lessonHead}
            >
              <View style={[st.lessonNum, { backgroundColor: isOpen ? color : color + '22' }]}>
                <Text style={[st.lessonNumText, { color: isOpen ? '#fff' : color }]}>{li + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.lessonTitle}>{lesson.title}</Text>
                <Text style={st.lessonObjective} numberOfLines={isOpen ? 0 : 2}>{lesson.objective}</Text>
              </View>
              {locked
                ? <Ionicons name="lock-closed" size={16} color={c.gold} accessibilityLabel="Plus" />
                : <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={17} color={c.text4} />}
            </TouchableOpacity>

            {isOpen && (
              <View style={st.lessonBody}>
                {/* Prose sections */}
                {lesson.sections?.map((sec, i) => (
                  <View key={i} style={{ marginBottom: 18 }}>
                    <Text style={[st.sectionHeading, { color }]}>{sec.heading}</Text>
                    {sec.body.split('\n\n').map((para, pi) => (
                      <Text key={pi} style={[st.bodyText, pi > 0 && { marginTop: 10 }]}>{para}</Text>
                    ))}
                  </View>
                ))}

                {/* Key terms */}
                {lesson.keyTerms?.length > 0 && (
                  <View style={st.termsBox}>
                    <Text style={st.boxLabel}>Key terms</Text>
                    {lesson.keyTerms.map((kt, i) => (
                      <View key={i} style={{ marginTop: i ? 8 : 4 }}>
                        <Text style={[st.termName, { color }]}>{kt.term}</Text>
                        <Text style={st.termDef}>{kt.definition}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Worked example */}
                {lesson.example && (
                  <View style={[st.exampleBox, { borderLeftColor: color }]}>
                    <Text style={[st.exampleTitle, { color }]}>{showEmojis ? '🧮 ' : ''}{lesson.example.title}</Text>
                    {lesson.example.body.split('\n\n').map((para, pi) => (
                      <Text key={pi} style={[st.exampleText, pi > 0 && { marginTop: 10 }]}>{para}</Text>
                    ))}
                  </View>
                )}

                {/* Common mistakes */}
                {lesson.pitfalls?.length > 0 && (
                  <View style={st.pitfallBox}>
                    <Text style={[st.boxLabel, { color: c.error }]}>Common mistakes</Text>
                    {lesson.pitfalls.map((p, i) => (
                      <View key={i} style={st.pitfallRow}>
                        <Ionicons name="alert-circle-outline" size={14} color={c.error} style={{ marginTop: 2 }} />
                        <Text style={st.pitfallText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Mini quiz — between the reading and the doing, so the
                    misconception gets corrected before it goes into the
                    worksheet. */}
                {lesson.quiz?.length > 0 && <LessonQuiz questions={lesson.quiz} color={color} />}

                {/* Hands-on work — the part that produces the Vault artifact */}
                <VaultExercise
                  lesson={lesson}
                  levelId={levelId}
                  color={color}
                />
              </View>
            )}
          </View>
        );
      })}

      {/* ── Wrap-up ──────────────────────────────────────────────────── */}
      {written?.wrapUp?.length > 0 && !anyLocked && (
        <View style={[st.card, { borderLeftColor: color, marginTop: s.md }]}>
          <Text style={[st.sectionHeading, { color }]}>Where this leaves you</Text>
          {written.wrapUp.map((para, i) => (
            <Text key={i} style={[st.bodyText, i > 0 && { marginTop: 10 }]}>{para}</Text>
          ))}
        </View>
      )}

      {/* ── Module navigation ────────────────────────────────────────── */}
      <View style={st.navRow}>
        <TouchableOpacity
          disabled={moduleIndex === 0}
          onPress={() => goToModule(moduleIndex - 1)}
          style={[st.navBtn, moduleIndex === 0 && { opacity: 0.35 }]}
        >
          <Ionicons name="arrow-back" size={15} color={c.text2} />
          <Text style={st.navText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={moduleIndex >= totalModules - 1}
          onPress={() => goToModule(moduleIndex + 1)}
          style={[st.navBtn, moduleIndex >= totalModules - 1 && { opacity: 0.35 }]}
        >
          <Text style={st.navText}>Next module</Text>
          <Ionicons name="arrow-forward" size={15} color={c.text2} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c, t, s, r, sh, width) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg0 },

  header: { paddingHorizontal: s.lg, paddingTop: s.lg, paddingBottom: s.sm },
  kicker: {
    fontSize: 10, fontFamily: FONTS.mono, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 6,
  },
  title: { fontSize: 24, fontFamily: FONTS.display, fontWeight: '800', color: c.text1, lineHeight: 30 },
  objective: { fontSize: 14, color: c.text2, lineHeight: 21, marginTop: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  metaText: { fontSize: 11, color: c.text4 },
  metaDot: { fontSize: 11, color: c.text4, marginHorizontal: 3 },

  card: {
    marginHorizontal: s.lg, marginBottom: s.md, padding: s.md,
    borderRadius: r.lg, backgroundColor: c.bg1,
    borderWidth: 1, borderColor: c.border, borderLeftWidth: 3,
  },
  noticeCard: {
    marginHorizontal: s.lg, marginBottom: s.md, padding: s.md,
    borderRadius: r.md, backgroundColor: c.bg2, borderLeftWidth: 3,
  },
  noticeText: { fontSize: 12, color: c.text3, lineHeight: 18 },

  // Reading measure: prose needs generous line height or nobody finishes it.
  bodyText: { fontSize: 15, color: c.text2, lineHeight: 24 },

  lessonCard: {
    marginHorizontal: s.lg, marginBottom: s.md,
    borderRadius: r.lg, backgroundColor: c.bg1, overflow: 'hidden',
    borderWidth: 1, borderColor: c.border, borderTopWidth: 3,
    ...sh.sm,
  },
  lessonHead: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: s.md },
  lessonNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  lessonNumText: { fontSize: 12, fontWeight: '800', fontFamily: FONTS.mono },
  lessonTitle: { fontSize: 16, fontWeight: '700', color: c.text1, lineHeight: 21 },
  lessonObjective: { fontSize: 12, color: c.text3, lineHeight: 17, marginTop: 3 },
  lessonBody: { paddingHorizontal: s.md, paddingBottom: s.md },

  sectionHeading: { fontSize: 15, fontWeight: '800', marginBottom: 8, lineHeight: 20 },

  boxLabel: {
    fontSize: 10, fontFamily: FONTS.mono, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1, color: c.text4, marginBottom: 6,
  },

  termsBox: { backgroundColor: c.bg0, borderRadius: r.md, padding: 12, marginBottom: 16 },
  termName: { fontSize: 13, fontWeight: '700' },
  termDef: { fontSize: 13, color: c.text3, lineHeight: 19, marginTop: 1 },

  // Example titles read as sentences ("Worked example — a $60,000 salary"),
  // so they get sentence case rather than the uppercase treatment boxLabel
  // applies to short labels like KEY TERMS.
  exampleTitle: { fontSize: 13, fontWeight: '800', marginBottom: 7, lineHeight: 18 },
  exampleBox: {
    backgroundColor: c.bg0, borderRadius: r.md, padding: 12,
    borderLeftWidth: 3, marginBottom: 16,
  },
  exampleText: { fontSize: 14, color: c.text2, lineHeight: 22 },

  pitfallBox: { backgroundColor: c.bg0, borderRadius: r.md, padding: 12, marginBottom: 16 },
  pitfallRow: { flexDirection: 'row', gap: 7, marginTop: 6 },
  pitfallText: { flex: 1, fontSize: 13, color: c.text3, lineHeight: 19 },

  navRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: s.lg, marginTop: s.lg, gap: s.sm },
  navBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 11, paddingHorizontal: 14,
    borderRadius: r.md, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border,
  },
  navText: { fontSize: 13, fontWeight: '700', color: c.text2 },
});
