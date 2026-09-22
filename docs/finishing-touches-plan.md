# Finishing touches — launch readiness + Plain/Command visual system

Plan written 2026-09-21. Combines the outside review, the design-principles
pass, and the Plain/Command theme idea, **checked against the actual code**.
Where the review was wrong, it says so below. Nothing here is built yet.

---

## What the code actually says (review corrections)

| Review claim | Reality |
|---|---|
| "No `scheme`" | Wrong: `app.json` has `"scheme": "chillapp"`. |
| "No notifications plugin / splash plugin" | Wrong: `app.config.js` adds `expo-notifications`, `expo-splash-screen`, fonts, share-intent. |
| "iOS needs a notification purpose string" | Wrong: iOS has no Info.plist string for notifications. Android 13's `POST_NOTIFICATIONS` is added by the plugin. What's left is checking *when* we ask (see 0.3). |
| `userInterfaceStyle: "light"` is a problem | **Worse than the review said.** With `"light"`, `useColorScheme()` always returns `light` on a device, so ThemeContext's "follow system" default never follows the system. Real bug. |
| Anon key might be a service key | Checked: the JWT payload says `"role":"anon"`. Fine. |
| Screens might import `archive/` | Checked: nothing in `App.js`, `src/`, or `context/` imports it. |
| Terms link | `TERMS_URL = null` in `src/config/legal.js`. Plus falls back to Apple's standard EULA. That works for the App Store but **not** for Google Play. |
| Theme is "tokens only, swap and done" | **Not true for this codebase.** The HUD look is hard-coded: 209 `textTransform: 'uppercase'`, 147 HUD font uses across 41 files, 278 `letterSpacing`, ~630 raw hex colors in screens/components. `SectionLabel`, `Card`, and `PrimaryButton` are each written 3–5 times in different files. Plain/Command has to go through shared components and a screen-by-screen migration. It can't be a token flip. |

Also found:
- **Settings has only a Dark on/off switch.** Once you touch it you can never get back to "follow system" (`followSystem()` exists but nothing calls it).
- **The splash is white in both modes.** A dark-mode user gets a white flash on launch.
- `ThemeContext`'s `useMemo` only re-runs on `[activeName, colors]`. Any new field (style, accent) must be added there, or screens won't re-render when it changes.
- Remember the `{c,t,s,r}` shorthand gotcha: `useTheme()` returns long names, and most components expect the shorthand.

---

## Status (2026-09-21, branch `feature/finishing-touches`, stacked on `feature/fill-with-ai`)

**Phase 1: done, checked in the web preview.** Mode/Style/Accent in Settings. All three save and switch live. "System" clears the saved mode. Emojis follow the style until the user sets them. Onboarding's `finish()` suggests the persona's accent once.

**Phase 0: code parts done** (`automatic` theme, dark splash). Verified with no change needed:
- Notification prompts only fire after the user turns on a reminder.
- `kids_accounts` and `plus_on_sale` have no rows in `app_config`, and both default to off in code. `maintenance_mode` is off and `disabled_games` is `[]`.
- `npm run check` is green.

**Resolved 2026-09-21:**
- App renamed **Deskartes** (display name only; slug/bundle id unchanged). New pencil-D icon, adaptive icon, light and dark splash, and favicon are rendered from `scripts/render-brand-assets.mjs`, which is the icon's source of truth. Login and Reset show the mark.
- `TERMS_URL` = https://chilltechhub.com/terms (live, covers Plus renewal).
- Age rating: **12+**.

**Still open:** the privacy-policy wording check on a phone.
- Found along the way (Phase 3): a guest on Profile sees "Not signed in" plus a "Your rank" tutorial bubble pointing at nothing. Guests also can't reach Settings at all, so they can't change appearance.
- Found along the way (Phase 4): the existing light-mode `colors.teal` (#1a8a7a) and `colors.gold` (#9a7228) are ~4.2:1 on white, just under AA. The new accents use AA-passing shades. The rest of the app still uses the old ones.

---

## Phase 0 — Store guardrails (½–1 day) · P0

**0.1 Theme follows the system**
- `app.json`: `"userInterfaceStyle": "automatic"`.
- Splash plugin: add a `dark: { image, backgroundColor: '#12161f' }` entry.
- Android `adaptiveIcon.backgroundColor`: confirm `#ffffff` looks right next to dark launchers.

**0.2 Legal**
- Publish a Terms page on chilltechhub.com, then set `TERMS_URL`. That also fixes the Google Play gap, the Login "Terms" link, and Settings.
- Open the privacy policy on a phone and check that its wording matches what onboarding says we store (email, DOB, usage, purchases, on-device AI key).
- Fill App Privacy labels and the Play Data Safety form from that same list.

**0.3 Notification permission timing**
- Three places call `requestPermissionsAsync`: `CalendarModal`, `notificationScheduler.ensureNotificationPermission`, and `planReminderActions`. Trace every caller of `ensureNotificationPermission`, and make sure none of them runs at launch or during onboarding. The prompt should only appear right after the user asks for a reminder.

**0.4 Production flags (Supabase `app_config`)**
- `maintenance_mode` off, `disabled_games` empty or intended, `plus_on_sale` intended.
- `kids_accounts` **off**. This follows the launch strategy (13+ consumer first).

**0.5 Decisions only you can make** (not code)
- Age rating and category. With 13+ launch and adult business tracks, **12+ under Education or Productivity** is the honest fit. The listing copy shouldn't pitch to kids.

**0.6 `npm run check` is green** before every build.

---

## Phase 1 — Theme architecture (2 days) · P1

Three settings, all worked out in one place:

```
Mode   : system | light | dark        (exists, fix "system")
Style  : plain  | command             (NEW: fonts, label case, corners, shadows)
Accent : teal   | gold  | slate       (NEW: primary buttons/CTAs only)
```

**1.1 `src/theme.js`: add `STYLES` and `ACCENTS`**
```js
export const STYLES = {
  plain:   { labelFont: null,        labelCase: 'none',      labelTracking: 0,
             titleFont: null,        cardRadius: 14, buttonRadius: 12,
             border: 'soft', shadow: 'sm', emojiDefault: false },
  command: { labelFont: FONTS.mono,  labelCase: 'uppercase', labelTracking: 1.5,
             titleFont: FONTS.display, cardRadius: 6,  buttonRadius: 6,
             border: 'hard', shadow: 'none', emojiDefault: true },
};
export const ACCENTS = {   // per mode, so contrast holds in light and dark
  teal:  { light: {...from teal*}, dark: {...} },
  gold:  { light: {...from gold*}, dark: {...} },
  slate: { light: {...},           dark: {...} },   // "neutral / professional"
};
```
Crest-colour accent is **left out of v1**: user-picked colours can't be checked for contrast.

**1.2 `context/ThemeContext.js`**
- Save `styleName` and `accentName` next to the mode (`@cth_theme_style`, `@cth_theme_accent`).
- Return `{ ..., style, styleName, setStyle, accent, accentName, setAccent, isSystem, followSystem }`.
- `accent` = `{ primary, primaryMuted, onPrimary }` for the current mode.
- Add the new fields to the `useMemo` dependency list.
- Default for everyone is **plain + teal**. There are zero users, so nothing needs migrating.

**1.3 How it links to UIPrefs**
- The first time someone switches Style, set `showEmojis` from `style.emojiDefault`. After that it's their own setting and style changes leave it alone. No third "minimal" mode.

**1.4 Settings → Appearance**
- Mode: a 3-way segmented control (System / Light / Dark), replacing the Dark switch.
- Style: Plain / Command, each with a small preview card.
- Accent: 3 colour dots.
- Keep the existing emoji and subtitle toggles below them.

**1.5 Persona only suggests, and only the accent**
- Student → teal, Personal → teal, Business → slate, Entrepreneur → gold.
- Written once when the profile is created, and only if the user hasn't picked one. Style stays plain for everyone.
- **Don't add an onboarding step.** The fast-core onboarding (3 steps) stays as is. Also check the onboarding memory note about what *not* to put back into `finish()`: this may belong where the persona is written, not in `finish()`.

**Done when:** switching Style in Settings visibly changes Settings itself. That's the first screen moved over, and it proves the setup works.

---

## Phase 2 — Shared components (2–3 days) · P1

New folder `src/components/ui/`. Each component reads `useTheme()` itself, so no `c/t/s` passing:

| Component | Replaces |
|---|---|
| `SectionLabel` | 5 copies (Settings, Family, Org, Cohort, onboarding) + GamesScreen `SectionHeader` |
| `Card` | QuestScreen `Card`, Wayfinder `Card`, hand-built cards on Home |
| `Button` (`variant: primary \| secondary \| ghost`) | QuestScreen/Wayfinder `PrimaryButton`, ad-hoc CTAs |
| `ListRow` | icon + title + meta + chevron rows in Settings/Library |
| `EmptyState` | title + one line + one CTA |
| `ScreenTitle` | title + optional subtext (respects `showSubtext`) |

**Guard against drift:** add `scripts/check-style.mjs` to `npm run check`. It fails when a file on the "migrated" list uses `FONTS.mono`, `FONTS.display`, `textTransform: 'uppercase'`, or a raw hex colour. It works like `check-tour-spots`, and the list grows as screens move over.

**Move over in this order:** Settings → TopBar → Home → Library hub → FeatureGate → GameOver.

**Scope, stated plainly:** everything else keeps its current HUD look in both styles until it's moved. That's fine because it's where users go *later*, and Command is the look they already have.

**Leave alone:** Workshop blueprint, GameShell/`useGameTheme`, Idea Garden. These only get light/dark, plus the accent on their main button.

---

## Phase 3 — "One next action" screens (3–4 days) · P0 for Home

Read the code first. These are from the review and haven't been checked against the code yet, so each starts with a ~30 min look.

**3.1 Home (the demo screen)**
- Above the fold: the current guided step, *or* the top next action on the desk. Nothing else gets equal weight.
- Widgets get quieter borders and no competing colours in Plain.
- Getting Started must never show beside the first-goal highlight (the review thinks it's already gated; confirm it).
- Empty widgets: one coaching line plus one button.

**3.2 FeatureGate + empty states:** every lock says what it is, how to unlock it, and gives one button. No "Nothing here."

**3.3 GameOver:** three clear exits: *Play again · Related lesson · Done*. Put "why" feedback before any stats when the content has it.

**3.4 Workshop project cards:** always show the next action, or a "Set next step" button.

**3.5 Capture:** confirm saving takes no choices first, and that "Process" is optional after saving.

**3.6 Guide resume:** after two "Not now"s, the Compass "Show me how" button is easy to find.

---

## Phase 4 — Polish (1–2 days) · P2
- Motion: 200–300 ms for sheets and tabs, no decorative looping.
- Contrast: check `text2` on `bg1` and the accent on `bg0` in both modes and all 3 accents. Aim for WCAG AA.
- Tab bar: the active colour uses the accent, not the hard-coded `tabActive` gold.
- Don't use colour alone for right/wrong answers in games. Add an icon.

---

## Phase 5 — Device QA + store (1–2 days) · P0 before submit

Production EAS build on a real iPhone and Android phone:
- [ ] New account for each of the 4 personas: age gate → persona → areas → Home shows one guided step
- [ ] Finish the first goal → the next stage opens → Getting Started shows up only then
- [ ] Say "Not now" twice → resume from Compass
- [ ] Guest: no adult tracks, no community posting, no broken checklist; signing up later forces the age gate
- [ ] Replay the tutorial from Settings
- [ ] Delete the account end to end
- [ ] Restore purchases
- [ ] Notification prompt appears only when setting a reminder
- [ ] Phone set to System → dark: app and splash both dark
- [ ] Offline capture → back online → it syncs
- [ ] Screenshots: Plain + light Home, one Training screen, Workshop

---

## Order and effort

| # | Work | Effort | Why this order |
|---|---|---|---|
| 1 | Phase 0 (config, legal, flags) | ½–1 d | Blocks submission; cheap |
| 2 | 1.1–1.4 theme settings + Settings screen | 2 d | Base everything else builds on |
| 3 | Phase 2 components + check-style, Settings/TopBar/Home | 2 d | Makes Plain real where people look |
| 4 | 3.1 Home hierarchy | 1–2 d | Biggest single improvement to first impressions |
| 5 | Library hub, FeatureGate, GameOver moved over + 3.2–3.3 | 2 d | Next most-seen screens |
| 6 | 1.5 persona accent, 3.4–3.6, Phase 4 | 2 d | Polish |
| 7 | Phase 5 device QA | 1–2 d | Before submission |

**About 11–13 days in total.** A **~5-day version** that's credible for submission: rows 1–4 plus Phase 5.

## Not doing
- Themes per persona (a Student-purple Library, etc.)
- Restyling the Workshop, games, or Garden
- A crest-colour accent (v1)
- A new onboarding step for the look
- Moving all 100+ themed files over before launch
- New gamification or social features
