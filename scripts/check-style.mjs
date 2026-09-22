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
import { readFileSync } from 'fs';

const MIGRATED = [
  'src/components/ui/index.js',
  'src/screens/SettingsScreen.js',
  'src/components/TopBar.js',
  'src/components/FeatureGate.js',
  'src/components/CompassCard.js',
  'src/components/GettingStartedCard.js',
  'src/components/WidgetBoard.js',
  'src/screens/HomeScreen.js',
  'src/screens/library/LibraryScreen.js',
  'src/components/widgets/WidgetCard.js',
  'src/components/widgets/WayfinderWidget.js',
  'src/components/widgets/PersonalWidgets.js',
  'src/components/widgets/StudentWidgets.js',
  'src/components/widgets/BusinessWidgets.js',
  'src/components/widgets/EntrepreneurWidgets.js',
  'src/components/widgets/QuestWidget.js',
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

if (problems) {
  console.error(`\ncheck-style: ${problems} problem(s). Use the shared components / theme tokens, or mark a deliberate exception with a style-ok comment.`);
  process.exit(1);
}
console.log(`check-style: ${MIGRATED.length} migrated files clean.`);
