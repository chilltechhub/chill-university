// scripts/check-style.mjs
// Keeps screens that have moved onto the shared UI components
// (src/components/ui) from sliding back into hard-coded styling, which would
// make them ignore the Plain / Command style and the accent setting.
//
// For every file in MIGRATED, fails on:
//   • FONTS.mono / FONTS.display (use style.numberFont / eyebrow / titleFont,
//     or <Readout> / <Eyebrow> / <SectionLabel>)
//   • textTransform: 'uppercase' (the Command style adds that itself)
//   • a raw hex colour string (use colors.* or accent.*)
// A line that genuinely needs one (a brand colour, a fixed illustration)
// can opt out with a `style-ok` comment on the same line saying why.
//
// Add a file here once it has been moved over. See docs/finishing-touches-plan.md.
import { readFileSync, readdirSync } from 'fs';

const MIGRATED = [
  'src/components/ui/index.js',
  'src/screens/SettingsScreen.js',
  'src/components/TopBar.js',
  'src/components/FeatureGate.js',
  'src/components/CompassCard.js',
  'src/components/GettingStartedCard.js',
  'src/components/WidgetBoard.js',
  'src/screens/HomeScreen.js',
  'src/data/dashboardWidgets.js',
  'src/screens/library/LibraryScreen.js',
  'src/components/widgets/WidgetCard.js',
  'src/components/widgets/WayfinderWidget.js',
  'src/components/widgets/PersonalWidgets.js',
  'src/components/widgets/StudentWidgets.js',
  'src/components/widgets/BusinessWidgets.js',
  'src/components/widgets/EntrepreneurWidgets.js',
  'src/components/widgets/QuestWidget.js',
  'src/components/DreamCard.js',
  'src/components/DreamSheet.js',
  'src/components/BuildPreview.js',
  'src/components/BuildAskSheet.js',
  'src/screens/studio/StudioScreen.js',
  'src/screens/studio/BuildScreen.js',
  'src/screens/studio/PartSheet.js',
  'src/components/StudioStage.js',
  'src/components/StudioCard.js',
  'src/components/StudioShowcase.js',
  'src/screens/studio/SoftwarePathScreen.js',
  'src/screens/studio/MissionScreen.js',
  'src/components/TodayCard.js',
];

const RULES = [
  { re: /FONTS\.(mono|monoSemibold|display|displaySemibold)\b/, why: 'hard-coded HUD font' },
  { re: /textTransform:\s*['"]uppercase['"]/, why: "hard-coded textTransform: 'uppercase'" },
  { re: /['"]#[0-9a-fA-F]{3,8}['"]/, why: 'raw hex colour' },
];

let problems = 0;
for (const file of MIGRATED) {
  let src;
  try { src = readFileSync(file, 'utf8'); } catch {
    console.error(`check-style: ${file} is listed but missing`);
    problems++;
    continue;
  }
  src.split(/\r?\n/).forEach((line, i) => {
    if (/style-ok\b/.test(line)) return;
    const code = line.replace(/\/\/.*$/, ''); // ignore comments
    for (const { re, why } of RULES) {
      if (re.test(code)) {
        console.error(`${file}:${i + 1}  ${why}\n    ${line.trim()}`);
        problems++;
      }
    }
  });
}

// ── The front screens (shake-up P9, docs/shake-up-plan-2026-10-21.md §9) ──
// Today, Calm, Learn, My path, a unit, Make, You, the welcome and the sheets
// on them use only the visual kit (src/ui): colours come from the theme or
// src/ui/tokens.js, and loading shows a <Skeleton> (or a <BusyDot> inside a
// control), never a spinner. No style-ok here: these files have no
// exceptions. A folder entry covers every .js file in it.
const FRONT = [
  'src/ui/index.js',
  'src/components/CalmKit.js', 'src/components/CalmHome.js', 'src/components/CalmLibrary.js',
  'src/screens/HomeScreen.js', 'src/screens/today/',
  'src/screens/GamesScreen.js', 'src/screens/learn/',
  'src/screens/library/LibraryScreen.js', 'src/components/MakeBoard.js', 'src/components/WorkThumb.js', 'src/components/StudioCard.js',
  'src/screens/you/', 'src/screens/ProfileScreen.js', 'src/components/IkigaiCircles.js', 'src/components/Room.js',
  'src/screens/welcome/',
  'src/components/HandInMoment.js', 'src/components/ShareWorkSheet.js', 'src/components/AboutPageSheet.js',
  'src/components/MapCard.js', 'src/screens/SharedScreen.js', 'src/screens/OpenSourceCreditsScreen.js',
  'src/components/TodaysFind.js', 'src/components/PickPathNote.js', 'src/components/DreamCard.js',
];
const FRONT_RULES = [
  { re: /['"]#[0-9a-fA-F]{3,8}['"]/, why: 'raw hex colour (use the theme or src/ui/tokens.js)' },
  { re: /rgba?\(/, why: 'raw rgba colour (use the theme or src/ui/tokens.js)' },
  { re: /\bActivityIndicator\b/, why: 'a spinner (use <Skeleton>, or <BusyDot> in a control)' },
];
const frontFiles = FRONT.flatMap(f => (f.endsWith('/')
  ? readdirSync(f).filter(n => n.endsWith('.js')).map(n => f + n)
  : [f]));
for (const file of frontFiles) {
  let src;
  try { src = readFileSync(file, 'utf8'); } catch {
    console.error(`check-style: front file ${file} is listed but missing`);
    problems++;
    continue;
  }
  src.split(/\r?\n/).forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '');
    for (const { re, why } of FRONT_RULES) {
      if (re.test(code)) {
        console.error(`${file}:${i + 1}  ${why}\n    ${line.trim()}`);
        problems++;
      }
    }
  });
}

if (problems) {
  console.error(`\ncheck-style: ${problems} problem(s). Use the shared components / theme tokens, or mark a deliberate exception with a style-ok comment.`);
  process.exit(1);
}
console.log(`check-style: ${MIGRATED.length} migrated files clean; ${frontFiles.length} front files on the kit.`);
