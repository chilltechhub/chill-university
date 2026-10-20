# The Studio: make it with the app, then take it apart

*2026-10-20. Prototype built on this date. Checked against the [North Star](north-star.md) and the [refocus](refocus-plan-2026-10-18.md).*

## Why

Reading is not how most people learn now. They get something that works, poke it, break it, change it.

> **Build first. Learn by taking it apart.**

A Build runs all four pillars in one place:

| Pillar | In a Build |
|---|---|
| **Discovery** | Pick a medium you've never tried: a page, a game, a beat, a business |
| **Education** | Each part has a 30-second "see it, change it" lesson, under 40 words |
| **Implementation** | Changing a part changes the real thing, live |
| **Execution** | **Take it home**: one real file that works anywhere |

**Passion is built, not found.** Try a few Builds in different mediums. The ones you keep going back to are the answer.

## The loop

1. **Get it.** Answer 1-2 questions. The app makes a working thing in seconds. **Value first.**
2. **Take it apart.** Every part is a card. Opening one shows how it works, and the part becomes **yours**: the everyday options open.
3. **Unlock it.** One question per part. Right → **mastered**: the upgrades open. Wrong costs nothing.
4. **Take it home.** Export the exact file the preview shows.

**Honest unlocks.** The thing works from second one. A lock only ever holds back *control*, never the result. "Not yet", never bait.

**Honest receipts.** The app tracks what it made versus what *you* changed: "You changed 2 of 4 parts."

## What's built (prototype)

| Kind | Parts (each with a lesson + check) | What you take home |
|---|---|---|
| **A page about you** | Layout · Colours · Fonts · Extra block | A web page. "What I'm learning" shows your real progress |
| **A game** | Player (sprite) · Speed (variable) · Challenge (difficulty curve) · Win rule | A catch game, touch + keys |
| **A beat** | Tempo (BPM) · Drums (pattern) · Notes (scale) · Sound (wave) | A looping beat with a step grid |
| **A small business** | Headline (outcomes) · How you charge (model) · Why trust you · Next step (one CTA) | A one-page offer. Links to Business Foundations |

**Where:** Library → Find → **Studio**.

| File | Job |
|---|---|
| `src/data/builds.js` | The kinds, parts, options and lessons. Add a kind here |
| `src/logic/builds.js` | Rules: levels, unlocks, receipt. Pure |
| `src/logic/buildRender.js` | Build → one self-contained HTML file. No network, all typed text escaped |
| `src/api/buildService.js` | Device storage (local-first, like the Dream) |
| `src/screens/studio/` | Studio list, Build screen, Part sheet |
| `src/components/BuildPreview.js` | WebView on phones, sandboxed iframe on web |
| `src/logic/studio.js` | Your pet in a Build, sparks, trophies, your pet's lines. Pure |
| `src/logic/useStudio.js` | One hook: your Builds, character, pet, room and Dream |
| `src/components/StudioStage.js`, `StudioCard.js`, `StudioShowcase.js` | The Studio's room, the Home card, the Portfolio shelf |
| `scripts/check-builds.mjs` | 478 checks: every rule, sparks, trophies, personalised renders, and every kind × option renders, escapes and parses |

**Templates, not AI.** Builds are assembled from tested parts: free to run, works offline, never makes up code. AI comes later as a **Plus** extra (personal wording, suggestions) through a server-side function like `parse-import`.

## How it ties into the whole app (2026-10-20)

The Studio is the spine: **Discover → Educate → Implement → Execute** all run through making something, and everything else points at it.

| Where | What it does now |
|---|---|
| **Onboarding** | "What did you come here for?" → **Make something**. Its first goal, **Make Your First Thing**, walks them through making a Build, taking a part apart and mastering one (the guide lights each step) |
| **Home** | Under the Dream: **the Studio card**. Nothing made yet → "Make one thing today". After that → the last Build and its next part |
| **Today's Find** | After "I tried it": **Make something with it**, opening the Build that fits the Find's area (creative → a beat, money/work → a business, digital/social → a page) |
| **Learn** | **Make something** sits above Classes: make first, go deeper second |
| **Your pet** | Stars in your game (catching its own favourite thing), sits on your page, and talks you through the Studio in the mentor voice |
| **Your character + room** | Walk around the top of the Studio, in your own backdrop and decor |
| **Your Dream** | Fills the page's "Where I'm headed" block, in your own words, and drafts "One line about you" |
| **Your room** | Master every part of a Build → its **trophy** (Page Tome, Game Key, Beat Elixir, First Coin Purse) goes in Profile → Decorate → **Trophies** |
| **Portfolio** | **Made in the Studio**: every Build with its own receipt |
| **Finding yourself** | **What you're drawn to**: the mediums you come back to, in your numbers. Two or more Builds in one medium, clearly ahead, and the app names it. Never a verdict, only what you keep doing |

## Guardrails

- **Under-18s:** export only. No public publishing (`allowed.js` already blocks publishing as a minor). Pages ask for a **first name** only.
- **No invented proof.** The business "real result" option is a prompt to fill in, never a made-up number.
- **Every lesson is interactive.** If a screen would just be text, it's a "go deeper" link instead.

## Test before building more

Give it to **5 people**. Watch, don't help. The questions:

1. Did they finish a Build and say *"wait, I made this?"*
2. Did they open a second part without being told?
3. Did they take one home, or show someone?

If yes → grow it. If no → fix the first minute before adding anything.

## Next (only after the test)

1. **Account sync.** A `builds` table, the same pattern as `dreams`.
2. **Tier 2 per kind.** The same Build, the app does less: you write one part yourself (real CSS, a real game variable).
3. **More kinds.** An AI helper, a money sheet, a resume, a short story. Then hardware (the app makes the wiring + code; your hands do the rest).
4. **Bridge picks.** "You finished a beat. Try a game." Simple rules, no machine learning.
5. **Content goes live.**
6. **Your pet's real sprite in the file.** Today an emoji stands in (an HTML file can't carry the pixel art without embedding it). Move `builds.js` to `app_content` so it changes without an app update.

**Parked:** simulators, WebGL engines, 1-click hosting, GitHub sync.
