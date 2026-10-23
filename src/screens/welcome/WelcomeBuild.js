// src/screens/welcome/WelcomeBuild.js
// The welcome's builder (the founder's "Launch Portfolio Builder"): makes
// their first project from their answers the moment they launch it, then
// hands them the workspace (src/components/ProjectWorkspace.js).
//
// The portfolio starts from portfolioStart (src/logic/tailoring.js): their
// interests become the skill badges, their stage the "Current phase" card
// and the headline, as on the founder's demo. Every everyday option is
// open from the start (lookAtAll); upgrades open by one question each.
//
// Everything stays on the phone: the Build in the guest's Builds
// (buildService, @cth_builds_guest). Signup carries it over
// (src/api/claimLocal.js).

import React, { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useTour } from '../../../context/TourContext';
import ProjectWorkspace from '../../components/ProjectWorkspace';
import { loadBuilds, saveBuild } from '../../api/buildService';
import { recordExport } from '../../api/pathService';
import { BUILD_KIND_MAP } from '../../data/builds';
import { WELCOME_PROJECTS } from '../../data/pathKits';
import { newBuild, lookAtAll, pickOption } from '../../logic/builds';
import { portfolioStart } from '../../logic/tailoring';
import { welcomeProjectLesson } from '../../logic/guide/lessons/welcomeProject';

// A person's own name ("Your name", "Your first name"), not a thing's ("Name your lab").
const isNameAsk = (ask) => ask.key === 'name' && /^your (first )?name$/i.test(ask.label);
const fillOf = (ask, answers) => (isNameAsk(ask) ? (answers.firstName || '') : ask.fill || String(ask.placeholder || '').replace(/^e\.g\.\s*/i, ''));

// The founder's demo opens on Dark Synth; the rest of the look is theirs.
function makeFirst(kindId, answers) {
  if (kindId === 'page') {
    const start = portfolioStart(answers);
    return pickOption(lookAtAll(newBuild('page', start.answers, undefined, start.content)), 'colors', 'synth');
  }
  const kind = BUILD_KIND_MAP[kindId];
  return lookAtAll(newBuild(kindId, Object.fromEntries(kind.asks.map(a => [a.key, fillOf(a, answers)]))));
}

export default function WelcomeBuild({ kindId, answers, onAnswer }) {
  const { colors: c, typography: t, spacing: s } = useTheme();
  const { startLesson, completeAction } = useTour();
  const [build, setBuild] = useState(null);
  const saveTimer = useRef(null);
  const latest = useRef(null);

  useEffect(() => {
    let alive = true;
    loadBuilds(null).then(async (list) => {
      let b = list.find(x => x.kind === kindId);
      const fresh = !b;
      if (fresh) b = await saveBuild(null, makeFirst(kindId, answers));
      if (!alive || !b) return;
      latest.current = b;
      setBuild(b);
      onAnswer({ unit1Done: true, projectKind: kindId });
      const kind = BUILD_KIND_MAP[kindId];
      // TourSpots measure on layout; give the preview a moment to land.
      if (fresh) setTimeout(() => startLesson(welcomeProjectLesson({ kind })), 700);
    });
    return () => {
      alive = false;
      // Leaving mid-edit: the last change still lands.
      if (saveTimer.current) { clearTimeout(saveTimer.current); if (latest.current) saveBuild(null, latest.current); }
    };
  }, [kindId]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (next) => {
    if (!next || next === latest.current) return;
    latest.current = next;
    setBuild(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { saveTimer.current = null; saveBuild(null, latest.current); }, 350);
    if (next.answers?.name && BUILD_KIND_MAP[kindId]?.asks.some(isNameAsk)) onAnswer({ firstName: next.answers.name.split(' ')[0] });
  };

  if (!build) {
    return (
      <View style={{ paddingVertical: s.xxl, alignItems: 'center' }}>
        <Text style={{ fontSize: t.sm, color: c.text3 }}>Building it from your answers…</Text>
      </View>
    );
  }
  return (
    <ProjectWorkspace build={build} onChange={update}
      title={kindId === 'page' ? 'Portfolio Builder' : WELCOME_PROJECTS.find(p => p.kind === kindId)?.title} onPicked={() => completeAction()} onExported={() => recordExport(null)} />
  );
}
