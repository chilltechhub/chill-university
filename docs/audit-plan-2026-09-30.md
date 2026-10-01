# Gemini audits (2026-09-30): diagnosis and fix plan

Two rounds of Gemini audits, checked against the live code on `main`
(078ff49) and the live Supabase project:

- **Round 1** (4 PDFs, ~16:50): UX/growth/performance, security + compliance,
  compliance, performance. Claims #1–#42.
- **Round 2** (5 PDFs, ~17:10, re-packed as two files): security, UX,
  growth/monetization, performance, compliance. Claims R1–R38, listing only
  what's new or different; repeats point back to round 1.

Every claim is listed with what the code actually does.

## Status

| Phase | What | State |
| --- | --- | --- |
| 0 | Make future audits read the real code | done — `archive/` deleted, three measured packs (PR #33, merged) |
| 1 | Crash safety (error screen, crash reports, request timeouts) | merged (PR #33, 2026-09-30): 1.1, 1.3, 1.4, 1.6 done, signed-in Home checked; 1.5 code done, **SQL is yours to run**; 1.2 later (your call; the hook, `src/logic/errorReporting.js`, is in) |
| 2 | Daily loop fixes (reminder taps, re-renders, dead code) | built on `fix/audit-phase2`, checked on web signed in 2026-09-30: 2.1–2.5, 2.7 (revised) and 2.8 done; 2.6 (optional DB trigger) left out; **pet-coin SQL is yours to run** |
| 3 | Store readiness | not started (3.2 is yours) |
| 4 | Retention features | needs your decisions first |

## Why most of the audit missed

`repomix-output.xml` is 7.2 MB, about 1.8M tokens, which is more than
Gemini can read. Repomix sorts files with the fewest git changes first, so
`archive/` (old, dead code) sat at the top, and the live screens, the most
edited files, were at the bottom where Gemini stopped reading. So:

- **Audit 2 (security)** and **audit 4 (performance)** are almost all about
  `archive/`: `AddChildByCode.js`, `ProfileQuickSetup.js`, `GameMenuGrid.js`,
  `UserProgressContext1.01.js`. None of these files is imported by the app,
  and Metro bundles only imported files.
- **Audit 2's compliance half** says itself that it got no code.
- **Audit 3** names real files, but guessed at what they do. It lists camera
  permissions the app doesn't use.
- **Audit 1** names real files, but several claims are wrong ("no RevenueCat",
  "timers never cleared").

**Round 2 had the same problem.** The re-pack split off `supabase/` into a
second file (0.97 MB), but part 1 was still 6.3 MB (~1.6M tokens) and still
opened with `.claude/settings.local.json` and 61 `archive/` files. Gemini can
name live files because repomix lists every path at the top, but it quoted
archive code again: `AddChildByCode`, `UserProgressContext1.02.js`,
`useSkillLevel.js`, `GameMenuGrid`, `StickmanAvatar`, and the old 8-question
onboarding. The fix is in Phase 0.3: two packs, both measured to fit.

**Secret check on the pack:** it holds no service-role key, no `sk_`/`sbp_`/
Anthropic keys and no `.env.test`. The only key in it is the public anon
key, which ships in the app anyway. Nothing needs rotating because of this.

## Diagnosis: every claim

Verdicts: **Real** = true today and worth fixing · **Partly** · **Fixed** =
it was true once, fixed before · **Archive** = only in `archive/` · **False** ·
**N/A** = doesn't apply to this app · **Decision** = a product call, not a bug.

### Audit 1: UX, growth, performance

| # | Claim | Verdict | What the code shows |
| --- | --- | --- | --- |
| 1 | Onboarding: 8-question survey plus life-area tree, ~10 inputs before the first game | Partly | Live onboarding is 7 cards (`MultiStepOnboarding.js:98`), and the first asks nothing. The real friction is signup itself: guest mode exists, but it is 25%-opacity text reading "progress won't be saved" (`LoginScreen.js:448`, `:488`), and guest points live only in `useState`, so they are lost on reload and never carried into an account |
| 2 | Double headers: TopBar over screens that have their own header | False | TopBar is the points display, hidden on Login/Onboarding/Reset/Plus (`App.js:213`). It stays on during games on purpose, so awards visibly bump it |
| 3 | Inbox and Planner have no empty states | False | Both have an icon, a reason and a button (`CaptureInbox.js:1723`, `PlannerScreen.js:907`) |
| 4 | Reminder taps open the app generically, with no deep link | Real (3 kinds) | "Daily Drills open", "Streak at risk" and life-area action reminders carry no `data.target` (`notificationScheduler.js:93`, `:185`). Hub and planner reminders already deep-link, including cold start (`hubNotifications.js:121`, `:164`, `:210`) |
| 5 | Points have nothing to spend on | Decision | True: points are a score (rank → tier → theme). What to add is a values call, see D4 |
| 6 | No spaced repetition of missed questions | Real | `questionRotation.js` avoids repeats within a session only. Already on the backlog as learning-quests phase 4 ("per-topic mastery + review queue") |
| 7 | Planner has no calendar sync and no drag-and-drop | Real | No `expo-calendar`, no drag code in `PlannerScreen.js`. A product gap, not a bug |
| 8 | "No RevenueCat, no paywall, no feature gates: 2/10" | False | `react-native-purchases` 10.10, `PlusScreen.js`, `PlusContext.js`, `plusContent.js`. **But** see 3.2: the purchase-sync function is still not deployed |
| 9 | No sharing or viral hooks | Partly | `shareOut.js` shares projects, day plans and reminders. Nothing shares progress (level-up, quest done), and there are no invites |
| 10 | Marketing hook: "100% local-first, your data stays on your device, no cloud" | False, don't use it | Everything syncs to Supabase. This copy would contradict the privacy policy and the App Store privacy label |
| 11 | Pricing $9.99/mo · $49.99/yr · $129.99 lifetime, paywall after the first game, paid streak shields and XP boosts, 500 coins per referral | Decision (rejected) | You already chose $2.99 / $24.99 with a 7-day trial. Paid streak shields, XP multipliers and paid-for-invites are the pressure mechanics your values rule out, and 13+ still includes minors |
| 12 | `UserProgressContext` value isn't memoized, so everything re-renders | Real, smaller than claimed | `context/UserProgressContext.js:480` builds a new object every render, and it's the only context without `useMemo`. It isn't "every 100 ms timer tick" (timers are local), but each award or profile change re-renders all 39 components that read it |
| 13 | `RushTimerBar` never clears its interval, so timers leak | False | Cleared in the effect cleanup (`RushTimerBar.js:60`). All 15 files that use `setInterval` clear it, and listeners are removed |
| 14 | `offlineCache` / `plannerService` swallow storage errors, losing data | Mostly false | A failed write is re-queued (`offlineCache.js:108`), and the replay drops only permanent rejects and counts them. The 37 empty `catch {}` app-wide are best-effort (cache deletes, cancelling notifications). The real gap is no crash reporting (#37) |
| 15 | Lists need FlatList tuning | Low | Inbox and Planner use `ScrollView` + `map`. Fine at today's volumes; revisit if someone has hundreds of items |
| 16 | No error boundary | Real | No `componentDidCatch` anywhere. One render error in any screen blanks the whole app |
| 17 | Pause timers when the app goes to the background | Low | `RushTimerBar` is step-based, so a late tick can't skip to zero |
| 18 | Guard cached/loaded data against bad shapes | Partly done | `topics` array/string handled (`UserProgressContext.js:299`) |

### Audit 2: security (almost all `archive/`)

| # | Claim | Verdict | What the code shows |
| --- | --- | --- | --- |
| 19 | `AddChildByCode` trusts a `parentId` prop (IDOR), race on invite use, Date object in query | Archive | Not imported (`App.js:96`). Live family linking is the `redeem_family_code` RPC, hardened in fix-plan 1.7 |
| 20 | Onboarding logs the profile payload (PII) to the console | Archive | Live code has 4 `console.log`s, none with personal data. One is a leftover debug log that fires every render (`PlacementEditor.js:12`), remove it |
| 21 | `topics.split` crashes when `topics` is an array | Fixed | `UserProgressContext.js:299` |
| 22 | Auth listener runs async loads unguarded | Fixed | The 2026-09-27 cold-start deadlock fix defers the load (`UserProgressContext.js:150`) |
| 23 | `ProfileQuickSetup.js` is truncated and breaks the build | Archive | Not imported, so never bundled |
| 24 | Login has no input validation | Mostly false | Signup requires the terms tick and 6+ characters, and errors are shown. Optional: raise to 8 |
| 25 | `MissionsOverlay` can never be seen | Real, trivial | `App.js:197`: its `visible` is never set true. Dead code, remove |
| 26 | `.claude/settings.local.json` is committed | False | Not tracked, ignored by your global git ignore, no secrets in it |
| 27 | Finishing onboarding overwrites saved answers with defaults | Archive | Live saves partial fields plus a draft (`onboardingService.js:42`) |

### Audits 2 and 3: store compliance

| # | Claim | Verdict | What the code shows |
| --- | --- | --- | --- |
| 28 | In-app account deletion | Pass, one gap | Settings → Delete Account runs the RPC, cancels reminders, wipes local data and signs out (`SettingsScreen.js:762`). **Gap:** nothing says a store subscription keeps billing after deletion, which Apple asks apps to tell people |
| 29 | Paywall needs Restore, Terms and Privacy links, and renewal terms | Pass | `PlusScreen.js:159`, `:165`, `:248`. Both URLs return 200 |
| 30 | Parental gate before outbound links for children | N/A for v1 | Under-13 signup is closed in v1 (`kids_closed`). Revisit when `kids_accounts` is turned on for v2 |
| 31 | Community/Leaderboard spin forever offline | Partly | Leaderboard has an error state with "Try again". Community hides network errors and shows an empty feed (`CommunityFeedScreen.js:101`). No Supabase request has a timeout, so a stalled request spins forever (only boot has a 10 s guard) |
| 32 | Camera/photo permission strings | N/A | The app uses no camera, photo or location modules. Notifications are asked in context, not on launch (`onboarding/steps.js:847`) |
| 33 | iOS privacy manifest | Check at first build | Expo SDK 57's build template and the installed modules ship their own manifests. Check App Store Connect for an ITMS-91053 warning on the first upload |
| 34 | Report and block for user posts (Apple 1.2; not raised by the audits) | Pass | `CommunityFeedScreen.js:183` |
| 35 | Sign in with Apple | N/A | Email login only, so it isn't required |
| 36 | Reviewer test account in the review notes | Real, to do | Needs an onboarded adult account and a note that under-13 signup closes by design |

### Audit 4: performance and reliability

| # | Claim | Verdict | What the code shows |
| --- | --- | --- | --- |
| 37 | No crash reporting | Real | No Sentry or Crashlytics. Production crashes would be invisible |
| 38 | Analytics writes block the UI | Archive | Live has no client analytics. `docs/metrics.sql` measures the funnel from data already stored |
| 39 | `GameMenuGrid` inline `renderItem` | Archive | The file isn't in `src/` |
| 40 | `sampleUsers1.js` bundles images | Archive | |
| 41 | No environment validation or staging | Low | One Supabase project. The client warns if the URL or key is missing, and `.env` is committed, so EAS has it |
| 42 | OTA updates don't fall back when broken | N/A | `expo-updates` isn't installed. Adding EAS Update for post-launch hotfixes is optional (D2) |

### Round 2: new or different claims

| # | Claim | Verdict | What the code shows |
| --- | --- | --- | --- |
| R1 | `AddChildByCode`: trusted `parentId`, invite race, Date in query | Archive | Same as #19 |
| R2 | Progress context clears "loading" before the profile arrives | Fixed | The quoted code is `archive/context/UserProgressContext1.02.js`. Live has one listener and a deferred load (`UserProgressContext.js:163`) |
| R3 | `useSkillLevel` storage read has no `.catch`, so it hangs forever | Archive | No `useSkillLevel` in `src/`. `cacheRead` catches its own errors anyway (`offlineCache.js:25`) |
| R4 | Profile payloads logged to the console | Archive | Same as #20 |
| R5 | `upsert(..., { returning: 'minimal' })` breaks on supabase-js v2 | Archive | Not used anywhere in live code |
| R6 | UTC date strings break streaks in the evening | Partly | Live dates go through `dateUtils.todayStr()` (local), and the streak is counted on the server. **One leftover:** `StudentWidgets.js:17` asks for "today's" planner items with a UTC date, so in the US after about 8 pm the Student Home widget shows tomorrow |
| R7 | Text inputs not trimmed | Archive | `AddChildByCode` / old `OnboardingScreen` |
| R8 | `LevelSelectCard` calls `goBack()` without a stack | Archive | |
| R9 | `archive/` inflates the bundle | False for the bundle | Metro bundles only imported files. It is what keeps confusing the audits, though, see D1 |
| R10 | Onboarding is 8 text-heavy question lists (motivation, growth areas, topics…) | Archive | That's the old `QUESTIONS` list. Live onboarding is 7 short cards (#1) |
| R11 | Daily missions hidden in a popup, not on Home | False | `DailyDrillsWidget` is on Home for Personal and Student (`personas.js:62`, `:78`). The popup in `App.js` is the dead code in #25 |
| R12 | Guest progress is lost; merge guest XP and points into the account at signup | Real, but not that fix | Same as #1. Merging points would undo the server-side points rules (fix plan 4.8): anyone could farm as a guest and cash in. See 4.1 |
| R13 | Reminders don't adapt to the person's goals | Partly, low | "Streak at risk" only fires if you haven't checked in (`notificationScheduler.js:147`). The wording is generic |
| R14 | No streak freeze | Decision | There's a one-day grace on the badge (`UserProgressContext.js:465`), then it resets. See D6 |
| R15 | Finishing a task or project earns nothing | Real | XP and missions come only from games, lessons, quests, pet coins and the streak (`gamificationService.js:269`, `:380`). Planner items, project steps, life-area actions and goals earn nothing. Related: the streak counts *opening the app* (`touchStreak` on load, `UserProgressContext.js:251`), and the reminder says "open the app before midnight". See 4.7, D5 |
| R16 | Home isn't personalized by onboarding answers | False | Account type and aim pick the Home widgets (`personas.js` `defaultWidgets`) |
| R17 | Visual skill tree for classes | Decision | Big build, v1.1 at the earliest |
| R18 | Plus content is a hard block with no preview | False | The first lesson of each level is free (`plusContent.js`) |
| R19 | Paywall has no fallback when prices fail to load | False | Spinner, message and "Try again" (`PlusScreen.js:187`) |
| R20 | Put a 7-day-trial paywall inside onboarding | Decision (default no) | The trial is on the paywall. A paywall before someone has used the app runs against the "value before payment" idea the same audit praises |
| R21 | Consumable coin packs ($0.99 / 100 coins), exit-intent downsell, win-back discounts, a free Plus month per referral | Rejected | Pay-for-progress and pressure tactics, and 13+ still includes minors. Same call as #11 |
| R22 | Family Plus ($9.99, 5 profiles), Classroom Pro | v2 | Families, schools and B2B are v2 in the launch strategy |
| R23 | Marketing hook: "Parent-approved, COPPA-compliant micro-learning" | Don't use | v1 closes under-13 signup, so the app doesn't serve children. Claiming COPPA compliance in ads invites FTC attention for no benefit |
| R24 | No Sentry, no error boundary | Real | Same as #16 and #37 |
| R25 | Onboarding analytics inserts block the UI | Archive | Same as #38 |
| R26 | Auth listener cleanup can throw | Archive | Live cleanup: `UserProgressContext.js:179` |
| R27 | `GameMenuGrid` / `StickmanAvatar` re-render too much | Archive | Neither file is in `src/` |
| R28 | `streakDays` / `gameplayStats` recomputed every render | Partly | `gameplayStats` is computed once per load, not per render, and `streakDays` is trivial. The real part is the unmemoized value (#12) |
| R29 | Feature flags hard-coded in components | False | `RemoteConfigContext.js`: `app_config` table, `useFeatureFlag`, `useConfigValue` |
| R30 | No env validation, no OTA fallback | Same as #41, #42 | |
| R31 | Account deletion missing or incomplete | Pass | Same as #28 |
| R32 | Paywall needs Restore, legal links, renewal terms | Pass | Same as #29 |
| R33 | Add camera, photo library and tracking (ATT) permission strings | Don't | The app uses none of them. A tracking string would contradict "no tracking" on the privacy label |
| R34 | Hand-write `ios/PrivacyInfo.xcprivacy` | N/A as written | There is no `ios/` folder; EAS generates it on each build. If an entry is ever needed it goes in `app.json` → `ios.privacyManifests`. Same check as #33 |
| R35 | Parental gate on links, community and paywall "because the app serves children" | N/A for v1 | Same as #30 |
| R36 | Reviewers need a KWS/parent-consent bypass | N/A for v1 | Under-13 signup closes by design, so say that in the review notes. Guest mode already lets a reviewer in without an account (`LoginScreen.js:448`) |
| R37 | Privacy label: identifiers, email, purchases, usage, birth date | Agree | Goes into 3.3 |
| R38 | Fill in the age-rating questionnaire honestly (user posts) | Agree | Goes into 3.3 |

### Round 3: security audit on the backend pack (`audit_1.2.pdf`)

The first audit that read the live code: it quotes real comments and every
file it names exists. About half its claims hold up, and two are new: #S1
and #S5.

| # | Claim | Verdict | What the code shows |
| --- | --- | --- | --- |
| S1 | Two-step sign-in is enforced only by the app, so someone with just the password can use the API directly | Real | `mfa.js:10` says so, and no migration checks `aal`. Needs the password first, and 2FA is opt-in, but a person who turned it on is not protected the way the setting implies. See 1.5 |
| S2 | Profile scoping has a global off-switch and passes through with no profile, leaking across profiles | Overstated | Profiles are sub-profiles inside **one** account (personal / night job), and RLS still limits every row to its owner, so nobody can see another person's data. The off-switch (`profileScopedClient.js:84`) is a deliberate safety net that trips only if the `profile_id` column is missing, and it isn't. Small real part: a write made before the active profile loads gets `profile_id` null and drops out of scoped views (the stress-test "vanishing rows"; the known causes were fixed in fix-plan phase 2). Gemini's "throw on write" fix would break those early writes. See 2.6 |
| S3 | AI key stored in plain localStorage on web | N/A | Web is test-only. On phones it's in the Keychain/Keystore (`aiKey.js:13`). The base64 "fix" isn't encryption anyway |
| S4 | Life-area "link" actions open any URL scheme | Partly | `areaActionsService.js:205`. URLs come from built-in actions and the person's own edits (including AI-pasted changes), so the worst case is self-inflicted, but it should follow the same http(s)-only rule as community links (fix-plan 1.11). See 2.5 |
| S5 | Export My Data passes the whole account as one giant share-sheet message | Real | `dataExport.js:85`: `Share.share({ message: json })`. The test account's export was 314 KB, and a heavy user's will be far bigger. It should share a `.json` file. See 1.6 |
| S6 | Guests are locked out of the paywall (`ready` never turns true) | Partly | True that `ready` stays false for guests (`PlusContext.js:44`), but the screen shows "Sign in to get Plus" on purpose (`PlusScreen.js:175`), not a spinner. Real gaps: no sign-in button there, and no prices shown. See 3.5 |
| S7 | `buildSessionRows` crashes on an undefined project or days | False | Both callers always build the project (`aiBridgeData.js:287`, `workSessions.js:70`), and missing days return an empty list (`aiBridgeFormat.js:152`) |
| W1 | Wayfinder's `remoteMissing` switches off sync after one network blip | False | Trips only when the table doesn't exist (42P01 / PGRST205), `wayfinderService.js:38` |
| W2 | `PlusContext` memo depends on the whole profile | Real, minor | `PlusContext.js:131`. Every points award changes `profile`, so every Plus consumer re-renders. Folded into 2.2 |
| W3 | Wayfinder's 900 ms debounce pushes stale data | False | Each call clears the previous timer (`wayfinderService.js:109`), so the latest state wins |
| W4 | `loadUserEdits` breaks when `screenTags` is undefined | False | Both callers pass a tag, and an error returns an empty list (`areaActionsService.js:88`) |
| W5 | `console.warn`s in services; hard-coded MFA `friendlyName` | Not a problem | Warnings are fine to ship. The `Date.now()` name is deliberate: factor names must be unique per account |

### Round 4: UX, growth, performance and compliance on the new packs

`audit_2.2` (UX, ui pack), `audit_3.2` (growth, backend pack), `audit_4.2`
(performance, core pack), `audit_5.5` (compliance, backend pack). All four read
live code. Most of what they flag is already handled or known; the new real
items are #P6, #P12 and #U1, and #C10 is a useful store step.

| # | Claim | Verdict | What the code shows |
| --- | --- | --- | --- |
| U1 | `SmartCollectionScreen` uses hard-coded colors, so it breaks in dark mode | Real, but the fix is different | Nothing imports it: it's a dead file. Delete it, which also removes 2 of the 4 leftover `console.log`s. See 2.3 |
| U2 | `TimePickerField` opens a Modal inside other Modals (calendar, reminders) | Unverified | `TimePickerField.js:66`, used inside `CalendarModal` and `ReminderComposer`. Works on web. Nested Modals usually work on iOS when the child renders inside the parent, but Android can clip. Added to phone QA |
| U3 | Saves block the UI; make them optimistic | Low | Saves show a spinner for a network call. `offlineWrite` already queues failures. Not worth a rewrite now |
| U4 | Spaced review for Vault notes ("Add my own knowledge") too | Idea | Fits 4.2's review queue as an option |
| U5 | Pet mood drops when you miss days | Rejected (default) | A guilt mechanic, the kind your values rule out |
| U6 | Streak shields bought with earned points; smaller daily goals after quiet stretches | Idea | Streak shields fit D4 or D6 (earned, never paid for). Scaling goals down is a good idea for later |
| U7 | Auto-file shared links with AI in the background | Idea, v1.1 | Costs AI calls per share; the paste → "Plan with AI" path exists today |
| G1 | Value prop: "local-first, COPPA-compliant", "verified COPPA-safe for families" | Don't use | Same as #10 and R23. Third time Gemini has proposed it |
| G2 | Minors stall waiting on parent verification | N/A for v1 | Under-consent-age signup closes in v1 |
| G3 | Switching profiles makes items look lost; show which profile is active | False | TopBar shows the active profile's name and emoji (`ProfileSwitcher.js:196`) |
| G4 | Plus content is a hard gate with no preview | False | First lesson of each level free (`plusContent.js`). Same as R18 |
| G5 | Add a hosted-AI Plus tier for people without their own key | Already built | AI Import uses the app's key and requires Plus (`parse-import`). Blocked only on deploying it (3.2) |
| G6 | Lifetime pass | Decision | Friendly to people who hate subscriptions, but hosted AI costs would then run forever with no income. See D7 |
| G7 | Win-back discounts on paywall dismissal; seat licensing; family referral trials; teacher roster links | Rejected / v2 | Same calls as R21 and R22 |
| P1 | No crash reporting, no error boundary | Real | Same as #16, #37 (1.1, 1.2) |
| P2 | Silent catches in `aiKey`, `remoteConfigService`, `purchases`, `areaActionsService` cache parsing | Low | Each is a deliberate fallback (unset key, default config, no customer info, bundled actions). Crash reporting (1.2) is the real answer |
| P3 | Export embeds per-table errors in the JSON | By design | A partial export beats none, and the error names the table |
| P4 | Wayfinder's pending push can write after sign-out or into another account | False | The write carries the old user id, and RLS refuses it for anyone else |
| P5 | `PlusContext` updates state after unmount | False | The provider lives for the whole app |
| P6 | Animated sprites run an 8 fps `setState` timer | Real, small | `AnimatedSprite.js:22`, and `CharacterWalker` (Training) has two timers. None of them pause when the tab isn't visible, and Training stays mounted behind Home and Library, so the walker animates all session. See 2.7 |
| P7 | `FolderRow` rebuilds its styles every render | Trivial | `FolderRow.js:16`. Cheap to wrap in `useMemo` while nearby |
| P8 | `BadgePopup` inline `renderItem`; Proxy allocation in the scoped client | Negligible | A handful of badges; a Proxy per query is noise next to the network call |
| P9 | `eas.json` has no env or update channels | N/A | `.env` is committed on purpose, and channels matter only with `expo-updates` (D2) |
| P10 | `wayfinderService` doesn't handle a missing table | False | It does, `wayfinderService.js:38` (the audit contradicts itself) |
| P11 | Sprites should use Lottie or Skia | No | Small PNG sheets are fine |
| P12 | Export runs ~28 queries one after another | Real | `dataExport.js:47`. Run them a few at a time. See 1.6 |
| C1 | Deletion must wipe the SecureStore key and caches and log RevenueCat out | Already done | `clearLocalUserData` wipes the AI key, every key containing the user id, and personal prefixes (`localUserData.js:49`). RevenueCat logs out when the user becomes null (`PlusContext.js:45`) |
| C2 | Paywall must have legal links and renewal terms | Pass | Same as #29 |
| C3 | Add `NSUserTrackingUsageDescription` / `NSLocalNotificationUsageDescription` | Don't | The app doesn't track, and the second key doesn't exist in iOS |
| C4 | Privacy manifest | Check at first build | Same as #33 |
| C5 | Privacy-label table (IDs, purchases, content, usage) | Agree, one tweak | Usage data is also used for analytics (`docs/metrics.sql`), so tick that purpose too. Goes into 3.3 |
| C6 | Under-18 / unknown age is kept out of community and leaderboards | Pass | `allowed.js`, `is_restricted_account()` |
| C7 | Parental gate before area-action links for minors | N/A for v1 | Apple's gate rule is for the Kids Category; this app isn't in it and under-13 is closed. The http(s)-only fix (2.5) still applies |
| C8 | Login shouldn't hang on a slow network | Partly | Boot has a 10 s guard; the request timeout (1.3) covers the sign-in call |
| C9 | Reviewer account: adult, 2FA off | Agree | 2FA is optional, so a normal adult account works. Goes into 3.3 |
| C10 | Complete Google Play's Data safety and child-audience forms | Agree, useful | Set Play's **Target audience to 13+ only**. Picking any under-13 age puts the app under Google's Families policy. Goes into 3.3 |

### Found while checking (not in the audits)

- **`revenuecat-sync` and `parse-import` still aren't deployed.** Both return
  404 today, same as on 2026-09-22 (`kws-webhook` answers, so the check
  works). Until they're deployed, a purchase can't turn Plus on and AI Import
  fails for everyone. RevenueCat keys in `.env` are also still empty.

---

## Phase 0: make future audits read the real code

| # | Fix | Where |
| --- | --- | --- |
| 0.1 | **Done 2026-09-30:** `archive/` deleted (64 files, staged with `git rm`, not yet committed). Git history keeps every file: `git show 078ff49:archive/<path>` gets any one back | `archive/` |
| 0.2 | ~~repomix config~~ Not needed: the packs in 0.3 name what goes in | — |
| 0.3 | **Done 2026-09-30:** three packs, one per audit chat, each measured to fit Gemini's 1M-token limit on its own. **Never put two in one chat:** core + screens measured 1.02M together. A whole-repo pack is still ~6.4 MB even without `archive/` | see below |

| Pack (repo root, gitignored) | Tokens | What's in it | Use it for |
| --- | --- | --- | --- |
| `repomix-output.backend.xml` | 378k | App.js and config, contexts, `src/api`, `src/logic`, Supabase functions and migrations (minus the lesson-text seeds), plus the login, onboarding, settings, paywall, help, leaderboard, family and community screens | security, store compliance, growth and monetization |
| `repomix-output.core.xml` | 555k | the same logic and backend plus all shared components, no screens | performance |
| `repomix-output.ui.xml` | 782k | every screen except class lesson text, all components, the config data files (personas, stages, features, quests…) | UX and product |

To rebuild them after code changes:

```bash
npx repomix --include "App.js,index.js,app.json,app.config.js,eas.json,package.json,context/**,src/api/**,src/logic/**,src/services/**,src/config/**,src/theme.js,supabase/functions/**,supabase/migrations/**,src/screens/LoginScreen.js,src/screens/MultiStepOnboarding.js,src/screens/onboarding/**,src/screens/SettingsScreen.js,src/screens/PlusScreen.js,src/screens/HelpScreen.js,src/screens/LeaderboardScreen.js,src/screens/family/**,src/screens/library/discover/**" -i "supabase/migrations/20260906130000_full_topic_content_and_new_subjects.sql,supabase/migrations/20260917130000_life_area_actions.sql,supabase/migrations/20260906120000_classroom_lesson_builder.sql,supabase/migrations/20260828_class_and_area_content.sql,context/extrakinfo.js" -o repomix-output.backend.xml
```

```bash
npx repomix --include "App.js,index.js,app.json,app.config.js,eas.json,package.json,context/**,src/api/**,src/logic/**,src/components/**,src/services/**,src/config/**,src/theme.js,supabase/functions/**,supabase/migrations/**" -i "supabase/migrations/20260906130000_full_topic_content_and_new_subjects.sql,supabase/migrations/20260917130000_life_area_actions.sql,supabase/migrations/20260906120000_classroom_lesson_builder.sql,supabase/migrations/20260828_class_and_area_content.sql,context/extrakinfo.js" -o repomix-output.core.xml
```

```bash
npx repomix --include "src/screens/**,src/components/**,src/data/*.js,App.js,src/theme.js" -i "src/screens/classes/**,src/data/lifeAreaActions.js,src/data/ownershipCurriculum*.js,src/data/topicCatalog.js,src/data/wayfinder*.js,src/data/knowledgeCatalogs.js,src/data/competencyTests.js" -o repomix-output.ui.xml
```

## Phase 1: crash safety

**What was checked on web (2026-09-30, `fix/audit-phase1`):** the real
`ErrorBoundary` around a component that throws shows the card and reports the
error with its component stack, and "Try again" remounts and recovers (light
and dark). A stalled Supabase request fails at 20.0 s with "Request timed out"
and one attempt. postgrest-js retries network errors up to 3 times, so the
timeout is marked as an abort to keep it at one 20 s wait instead of ~87 s.
Normal requests are unchanged. Community offline shows "Couldn't load the
feed" + Try again, and recovers. The export read 34 tables in ~1 s with at most
6 requests in flight. `sessionNeedsSecondStep` passes 10 cases (verified /
unverified / aal1 / aal2 / Unicode / bad tokens). **Not checked:** a signed-in
walk (needs your sign-in), the phone file share (needs a build), the SQL (needs
you to run it).

| # | Fix | Where | Verified by |
| --- | --- | --- | --- |
| 1.1 | Root error boundary: "Something went wrong" plus a Reload button, instead of a blank app. Wraps everything inside the providers | new `src/components/ErrorBoundary.js`, `App.js` | a test screen that throws, in the web preview |
| 1.2 | Crash reporting with Sentry (**default**, free tier): `sendDefaultPii: false`, no emails or names, user id only. Adds "crash data" to the privacy label and one line to the privacy policy. **You:** make a Sentry project and give me the DSN | `App.js`, `app.config.js` | a test error shows up in Sentry |
| 1.3 | Every Supabase request gets a timeout (15 s) through the client's `global.fetch`, so a stalled network shows an error instead of spinning forever | `src/api/supabaseClient.js` | throttle the network in the preview |
| 1.4 | Community feed shows "Couldn't load, Try again" on a network error, not an empty feed | `CommunityFeedScreen.js:101` | preview offline |
| 1.5 | Two-step sign-in enforced in the database (S1): one migration adds a restrictive policy to every user table, Supabase's documented pattern (anyone with a verified factor must be at `aal2`; everyone else is unaffected), plus the same check at the top of the SECURITY DEFINER functions that act for the caller. **You:** run the migration | new migration | probe: sign in with password only on a 2FA test account → reads refused; a non-2FA account unaffected |
| 1.6 | Export My Data writes a `.json` file and shares the file (S5), and reads its tables a few at a time instead of ~28 in a row (P12). Adds `expo-file-system` + `expo-sharing`, so it needs a new build to test on a phone; web keeps its download | `src/api/dataExport.js` | web: same file, faster; phone check in device QA |

## Phase 2: daily loop fixes

**What was checked on web, signed in (2026-09-30, `fix/audit-phase2`):** the
new targets open the right places (`drills` → Training with today's drills,
`area` → that Life Area). `refreshProfile` keeps one identity through a server
reload and a points award, and the Plus context value no longer changes on an
award. (Training's pet timer was first made to stop off-tab; reversed the same day
at your request, see 2.7.) `dateUtils.todayStr()`, which the Student
widget now uses, gave 2026-09-30 while UTC was already 2026-10-01. The link
rule passes 15 cases. **Not checked:** a real notification tap (needs a
phone). **Left out:** 2.6, a database trigger that fills a missing
`profile_id`. The known causes were fixed in fix-plan phase 2, and choosing
which profile counts as "main" inside SQL deserves its own look.

| # | Fix | Where | Verified by |
| --- | --- | --- | --- |
| 2.1 | Tapping "Daily Drills open" opens Training's drills, "Streak at risk" opens Home, and a life-area reminder opens that area. Adds `data.target`, plus a `tab` kind in `openTarget` | `notificationScheduler.js`, `openTarget.js` | unit check of the targets; the real tap needs a phone |
| 2.2 | Memoize the `UserProgressContext` value; turn `refreshProfile` / `refreshDailyMissions` / `refreshWeeklyMissions` / `recordGuestEvent` into stable callbacks. `PlusContext`'s memo depends on the plan fields, not the whole profile (W2) | `context/UserProgressContext.js`, `context/PlusContext.js` | React Profiler render count during a game, before and after |
| 2.3 | Remove dead code: `MissionsOverlay`, the `PlacementEditor` debug log, and the unused `SmartCollectionScreen.js` (U1) | `App.js:197`, `PlacementEditor.js:12`, `src/components/SmartCollectionScreen.js` | `npm run check` |
| 2.4 | Student "Today" widget uses the local date, not UTC (R6) | `StudentWidgets.js:17` → `dateUtils.todayStr` | preview with the clock set to 9 pm US time |
| 2.5 | Life-area link actions open only `http(s)`, `mailto:` and `tel:` (S4) | `areaActionsService.js:205` | unit check |
| 2.6 | Belt and braces for S2: a database trigger fills a missing `profile_id` on scoped tables with the account's main profile, so an early write can't vanish (optional; the known causes are already fixed) | new migration | insert without `profile_id` → row lands in the main profile |
| 2.7 | ~~Pause sprites when their tab isn't in front~~ **Changed 2026-09-30 (your call): the pet and sprites keep going on every screen while the app is open (being in the app is the reward) and pause only when the app is in the background** (`src/logic/useAppActive.js`). Training now loads at launch so the pet is out from the start. `FolderRow` styles memoized (P7) | `AnimatedSprite.js`, `CharacterWalker.js`, `App.js` (Training `lazy: false`), `FolderRow.js` | Training's walker measured and moving while Home is in front |
| 2.8 | **Pet coins: one every 3 minutes (20 an hour), at most 50 in any 24 hours** (was 12 per six hours). The server enforces it and says when the next coin can pay; the walker puts one coin down at that moment, so every coin the pet eats is real. Off Training, a toast shows it happened: your pet, a spinning coin, "+1 · Your pet found a coin" under the top bar (coins close together add up to "+2"); fades only with Reduce Motion; announced to screen readers. **You:** run `20260930130000_pet_coins_every_3_minutes.sql` | `useCoinRewards.js`, `CharacterWalker.js`, `GamesScreen.js`, new `CoinRewardToast.js`, `gamificationService.js` (awards carry a source), migration | stubbed server: coin found on Home, toast shown, "+2" for two, hidden on Training, next coin saved 3 min out |

## Phase 3: store readiness

| # | Fix | Where | Who |
| --- | --- | --- | --- |
| 3.1 | With an active Plus, the delete modal adds: "Deleting your account doesn't cancel your App Store / Google Play subscription. Cancel it there first," with a Manage subscription link | `SettingsScreen.js` delete modal | me |
| 3.2 | Deploy `revenuecat-sync` and `parse-import`, set their secrets, add RevenueCat keys to `.env`, create the store products | Supabase, RevenueCat, App Store Connect, Play Console | **you** (I'll write the exact commands) |
| 3.3 | `docs/store-submission.md`: reviewer account and review notes (guest mode works without an account; under-13 signup closes by design, so no parent-consent bypass is needed), privacy-label answers matched to what the app really collects (email, name, birth date, what people write, activity, purchases through RevenueCat, crash data if 1.2 lands), age-rating answers (user posts), Google Play's Data safety form and **Target audience set to 13+ only** (any under-13 age puts the app under Google's Families policy), usage data marked for analytics too, privacy-manifest check, the screenshot list, and a phone-QA list (time picker inside the calendar and reminder sheets, share export, reminder taps). Also a "don't add" list: no camera, photo or tracking (ATT) permission strings, since the app uses none | new doc | me, then you fill in the store forms |
| 3.4 | Marketing copy rules in that doc: never "local-first", "data stays on your device" or "no cloud" (it all syncs); never "COPPA-compliant" or "parent-approved" in v1 (under-13 is closed) | same doc | me |
| 3.5 | Paywall for guests (S6): show the plans and prices, with a "Sign in to subscribe" button instead of plain text. Review notes say Plus is account-based (it follows you to web and unlocks server features), because Apple sometimes rejects "sign in to buy" for purchases that aren't | `PlusContext.js` (ready for guests), `PlusScreen.js:175`, review notes | me |

## Phase 4: retention features (decide first)

| # | Idea | Why it's worth it | Size |
| --- | --- | --- | --- |
| 4.1 | Guest-first start: make "Try it first" a real button, keep guest progress on the device, and at signup carry over what's safe (games played, aim picked, streak day). Points stay server-side, so they start at zero (carrying them over would reopen the points exploit) | The audit's strongest point: people can try the app before handing over an email | medium |
| 4.2 | Review queue: missed questions come back 1, 3 and 7 days later (learning-quests phase 4) | Spaced review is one of the best-evidenced learning methods, unlike learning styles | medium-large |
| 4.3 | Share a progress card (level-up, quest finished). No reward for inviting people | Gives people a free way to show the app to friends, without paying them for invites | small (text share) to medium (image card) |
| 4.4 | One-tap "today's few minutes" on Home: drills plus check-in | Shortens the daily loop | small-medium, overlaps the stage widgets |
| 4.5 | Something to spend points on | Points currently only rank you | depends on D4 |
| 4.6 | Calendar export (.ics) or sync, drag to reschedule in the Planner | Productivity-app parity | medium, v1.1 |
| 4.7 | Real work counts (R15): finishing a planner item, project step, life-area action or goal earns a little XP (not points, since points are the prize cards), with a daily cap checked on the server so ticking boxes can't be farmed. The streak counts a real action (a drill, a finished item, a check-in) instead of just opening the app, and the reminder wording changes to match | Today, the half of the app about your actual life never moves your level, and the streak rewards opening the app rather than doing something | medium (one migration + hooks in 4 places) |
| 4.8 | Streak rest day (R14): one missed day a week doesn't break the streak, automatic and never bought | Losing a long streak over one bad day is a known point where people give up on habit apps; a free rest day softens that without selling anything | small |

## Decisions needed

- ~~**D1: `archive/`.**~~ Decided 2026-09-30: deleted.
- **D2: Crash reporting.** Sentry now (**default**) or wait until TestFlight. Also: add EAS Update for over-the-air hotfixes? (**default:** not yet)
- **D3: Guest-first start (4.1).** Build it (**default**) or keep signup first.
- **D4: Points sink.** Cosmetic unlocks bought with earned points only (**default**), never with money; or none.
- **D5: Real work counts (4.7).** Build it: XP for real-life actions with a daily cap, and the streak counts an action (**default**). Or keep XP game-only.
- **D6: Streak rest day (4.8).** One free rest day a week (**default**), or keep the one-day grace only. Either way, never sold for money; earning extra ones with points could tie into D4.
- **D7: Lifetime pass.** Not now (**default**): hosted AI would cost money forever with no income behind it. Revisit if people ask.
- **Rejected in rounds 2 and 4 (say if you disagree):** coin packs for money, exit-intent downsells and win-back discounts, a paywall inside onboarding, free Plus months or trials for referrals, pet mood that drops when you miss days.
- **Already decided, not reopening:** $2.99 / $24.99 pricing, random prize cards stay, kids are v2 (so Family Plus / Classroom Pro wait too).
