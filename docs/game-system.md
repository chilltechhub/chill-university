# Chill App — Game System Architecture

A guide for building new training games, written so it can be pasted into
another AI chat that can't see this codebase. Everything below comes from
the real files. Paths are relative to the repo root.

---

## 1. The stack (what a game can use)

- **Expo SDK 57, React Native 0.86, React 19, plain JavaScript (no TypeScript).**
- Runs on **iOS, Android and web** (React Native Web). A game has to work on all three.
- Games are **React Native components only**: `View`, `Text`, `TouchableOpacity`,
  `ScrollView`, `Animated`. No HTML, no `<div>`, no `<canvas>`, no `window`/`document`.
- Libraries that are already installed and safe to use: `@expo/vector-icons`
  (Ionicons), `react-native-svg`, `react-native-reanimated`,
  `react-native-gesture-handler`, `@react-navigation/native`.
  **Don't add new npm packages.**
- Backend is Supabase. **A game never talks to Supabase directly.** The shared
  hooks do that.

---

## 2. The big picture

```
src/services/gameRegistry.js   ← the ONE list of every game (32 today)
        │
        ├──► GamesScreen (Training grid), HomeScreen, Classes recommendations,
        │    Planner links, search: all read the registry. Nothing to wire.
        │
        └──► src/components/GameFeed.js   ← vertical swipe feed; maps the
                  │                          registry's `component` name to the
                  │                          real component (COMPONENT_MAP)
                  │   only the page on screen mounts a live game; the others
                  │   show an icon placeholder
                  ▼
            YourGame.js   (one self-contained component)
              1. GradeSelectCard       pick a grade band (+ Relaxed/Rush pace)
              2. GameShell + gameplay  call game.answer(true/false) per action
              3. RoundCompleteScreen   between rounds: pick 1 of 3 prize cards
              4. GameOver              results, lesson suggestion, Play Again
```

Navigation: every "Start" button calls `navigation.navigate('Play', { gameId })`.
`src/screens/PlayScreen.js` renders `GameFeed`, which scrolls to that game.

### What happens on every answer (you get this for free)

```
game.answer(isCorrect)                       src/logic/useGame.js
  ├─ signed in → handleGameEvent('QUESTION_ANSWERED')   src/logic/gamificationService.js
  │                ├─ activity_log row
  │                ├─ increment_user_progress RPC (XP + points; 10×tier XP if right, 2 if wrong)
  │                ├─ subject_progress (per-subject XP/level)
  │                └─ advances daily/weekly missions
  └─ guest     → recordGuestEvent (kept on the device)

game.endGame()  → handleGameEvent('GAME_COMPLETED') → refreshProfile()  (level-up popups)
GameOver        → skillStats.recordRun() (on-device, per game)
                → suggests a linked Academy lesson (src/data/skillLinks.js):
                  "Lesson that helps" if rolling accuracy < 70%, otherwise "Go deeper"
GameShell       → "Did You Know" fact toast every time the streak goes up
```

Also automatic: light/dark theme, the emoji on/off setting, the remote kill
switch (`app_config.disabled_games`), and experience-stage visibility.

---

## 3. The shared building blocks (the contracts)

### 3.1 Registry entry: `src/services/gameRegistry.js`

```js
example: {
  id: 'example',               // MUST equal the object key. Used everywhere.
  name: 'Example Game',
  component: 'ExampleGame',    // name used in GameFeed's COMPONENT_MAP

  subject: 'science',          // internal key written to Supabase; see list below
  subjectLabel: 'Science',     // what users see
  category: 'classification',  // free-text tag
  grade: '6-8',                // band used for Classes recommendations
  mechanic: 'quiz',            // see list below

  icon: '🧪',
  color: '#10B981',
  desc: 'One short line for the game card',

  enabled: true,
},
```

- **`subject` must be one of these 14:** `math`, `language_arts`, `science`,
  `health`, `finance`, `home_ec`, `social_studies`, `arts`, `technology`,
  `foreign_language`, `mental`, `social_skills`, `career`, `general`.
- **`mechanic` must be one of these:** `quiz`, `matching`, `building`,
  `strategy`, `thinking`, `fun`, `racing`, `puzzle`, `survival`, `cards`,
  `sports`. A brand-new mechanic also needs a row in `MECHANIC_META` (same
  file) and an entry in `MECHANIC_FILTERS` in `src/screens/GamesScreen.js`.

### 3.2 `useGame()`: scoring, lives, streak, reporting (`src/logic/useGame.js`)

```js
const game = useGame({
  subject: 'science',     // same as the registry's subject
  difficulty: tier,       // 1-4 (the adaptive tier). Multiplies XP.
  skillLevel: level,      // band key like '6-8', stored as metadata
  onGameEnd,              // pass through the prop (usually undefined)
  manualScoring: true,    // ALWAYS true for new games (see §4)
});

const { isOut, livesLeft } = game.answer(isCorrect, { speedBonus })
                                        // call once per scored action; returns
                                        // { points, livesLeft, isOut } as of
                                        // AFTER this answer (see §7 rule 3)
game.addPoints(n)                       // RoundCompleteScreen calls this
game.endGame()                          // call exactly once when the run ends
game.reset()                            // for Play Again

game.score, game.lives (starts 3), game.streak, game.bestStreak,
game.correct, game.attempted, game.accuracy, game.done, game.isGameOver
```

A wrong answer costs 1 life. At 0 lives, the game should call `endGame()`.

### 3.3 `GameShell`: header + stats bar wrapper (`src/components/GameShell.js`)

```jsx
<GameShell
  gameId="example"               // powers the fact toast
  title="Example Game" emoji="🧪"
  subject="Science · 6-8"        // display string under the title
  score={game.score} lives={game.lives} streak={game.streak}
  maxLives={3}                   // optional
  timeLeft={secondsOrNull}       // optional: shows a timer pill
  progress={0.4}                 // optional: 0-1 bar under the stats
  disableFactToast               // set when the game shows facts itself
  onQuit={fn}                    // optional: defaults to navigation.goBack()
>
  {/* gameplay goes here */}
</GameShell>
```

### 3.4 Theme: `useGameTheme()` (exported from GameShell.js)

```js
const G = useGameTheme();   // switches between the dark and light palettes
const s = makeStyles(G);    // every game builds its StyleSheet from G
```

Palette keys: `bg`, `card`, `border`, `gold`, `goldL`, `teal`, `tealL`,
`purple`, `cream`, `muted`, `faint`, `success`, `error`, `warning`, `white`.
**`G.cream` is the main text color.** In light mode it's near-black; the name
is historical. Don't hardcode colors, or the game breaks in light mode.

Emoji setting: `const { showEmojis } = useUIPrefs();`
(`context/UIPrefsContext`). Decorative emoji should fall back to an Ionicon
when it's off. Emoji that *are* the gameplay (the bugs in Bug Squash) can stay.

### 3.5 `GradeSelectCard`: the start screen (`src/components/GradeSelectCard.js`)

```jsx
<GradeSelectCard
  gameId="example" title="Example Game" emoji="🧪" subjectLabel="Science"
  blurbs={{ 'K-2': '…', '3-5': '…', '6-8': '…', '9-12': '…' }}
  level={level} onSelectLevel={setLevel}
  onStart={beginRun}         // called with 'relaxed' or 'rush'
  showPace                   // only if the game supports Rush (RushTimerBar)
  tierLabels={{ 'K-2': 'New Hire', … }}           // optional: rename bands
  pickerPrompt="Choose your experience level"     // optional, pair with tierLabels
/>
```

`tierLabels` is for games where the bands mean experience rather than school
grade. Register Ready and Shift Manager use it.

### 3.6 Grade bands + adaptive difficulty

`src/logic/useGradeLevel.js`
```js
const { level, setLevel, tier } = useGradeLevel('example');  // saved per game on device
// level: 'K-2' | '3-5' | '6-8' | '9-12'    tier: 1 | 2 | 3 | 4
levelForTier(3)  // → '6-8'
```

`src/logic/difficultyAdapter.js`
```js
createAdaptiveTier(startTier)      // → { tier, hitStreak, missStreak }
nextAdaptiveTier(state, isCorrect) // +1 tier after 3 right in a row, −1 after 2 wrong
roundLength(roundIndex)            // 4,4,5,5,6,6,7,7,8,8 … (max 12) questions per round
STAGE_COUNT                        // 10 rounds per full run
```

The player picks a starting band, and the tier then moves up and down during
the run. Each question comes from the bank for the *current* tier.

### 3.7 `RoundCompleteScreen`: the prize pick (`src/components/RoundCompleteScreen.js`)

```jsx
<RoundCompleteScreen
  roundNumber={n} correct={c} total={t} streak={game.streak}
  difficulty={tier}           // 1-4; younger bands get smaller prizes
  funGame                     // true for pure arcade (pays 0.45×)
  fact={pace === 'rush' ? fact : null}
  onAward={game.addPoints}    // fires instantly when a card is tapped
  onAdvance={handleClaimPrize}// fires ~1.2s later: go to the next round or endGame()
/>
```

This screen is the **only** place in-game points come from. Don't add points
again in `onAdvance`.

### 3.8 `GameOver`: results (`src/components/GameOver.js`)

```jsx
<GameOver gameId="example"
  score={game.score} correct={game.correct} total={game.attempted}
  streak={game.bestStreak} title="Nice Work!"
  onPlayAgain={() => { game.reset(); setStarted(false); }}
  onQuit={() => navigation.goBack()}
/>
```

### 3.9 Optional helpers

- `RushTimerBar` (`src/components/RushTimerBar.js`): countdown bar for Rush pace.
  `<RushTimerBar active={pace==='rush' && !feedback} durationMs={4000} resetKey={q} onExpire={() => handleAnswer('__TIMEOUT__')} />`
- `useGameFacts(gameId)` (`src/logic/useGameFacts.js`) returns `{ ready, next }`.
  `next()` gives a random fact string from Supabase (or `null` if there are none).

---

## 4. Template A: a round-based quiz game (the standard)

This is the shape used by World Explorer, Tech Lab, Mind Gym, and most other
games. Copy it, rename `example`/`Example`, and change the gameplay area.

**Content file: `src/data/gameContent/example.js`**

```js
// Tiered by the four band keys. Shared quiz shape: { prompt, correct, options, explanation }.
// `options` includes `correct`; the game shuffles them. Aim for 10+ per band.
export const EXAMPLE_BANK = {
  'K-2':  [ { prompt: '…', correct: 'A', options: ['A', 'B', 'C', 'D'], explanation: '…' } ],
  '3-5':  [ /* … */ ],
  '6-8':  [ /* … */ ],
  '9-12': [ /* … */ ],
};
export default EXAMPLE_BANK;
```

Non-quiz games can use any item shape they need (Budget Trail and Survive
the Month use scenario cards). Keep it keyed by the same four bands.

**Component: `src/components/ExampleGame.js`**

```jsx
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import { useUIPrefs } from '../../context/UIPrefsContext';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import RushTimerBar from './RushTimerBar';
import RoundCompleteScreen from './RoundCompleteScreen';
import useGame from '../logic/useGame';
import useGameFacts from '../logic/useGameFacts';
import useGradeLevel, { levelForTier } from '../logic/useGradeLevel';
import { createAdaptiveTier, nextAdaptiveTier, roundLength, STAGE_COUNT } from '../logic/difficultyAdapter';
import { EXAMPLE_BANK } from '../data/gameContent/example';

const GAME_ID = 'example';      // must equal the registry key
const TITLE = 'Example Game';
const EMOJI = '🧪';
const SUBJECT = 'science';      // one of the 14 subject keys
const SUBJECT_LABEL = 'Science';

const BLURBS = {
  'K-2': '…', '3-5': '…', '6-8': '…', '9-12': '…',
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function pickNext(pool, avoid) {
  const fresh = pool.filter(q => !avoid.includes(q.prompt));
  const list = fresh.length ? fresh : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export default function ExampleGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { showEmojis } = useUIPrefs();
  const { level, setLevel, tier: savedTier } = useGradeLevel(GAME_ID);
  const { next: nextFact } = useGameFacts(GAME_ID);

  const [started, setStarted] = useState(false);
  const [pace, setPace] = useState('relaxed');
  const [adaptive, setAdaptive] = useState(() => createAdaptiveTier(savedTier));
  const recentRef = useRef([]);
  const [q, setQ] = useState(null);
  const [opts, setOpts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  // Rounds: short first round, longer later. No points until a prize is picked.
  const [stage, setStage] = useState(0);
  const [stageAsked, setStageAsked] = useState(0);
  const [stageCorrect, setStageCorrect] = useState(0);
  const [roundComplete, setRoundComplete] = useState(null);
  const stageTarget = roundLength(stage);

  // Relaxed: a fact every 3rd question in the question view. Rush: one per round screen.
  const [fact, setFact] = useState(null);
  const factCountRef = useRef(0);

  const game = useGame({ subject: SUBJECT, difficulty: adaptive.tier, skillLevel: level, onGameEnd, manualScoring: true });

  const loadNext = useCallback((tier) => {
    const next = pickNext(EXAMPLE_BANK[levelForTier(tier)], recentRef.current);
    recentRef.current = [...recentRef.current, next.prompt];
    setQ(next);
    setOpts(shuffle(next.options));
    setSelected(null);
    setFeedback(null);
    setStartTime(Date.now());
    factCountRef.current += 1;
    setFact(factCountRef.current % 3 === 0 ? nextFact() : null);
  }, [nextFact]);

  const beginRun = (selectedPace = 'relaxed') => {
    setPace(selectedPace);
    const initial = createAdaptiveTier(savedTier);
    setAdaptive(initial);
    recentRef.current = [];
    factCountRef.current = 0;
    setStage(0); setStageAsked(0); setStageCorrect(0); setRoundComplete(null);
    loadNext(initial.tier);
    setFact(nextFact());
    setStarted(true);
  };

  const handleAnswer = useCallback((opt) => {
    if (selected || !q) return;                     // one answer per question
    setSelected(opt);
    const isCorrect = opt === q.correct;
    const secs = (Date.now() - startTime) / 1000;
    const { isOut } = game.answer(isCorrect, { speedBonus: secs < 4 ? 5 : 0 });
    setFeedback({ isCorrect, explanation: q.explanation, correct: q.correct });

    const nextAdaptive = nextAdaptiveTier(adaptive, isCorrect);
    setAdaptive(nextAdaptive);

    setTimeout(() => {
      const asked = stageAsked + 1;
      const right = stageCorrect + (isCorrect ? 1 : 0);
      setStageAsked(asked);
      setStageCorrect(right);
      if (isOut) {
        game.endGame();
      } else if (asked >= stageTarget) {
        setRoundComplete({ correct: right, total: asked, roundNumber: stage + 1, isLastStage: stage + 1 >= STAGE_COUNT });
      } else {
        loadNext(nextAdaptive.tier);
      }
    }, 1900);
  }, [selected, q, startTime, game, adaptive, stage, stageAsked, stageCorrect, stageTarget, loadNext]);

  const handleClaimPrize = useCallback(() => {
    if (roundComplete?.isLastStage) {
      setRoundComplete(null);
      game.endGame();
    } else {
      setStage(n => n + 1);
      setStageAsked(0);
      setStageCorrect(0);
      setRoundComplete(null);
      loadNext(adaptive.tier);
    }
  }, [game, roundComplete, adaptive.tier, loadNext]);

  // ── 1. Start screen ──
  if (!started) {
    return (
      <GradeSelectCard gameId={GAME_ID} showPace
        title={TITLE} emoji={EMOJI} subjectLabel={SUBJECT_LABEL}
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  // ── 4. Results ──
  if (game.done) {
    return (
      <GameOver gameId={GAME_ID}
        score={game.score} correct={game.correct} total={game.attempted}
        streak={game.bestStreak} title="Nice Work!"
        onPlayAgain={() => { game.reset(); setStarted(false); }}
        onQuit={() => navigation.goBack()}
      />
    );
  }

  const subtitle = `${SUBJECT_LABEL} · ${levelForTier(adaptive.tier)}`;

  // ── 3. Between rounds ──
  if (roundComplete) {
    return (
      <GameShell gameId={GAME_ID} disableFactToast title={TITLE} emoji={EMOJI} subject={subtitle}
        score={game.score} lives={game.lives} streak={game.streak}>
        <RoundCompleteScreen
          roundNumber={roundComplete.roundNumber}
          correct={roundComplete.correct} total={roundComplete.total}
          streak={game.streak} difficulty={adaptive.tier}
          fact={pace === 'rush' ? fact : null}
          onAward={game.addPoints} onAdvance={handleClaimPrize}
        />
      </GameShell>
    );
  }

  if (!q) return null;

  // ── 2. Gameplay ── (replace this block with your mechanic)
  return (
    <GameShell gameId={GAME_ID} disableFactToast title={TITLE} emoji={EMOJI} subject={subtitle}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={stageAsked / stageTarget}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Round {stage + 1} of {STAGE_COUNT} · Question {stageAsked + 1} of {stageTarget}</Text>
        <View style={s.card}><Text style={s.prompt}>{q.prompt}</Text></View>

        <RushTimerBar active={pace === 'rush' && !feedback} durationMs={4000} resetKey={q}
          onExpire={() => handleAnswer('__TIMEOUT__')} />

        <View style={s.options}>
          {opts.map(opt => {
            let bg = G.card, border = G.border;
            if (selected) {
              if (opt === q.correct) { bg = G.success + '22'; border = G.success; }
              else if (opt === selected) { bg = G.error + '22'; border = G.error; }
            }
            return (
              <TouchableOpacity key={opt} style={[s.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(opt)} disabled={!!selected}>
                <Text style={s.optionText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.isCorrect ? '✓ Correct!' : `✗ It's "${feedback.correct}"`}
            </Text>
            <Text style={s.feedbackText}>{feedback.explanation}</Text>
          </View>
        )}

        {pace === 'relaxed' && !!fact && (
          <View style={s.factBox}>
            <Text style={s.factLabel}>{showEmojis ? '💡 ' : ''}Did You Know</Text>
            <Text style={s.factText}>{fact}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:       { padding: 16, paddingBottom: 40 },
  progress:     { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  card:         { backgroundColor: G.card, borderRadius: 16, padding: 22, borderWidth: 0.5, borderColor: G.border, marginBottom: 16, alignItems: 'center' },
  prompt:       { fontSize: 17, color: G.cream, textAlign: 'center', lineHeight: 24, fontWeight: '600' },
  options:      { gap: 10, marginBottom: 16 },
  option:       { borderWidth: 1, borderRadius: 12, padding: 16 },
  optionText:   { fontSize: 14, color: G.cream, lineHeight: 18 },
  feedback:     { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle:{ fontSize: 15, fontWeight: '700', marginBottom: 6 },
  feedbackText: { fontSize: 13, color: G.cream, lineHeight: 18 },
  factBox:      { backgroundColor: G.card, borderWidth: 0.5, borderColor: G.border, borderRadius: 12, padding: 14, marginTop: 16 },
  factLabel:    { fontSize: 11, color: G.gold, fontWeight: '700', marginBottom: 4 },
  factText:     { fontSize: 13, color: G.cream, lineHeight: 18 },
});
```

---

## 5. Template B: a continuous arcade game (timer, no rounds)

Pattern from `src/components/BugSquashGame.js`. It's the same four screens,
but there is **one** prize screen at the very end instead of one per round.

Differences from Template A:

1. **Per-band config instead of a question bank:**
   ```js
   const TIER_CONFIG = {
     'K-2':  { spawnChance: 0.35, baseTickMs: 700, duration: 15 },
     '3-5':  { … }, '6-8': { … }, '9-12': { … },
   };
   const cfg = TIER_CONFIG[level] || TIER_CONFIG['3-5'];
   ```
2. **Timers only run while playing and on screen:**
   ```js
   const isFocused = useIsFocused();              // from @react-navigation/native
   useEffect(() => {
     if (!started || !isFocused || paused || timeLeft <= 0 || hasEnded.current) return;
     const id = setInterval(() => { /* tick */ }, cfg.baseTickMs);
     return () => clearInterval(id);              // always clean up
   }, [started, isFocused, paused, timeLeft /* … */]);

   useEffect(() => navigation.addListener('blur', () => setPaused(true)), [navigation]);
   ```
3. **Keep fast-changing tallies in refs**, not state. Taps can arrive faster than re-renders:
   `const hitsRef = useRef(0); const missesRef = useRef(0); const hasEnded = useRef(false);`
4. **A one-shot `finishRun()`**, called when the clock hits 0 *or* the 3rd life is lost:
   ```js
   const finishRun = useCallback(() => {
     if (hasEnded.current) return;
     hasEnded.current = true;
     setRoundComplete({ correct: hitsRef.current, total: hitsRef.current + missesRef.current, fact: nextFact() });
   }, [nextFact]);
   ```
5. **The prize screen** uses `roundNumber={1}` and `funGame` (if it's pure
   reflex), and `onAdvance` just does `setRoundComplete(null); game.endGame();`.
6. Pass `timeLeft={timeLeft}` to `GameShell` to show the countdown pill.
7. Still call `game.answer(true/false)` on each hit or miss, so XP, missions
   and lives all work.

---

## 6. Checklist: files to add or change for a new game

| # | File | What | Required? |
|---|------|------|-----------|
| 1 | `src/data/gameContent/<camelId>.js` | Content bank or tier config, keyed by the 4 bands | Yes (unless all config lives in the component) |
| 2 | `src/components/<Name>Game.js` | The game component | Yes |
| 3 | `src/services/gameRegistry.js` | Add the registry entry (§3.1) | Yes |
| 4 | `src/components/GameFeed.js` | `import <Name>Game from './<Name>Game';` and add `<Name>Game,` to `COMPONENT_MAP` | **Yes. The only manual wiring. Forget it and the feed crashes when it reaches the game. `npm run check` fails if you do.** |
| 5 | `supabase/migrations/<YYYYMMDDHHMMSS>_<id>_facts.sql` | "Did You Know" facts (below) | Optional. No facts means no toasts or fact boxes, nothing breaks. |
| 6 | `src/data/skillLinks.js` | Link the game to real Academy lessons | Optional. Needs a real `screen` + `topicKey` from the class files, so leave it for the codebase-aware session. |
| 7 | `src/data/experienceStages.js` | Add the id to a stage's `games: [...]` in `PATHS` | Optional. Otherwise new users only see the game after they reach the "Every training game" stage (or open it by name). |

**Facts SQL template** (run it in the Supabase SQL editor; double any `'` inside the text):
```sql
insert into public.app_content (type, key, body, sort_order) values
  ('game_fact', 'example', 'One or two accurate, on-topic sentences.', 0),
  ('game_fact', 'example', 'Another fact — don''t forget to double apostrophes.', 1),
  ('game_fact', 'example', '…', 2),
  ('game_fact', 'example', '…', 3);
```

---

## 7. Rules and gotchas

1. **One id everywhere.** The registry key, `id`, `useGradeLevel(id)`, every
   `gameId=` prop, the facts `key`, and skillLinks `game` must all be the same
   lowercase string.
2. **Always use `manualScoring: true` + `RoundCompleteScreen`.** Points arrive
   only from the prize pick. Don't call `addPoints` anywhere else.
3. **Decide "out of lives" from what `game.answer()` returns**, not from
   `game.lives`. `game.lives` is still the pre-answer value inside your
   handler (and across two fast taps before a re-render); the returned
   `isOut` / `livesLeft` are already up to date. Older games compute
   `game.lives - (isCorrect ? 0 : 1) <= 0` by hand, which gives the same
   answer for one tap per render.
4. **Call `endGame()` exactly once.** Guard it with a ref in continuous games.
5. **Clean up every `setInterval`/`setTimeout`**, and pause on blur or when
   `useIsFocused()` is false.
6. **Taps only, no vertical drags.** The game sits inside a vertical swipe
   feed, so up/down drag gestures will fight the feed. (None of the 32
   existing games use drag gestures.)
7. **Colors come from `G`, styles from `makeStyles(G)`.** Check that it reads
   in both light and dark mode.
8. **Respect `showEmojis`** for decorative emoji (use an Ionicon fallback).
9. **All four bands need content.** Aim for 10+ items per band. Use `tierLabels`
   when the bands mean experience level rather than school grade. Sign-up is
   13+, so for new games write every band for teens and adults (the lowest
   band is "new to this", not "age 5") and label them by experience.
10. **Accuracy matters.** Facts and explanations must be true. Every wrong
    answer shows its explanation, so write explanations that teach.
11. **Don't edit the shared files** (`useGame`, `GameShell`, `GameOver`,
    `RoundCompleteScreen`, `GradeSelectCard`, `difficultyAdapter`,
    `gamificationService`) to fit one game. All 32 games depend on them.
12. **Keep one game in one component file.** Small helper components can live
    in the same file. Don't make new shared modules.

---

## 8. Prompt to paste into another AI chat

> I'm building a new game for my React Native (Expo 57) app. Below is my game
> system architecture doc, followed by one real game from the app as a reference.
> Follow the doc's contracts and rules exactly. Don't invent new shared
> components or hooks, and don't add npm packages.
>
> **Game idea:** <describe it: subject, what the player does, what it teaches, who it's for>
>
> Give me, as separate code blocks:
> 1. `src/data/gameContent/<id>.js`: the content, all 4 bands, 10+ items each
> 2. `src/components/<Name>Game.js`: the full component
> 3. The `gameRegistry.js` entry
> 4. The two `GameFeed.js` lines (import + COMPONENT_MAP)
> 5. A facts SQL insert with 4–6 accurate facts
>
> [paste this whole doc]
> [paste `src/components/WorldExplorerGame.js` for a quiz game, or
>  `src/components/BugSquashGame.js` for an arcade game]
> [paste the matching content file, e.g. `src/data/gameContent/worldExplorer.js`]

Pasting a real reference game along with this doc makes a big difference.
The other AI copies the working patterns instead of guessing at them.
