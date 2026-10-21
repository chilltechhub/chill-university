// src/screens/studio/BuildScreen.js
// One Studio Build: the real thing, live, on top; its parts below. Tap a
// part to take it apart (src/screens/studio/PartSheet.js): a 30-second
// "see it, change it" lesson that hands over control of that part. Take
// it home exports the exact file the preview shows.
//
// It's made with you in it: your pet stars in the game and sits on your
// page, your Dream can fill a page block (src/logic/useStudio.js `me`), and
// your pet comments on how it's going.
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { Button, SectionLabel } from '../../components/ui';
import RichText from '../../components/RichText';
import BuildPreview from '../../components/BuildPreview';
import BuildAskSheet from '../../components/BuildAskSheet';
import PetCompanion from '../../components/PetCompanion';
import PartSheet from './PartSheet';
import { saveBuild, deleteBuild } from '../../api/buildService';
import { recordExport } from '../../api/pathService';
import { growIntoProject } from '../../api/buildProjects';
import { openTarget } from '../../logic/openTarget';
import useStudio from '../../logic/useStudio';
import { useAccess } from '../../../context/AccessContext';
import {
  kindOf, optionOf, partLevel, buildTitle, buildFilename, receiptLine, nextPart, setAnswers, isMastered, receipt, withProject,
  LEVEL_NAMES, LEVEL_MADE, LEVEL_MASTERED,
} from '../../logic/builds';
import { companionLine } from '../../logic/studio';
import { renderBuild } from '../../logic/buildRender';
import { shareFile } from '../../logic/shareFile';
import { confirmAsync, notify } from '../../logic/confirm';

const LEVEL_ICONS = ['sparkles-outline', 'hand-left-outline', 'ribbon-outline'];

export default function BuildScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { buildId, fresh } = route.params || {};
  const { colors: c, typography: t, spacing: s, radius: r, accent } = useTheme();
  const studio = useStudio();
  const { signalAction } = useAccess();
  const { userId, me, pet, petName } = studio;
  // The latest local edit wins over the stored copy until the save lands.
  const [local, setLocal] = useState(null);
  const stored = studio.builds.find(b => b.id === buildId) || null;
  const build = local && local.id === buildId && (!stored || String(local.updatedAt) >= String(stored.updatedAt)) ? local : stored;
  const [openPart, setOpenPart] = useState(null);
  const [editingWords, setEditingWords] = useState(false);

  // Saves on every change; the screen shows the change at once.
  const update = useCallback((next) => {
    if (!next || next === build) return;
    setLocal(next);
    saveBuild(userId, next);
  }, [build, userId]);

  const kind = kindOf(build);
  const html = useMemo(() => (build ? renderBuild(build, me) : ''), [build, me]);
  const next = build ? nextPart(build) : null;

  if (!build || !kind) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg0, padding: s.lg, justifyContent: 'center' }}>
        <Text style={{ fontSize: t.md, color: c.text3, textAlign: 'center' }}>Opening your build…</Text>
      </View>
    );
  }

  const takeHome = async () => {
    try {
      await shareFile({ filename: buildFilename(build), content: html, mimeType: 'text/html', uti: 'public.html', dialogTitle: buildTitle(build) });
      // Software for You's last mission: you took something home that you own.
      recordExport(userId);
      signalAction('build-exported', { kind: build.kind });
    } catch (e) {
      notify('Could not export', e?.message || 'Try again.');
    }
  };

  // From "the app made it with me" to "I'm making it": one of their own
  // Workshop projects, with the kind's first real step as its next action.
  const [growing, setGrowing] = useState(false);
  const grow = async () => {
    if (build.projectId) {
      if (await openTarget(navigation, { kind: 'project', id: build.projectId })) return;
      // The project was deleted: let them grow a new one.
      update(withProject(build, null));
    }
    if (!userId) { notify('Sign in to grow it', 'Projects save to your account, so sign in first. Your Build stays here either way.'); return; }
    setGrowing(true);
    try {
      const project = await growIntoProject(userId, build);
      update(withProject(build, project.id));
      signalAction('project-started');
      openTarget(navigation, { kind: 'project', id: project.id });
    } catch (e) {
      notify('Could not start the project', e?.message || 'Try again.');
    } finally {
      setGrowing(false);
    }
  };

  const remove = async () => {
    if (!(await confirmAsync(`Delete ${buildTitle(build)}?`, 'This can’t be undone.', 'Delete'))) return;
    await deleteBuild(userId, build.id);
    navigation.goBack();
  };

  const part = openPart ? kind.parts.find(p => p.id === openPart) : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s.md }}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('StudioScreen'))}
            accessibilityRole="button" accessibilityLabel="Back to the Studio"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}
          >
            <Ionicons name="chevron-back" size={22} color={accent.primary} />
            <Text style={{ fontSize: t.md, color: accent.primary, fontWeight: t.semibold }}>Studio</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditingWords(true)} accessibilityRole="button" accessibilityLabel="Change the words" hitSlop={8} style={{ padding: 6 }}>
            <Ionicons name="create-outline" size={20} color={c.text3} />
          </TouchableOpacity>
          <TouchableOpacity onPress={remove} accessibilityRole="button" accessibilityLabel="Delete this build" hitSlop={8} style={{ padding: 6 }}>
            <Ionicons name="trash-outline" size={20} color={c.text3} />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text3 }}>{kind.medium}</Text>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1, marginBottom: s.md }}>{buildTitle(build)}</Text>

        {fresh && partLevel(build, kind.parts[0].id) === LEVEL_MADE && (
          <RichText style={{ fontSize: t.sm, color: c.text2, marginBottom: s.md }} boldStyle={{ color: c.text1 }}>
            **Made for you, and it works.** Try it. Then open its parts below and make it yours.
          </RichText>
        )}

        <BuildPreview html={html} height={kind.id === 'business' || kind.id === 'page' || kind.id === 'ai' ? 380 : 340} scroll={kind.id !== 'game'} />

        {(() => {
          const rc = receipt(build);
          const moment = isMastered(build) ? 'done' : rc.changed > 0 ? 'changed' : rc.mastered > 0 ? 'mastered' : 'fresh';
          return (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: s.sm, marginTop: s.md }}>
              {!!pet && <PetCompanion pet={pet} size={44} />}
              <View style={{ flex: 1, padding: s.md, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border }}>
                <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text3, marginBottom: 2 }}>{pet ? petName : 'Your guide'}</Text>
                <RichText style={{ fontSize: t.sm, color: c.text2 }} boldStyle={{ color: c.text1 }}>{companionLine(moment, build.id)}</RichText>
              </View>
            </View>
          );
        })()}
        <RichText style={{ fontSize: t.sm, color: c.text2, marginTop: s.sm }} boldStyle={{ color: c.text1 }}>
          {receiptLine(build)}
        </RichText>

        <SectionLabel label="Take it apart" />
        {kind.parts.map(p => {
          const lv = partLevel(build, p.id);
          const current = optionOf(p, build.picks[p.id]);
          const isNext = next?.id === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => setOpenPart(p.id)}
              accessibilityRole="button"
              accessibilityLabel={`${p.label}: ${current?.label}. ${LEVEL_NAMES[lv]}. Open to see how it works`}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: s.md, padding: s.lg, marginBottom: s.sm,
                borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: isNext ? 1.5 : 0.5,
                borderColor: isNext ? accent.primary : c.border,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: accent.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={p.icon} size={18} color={accent.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>{p.label}</Text>
                <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>
                  {current?.label}{isNext ? ' · start here' : ''}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: r.full, backgroundColor: lv === LEVEL_MASTERED ? accent.primaryLight : c.bg2 }}>
                <Ionicons name={LEVEL_ICONS[lv]} size={12} color={lv === LEVEL_MADE ? c.text3 : accent.primary} />
                <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: lv === LEVEL_MADE ? c.text3 : c.text1 }}>{LEVEL_NAMES[lv]}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <Button label="Take it home" icon="download-outline" onPress={takeHome} style={{ marginTop: s.lg }} />
        <RichText style={{ fontSize: t.xs, color: c.text3, marginTop: s.sm, textAlign: 'center' }} boldStyle={{ color: c.text2 }}>
          {isMastered(build)
            ? 'One file. **No license, no subscription, no account.** Yours to keep, and you understand every part of it.'
            : 'One file. **No license, no subscription, no account.** Opens in any browser, yours to keep.'}
        </RichText>

        <Button
          label={build.projectId ? 'Open your project' : 'Grow it into a project'}
          icon={build.projectId ? 'hammer' : 'hammer-outline'}
          variant="secondary"
          busy={growing}
          onPress={grow}
          style={{ marginTop: s.md }}
          accessibilityLabel={build.projectId ? 'Open the Workshop project this grew into' : 'Grow it into your own Workshop project'}
        />
        {!build.projectId && !!kind.growNext && (
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: s.sm, textAlign: 'center' }}>
            Your own project in the Workshop. First step: {kind.growNext.charAt(0).toLowerCase() + kind.growNext.slice(1)}.
          </Text>
        )}

        {/* Where to take it next without paying for it (docs/north-star.md:
            software's power, without the license costs). */}
        {(() => {
          const tools = (kind.freeTools || []).filter(ft => !ft.adult || me.adult);
          if (!tools.length) return null;
          return (
            <>
              <SectionLabel label="Go further, free" />
              <Text style={{ fontSize: t.sm, color: c.text2, marginBottom: s.sm }}>
                The pros often pay license fees for tools like these. These ones are free.
              </Text>
              {tools.map(ft => (
                <TouchableOpacity
                  key={ft.name}
                  onPress={() => Linking.openURL(ft.url).catch(() => {})}
                  accessibilityRole="link"
                  accessibilityLabel={`${ft.name}: ${ft.what} Opens the site`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, padding: s.md, marginBottom: s.sm, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: t.md, fontWeight: t.semibold, color: c.text1 }}>{ft.name}</Text>
                    <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{ft.what}</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color={c.text3} />
                </TouchableOpacity>
              ))}
            </>
          );
        })()}

        {!!kind.deeper && (
          <Button
            label={`Go deeper: ${kind.deeper.label}`}
            variant="ghost"
            icon="school-outline"
            onPress={() => navigation.navigate(kind.deeper.route, kind.deeper.params)}
            style={{ marginTop: s.md }}
          />
        )}
      </ScrollView>

      <PartSheet
        visible={!!part}
        build={build}
        part={part}
        html={html}
        petName={pet ? petName : null}
        onSignal={signalAction}
        onChange={update}
        onClose={() => setOpenPart(null)}
      />
      <BuildAskSheet
        visible={editingWords}
        editing
        kindId={build.kind}
        initial={build.answers}
        onClose={() => setEditingWords(false)}
        onDone={(answers) => { update(setAnswers(build, answers)); setEditingWords(false); }}
      />
    </View>
  );
}
