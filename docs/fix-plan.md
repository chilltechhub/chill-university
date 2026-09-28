# Fix plan — stress test + UX audit (2026-09-27)

Covers every finding from the two reports run on 2026-09-27 (security/data
stress test, then the UI/UX + accessibility audit). Nothing here is built yet.

## Status

| Phase | What | State |
| --- | --- | --- |
| 0 | Capture unversioned SQL, test harness | done — probe script written; `increment_user_progress` measured on a test account instead of dumped (void return, level table matches `getLevel`), recorded in the migration's comments |
| 1 | Security and child safety | **applied and verified 2026-09-27** — probe script: 17 PASS / 0 FAIL on the adult account; teen birth-date edit, Business profile and posting refused; streak, scoring and family relink still work. Left for you: the under-13 dry-run count, redeploying `kws-webhook` |
| 2 | Data that disappears, app that won't open | **applied and verified 2026-09-27** — cold start with an expired token → Home 2/2; + button project and an offline capture both land in the active profile; rejected queue rows dropped; sign-out clears the device. Migration `20260927140000` (orphan backfill + streak day-one fix) applied; backfill checked afterwards |
| 3 | Accessibility foundation | done in the preview (2026-09-27): dark mode Home/Planner/Idea Garden/Inbox/Compass/Library/Settings all 0 contrast failures and 0 unlabeled icon buttons (each had several before); light mode only the pill fix below. Guards in `scripts/check-a11y.mjs`. Needs a phone: haptics, iOS tab bar safe area |
| 4 | Clarity: names, goals, tours, screens | mostly done — 4.1 Project, 4.2 goal wording + Compass explainer, 4.3 filled Open on the goal card, 4.4 tours (one tutorial per session, ends when you leave, guide reminder is a pill, hidden during games), 4.5, 4.6 Library tabs + empty states, 4.7 Settings jump links + AI key adults-only (not split into sub-pages), 4.8 Profile says "Level N · tier", 4.9, 4.10, 4.11 all four. **Waiting on you:** 4.8 points economy (below) |
| 5 | Web-only fixes (testing convenience) | done 2026-09-28 — `src/logic/webAlertShim.js` maps every `Alert.alert` onto the browser's alert / confirm / prompt (numbered choices) at startup, web only; tab labels fixed in Phase 3 |
| v2 | Kids (K–2) backlog | parked |

## Decisions already made

- **Web is for testing only.** Web-only bugs (dead confirm dialogs, invisible
  alerts, tab-label clipping) drop to Phase 5.
- **"Project" is the one name.** Build, mission, blueprint and shipped go away
  in user-facing text. Internal ids, table names and route names stay.
- **The random prize cards stay.** RoundCompleteScreen is not changed.
- **Kids stay v2** (launch strategy: 13+ consumer first). K–2 items are parked
  in the v2 backlog at the bottom.

Proposed defaults below are marked **(default)**; say if you want different.

---

## Phase 0 — Before touching anything

1. **Dump the SQL that isn't in the repo.** `increment_user_progress` was made
   by hand in the dashboard; there is no migration for it. You run, in the
   Supabase SQL editor:
   ```sql
   select pg_get_functiondef('public.increment_user_progress'::regproc);
   select tgname, pg_get_triggerdef(oid) from pg_trigger
    where tgrelid = 'public.profiles'::regclass and not tgisinternal;
   ```
   Paste the output back; it becomes `supabase/migrations/<ts>_capture_live_functions.sql`
   so Phase 1 replaces a known function, not a guess.
2. **Turn the stress-test probes into a script**, `scripts/probe-security.mjs`:
   signs in with a test account from `.env.test` (you fill it in; never
   committed) and re-runs every write I did by hand — self-set `is_admin`,
   consent, DOB, XP, `parent_id`, cross-user `increment_user_progress`,
   `create_organization` without Plus. Today every probe "succeeds"; after
   Phase 1 every one must be refused. This is how we prove the fix, and how we
   catch a regression later.

## Phase 1 — Security and child safety

One migration, `<ts>_lock_down_profile_fields.sql`, plus small client changes.
All of these follow the pattern `profiles_protect_plan` already uses: the
trigger only acts when `current_user` is `anon`/`authenticated`, so SECURITY
DEFINER functions and the service role (KWS webhook, family RPCs) keep working.

| # | Fix | Where | Verified by |
| --- | --- | --- | --- |
| 1.1 | Trigger freezes `is_admin`, `kws_pv_status`, `kws_transaction_id`, `kws_verified_at`, `parent_id`, `xp`, `points`, `level`, `rank`, `total_points`, `streak_count`, `last_active_date` against client writes (INSERT forces defaults) | new migration | probe script |
| 1.2 | `date_of_birth` and `country_code` are set-once from the client (allowed when the old value is null). `is_minor` is always computed server-side from DOB + country (SQL copy of the AODC table in `src/logic/ageOfConsent.js`) | same migration | probe: teen DOB edit refused |
| 1.3 | `parent_consent_given` / `parent_consent_at` only via new RPC `record_parent_consent()`, which requires `kws_pv_status = 'verified'` | migration + `MultiStepOnboarding.js` `submitConsent` | probe: under-13 bypass refused |
| 1.4 | `increment_user_progress` replaced: refuses any `p_user_id` but the caller's, rejects negatives, refuses oversized calls (gameplay awards top out around 150 XP). Mission rewards (up to 1,500 XP / 3,000 points) move to a new `claim_mission_reward(user_mission_id)` that pays the mission's own listed reward, once per mission per day/week (longterm: once), using the unused `user_missions.claimed_at` | migration + `gamificationService.advanceMissions` (falls back when the function is missing) | probe: cross-user, negative and oversized refused |
| 1.5 | Streak moves server-side: new RPC `touch_streak()` does what `touchStreak` does today | migration + `gamificationService.js:411` | streak still counts on a signed-in walk |
| 1.6 | Moderation screen stops telling people to set `profiles.is_admin` | `ModerationQueueScreen.js` | read the screen |
| 1.7 | Family codes: generator uses `floor(random()*32)+1` (fixes ~9% five-letter codes); making a new code voids the old one; redeeming refuses when the child already has a parent (unlink first) | migration replacing `generate_family_code` / `redeem_family_code` | probe + UI link/unlink |
| 1.8 | Orgs: `create_organization` requires an active plan; `create_cohort` limited to org owner/admin (**default** — stops a student minting codes into a school); invite codes capped (**default** ≤ 200 uses, ≤ 30 days); `redeem_org_invite_code` locks the code row (`for update`); same generator fix | migration | probe |
| 1.9 | Org admins can remove someone from the whole org (new `remove_org_member`), and an owner can delete their org | migration + `CohortRosterScreen.js` / `OrganizationScreen.js` | UI walk with two accounts |
| 1.10 | **Free students can join a class.** The Organization screen is no longer gated at the navigator; only its "Create an organization" section shows the Plus prompt, and Join with a Code comes first. Owners get "Delete", members "Leave"; the roster offers "remove from the whole organization" to owners/admins | `App.js`, `OrganizationScreen.js`, `CohortRosterScreen.js` | done: free teen joined and left in the preview (2026-09-27) |
| 1.11 | Community links: only `http(s)` opens (client) and `publish_community_post` rejects other schemes (server) | `CommunityFeedScreen.js:357`, migration | probe with a `javascript:` link, not published |
| 1.12 | KWS webhook rejects signed events older than 24 hours (replay; a tighter window risks dropping KWS's own retries) and URL-encodes the user id | `supabase/functions/kws-webhook/index.ts` | redeploy (you run `supabase functions deploy kws-webhook --no-verify-jwt`) |
| 1.13 | Under-13 accounts that never tap "Close my account" are deleted after **7 days (default)**. The migration adds `close_unconsented_minor_accounts(days, dry_run)` but does NOT schedule it: you run the dry run, review the list, then schedule it (commands at the end of the migration) | migration | dry-run list reviewed |
| 1.14 | Age maths stops parsing birth dates as UTC (a child turning 13 tomorrow is treated as 12) | `ageOfConsent.js:49`, `profileResolver.js:25` | unit check at the birthday boundary |

**You do:** run the migration in the SQL editor (the CLI's migration history
is out of sync with the live database, so `supabase db push` is not safe),
redeploy `kws-webhook`.

## Phase 2 — Data that disappears, and the app that won't open

| # | Fix | Where | Verified by |
| --- | --- | --- | --- |
| 2.1 | **Cold-start blank screen.** The auth listener stops awaiting Supabase calls inside the callback (defer `loadUserData` with `setTimeout`, per the supabase-js docs); `App.js`'s `getSession()` chain gets a `.catch` and a timeout that falls back to Login | `context/UserProgressContext.js:143`, `App.js:344` | plant an expired token, reload → Home (failed 2/2 before) |
| 2.2 | + button writes through the profile-scoped client | `FloatingActionButton.js:47` | new project from + shows in the Workshop |
| 2.3 | Offline queue: `offlineWrite` stamps `profile_id` when it queues; `App.js` replays with the scoped client; the queue also replays when connectivity returns, not only on launch; a write the server permanently rejects is dropped with a notice instead of retried forever; the queue is keyed by user id | `offlineCache.js`, `App.js:278` | offline capture → reconnect → visible |
| 2.4 | **Backfill orphans.** Rows with a null `profile_id` in the 12 scoped tables are assigned to the owner's master profile, so projects/captures already lost this way come back | migration (same shape as `20260910160000`'s backfill) | count of null-profile rows = 0 |
| 2.5 | Sign-out and "Close my account" clear everything user-scoped on the device: `@cth_cache_*_<uid>`, the sync queue, onboarding draft, active profile id, pending org code | one `clearLocalUserData(uid)` helper called from all sign-out paths | storage empty after close (child's email/DOB stayed before) |
| 2.6 | Wrong answers earn a little XP but no points; `GAME_COMPLETED` pays in proportion to correct answers (nothing for 0 correct), so a 0/3 run pays 0 and says 0. Making GameOver's "points earned" (the round-prize score, never credited) equal what the account gains moved to 4.8 — all 32 games pass the local score | `gamificationService.calculateRewards` | 0/3 run → no points |
| 2.7 | Rush timer: 3 s → per grade band (**default** 3–5: 7 s, 6–8: 5 s, 9–12: 4 s; K–2 has no Rush) | `RushTimerBar` callers (13 games) | play one Rush round per band |

## Phase 3 — Accessibility foundation

Mechanical and high-leverage; each item gets a guard in `scripts/` so it can't
creep back.

| # | Fix | Scope | Guard |
| --- | --- | --- | --- |
| 3.1 | done — 274 text uses of `text4` → `text3` (3 disabled labels kept, marked `a11y-ok`); inactive tab labels too | codemod + review | `check-a11y.mjs` fails on `text4` as a text colour |
| 3.2 | done — new `onFill` theme token (white light / near-black dark); 64 white labels on teal/gold/purple/green/error fills and 24 selected-state ones moved to it, or to `textOn()` for data-coloured fills; Idea Garden "Plant"; persona chip and level pill via `readableOn()` (`src/logic/contrast.js`) | ~40 files | contrast probe re-run |
| 3.3 | done — + button 52 pt, move handle 40, menu icons 44; Home, Compass and Settings scroll far enough to clear it; in a top corner Home's date row sits beside it | `FloatingActionButton.js`, `FabPositionContext.js` | measured |
| 3.4 | done differently — no new primitive: `scripts/label-icon-buttons.mjs` labelled 121 icon-only buttons from their icon, 20 state-dependent ones by hand (checkboxes get role + checked state); top bar controls got `hitSlop` to 44 | `scripts/lib/iconButtons.mjs` | `check-a11y.mjs` fails on an unlabeled icon-only pressable |
| 3.5 | done at 11 px (the theme's `xs`; 12 needs a layout pass) — 227 sizes raised, 3 count badges exempt; tab labels 12 px and the Android/web tab bar 52 → 60 so they stop clipping. iOS safe-area height not touched yet | codemod | `check-a11y.mjs` fails on fontSize < 11 |
| 3.6 | done — switch off-track `borderStrong`, off-thumb `text3` (16 switches); persona chip and level pill nudged to ≥4.5:1; scenic-background Home gets chips behind the date and Edit | `theme.js`, `ProfileSwitcher.js`, `TopBar.js`, `HomeScreen.js` | contrast probe |
| 3.7 | done in code — `expo-haptics` ~57.0.3, `src/logic/haptics.js` (no-op on web or without the native module) on step check-off, correct answer, level-up | `AccessContext`, `useGame`, `LevelUpNotification` | on your phone |

## Phase 4 — Clarity: names, goals, tours, screens

| # | Fix | Detail |
| --- | --- | --- |
| 4.1 | **"Project" everywhere** — done: New Build → New Project, All Builds → All projects, statuses Idea / In progress / Done, Inbox "Add to one of your active projects", goal names (Start Your Project, Finish Your First Project), tutorials and help. "Showroom" became **Featured**, not Finished: it's the separate showcase flag, and Finished would collide with Done. The Workshop keeps its name as a place. Internal ids/status values unchanged |
| 4.2 | **One goal model** | Users see "goal" and "steps" only. "Objective" → "goal" in all copy (lock screens: "Finish a goal to open this"). Stage numbers leave Home; the stage line becomes "Next unlock: The Capture Inbox". Compass's five-term glossary shrinks to two lines |
| 4.3 | **One main action on Home** | The goal's next step is the one filled button; Study / Play become secondary; drop the duplicate "NEXT STEPS" block |
| 4.4 | **Tours calm down** | One tour at a time; a tour ends when you leave its screen (today a Settings step followed me onto the Workshop); max 3 steps per screen tour; "Show everything" no longer auto-starts a 10-step tour; the first-goal guide becomes a small pill that expands, not a card covering content; one "Tips" switch in Settings |
| 4.5 | No notifications for locked features | Weekly review isn't suggested until it's open |
| 4.6 | **Library** | Visible tabs Life · Build · Knowledge instead of swipe + dropdown; reordering moves to Settings; a visible "Check in" button replaces double-tap / long-press; Notes, Research and Resources become one Vault entry; every empty page gets the EmptyState pattern (picture, one line on why, a starter button, "more opens after your first goal") — Knowledge, Build, Planner |
| 4.7 | **Settings** | Split into sub-pages: Appearance · Learning · Notifications · Privacy & family · Account · Advanced. The Anthropic API key moves to Advanced and is hidden for under-18s. Sign out sits at the top of Account |
| 4.8 | **One progress number** | Done: Profile shows "Level N · <tier>" instead of "Rank #20"; Games says "to the next tier". **Open (your call):** (a) the round-prize score GameOver shows as "points earned" is never credited — the account gets per-question + completion points instead; either credit the shown number or show the real one. (b) 20 near-synonym tier names (Starter, Newcomer…) — keep, cut to ~5, or drop. (c) the pet's coins pay 1 point each, capped at 12 per 6 h, but the cap lives on the device (sign out/in or a second device resets it) |
| 4.9 | Copy pass | Plain subtitle next to each metaphor ("Enter Base" → "Sign in", "Vine" → "Link ideas", "build up that wing of your base"); "never" → "Not rated yet"; the cryptic "change" link under Library titles gets a real label |
| 4.10 | Teen content order | Classes list the user's own grade band first; game default for ages 15–17 → Grades 9–12 (13–14 keep 6–8) |
| 4.11 | Small ones | Idea Garden gets a title; long user text is line-clamped on Home widgets; the game feed stops peeking the next game while one is in progress; Planner toolbar icons get labels or move into a menu |

## Phase 5 — Web-only (testing convenience)

Low priority because web isn't shipped, but it makes testing in the browser
honest:
- Finish the `confirm.js` migration for the 36 `Alert.alert` flows that do
  nothing on web (delete, report, block, unlink, remove member, take down…).
- `notify()` for the error/success alerts web users never see.
- Tab-label clipping on web.

## v2 backlog — kids (K–2)

Parked until kids' accounts ship:
- Read-aloud for lessons and game instructions (`expo-speech`); pictures.
- K–2 copy at a reading level a 6-year-old (or their parent reading aloud)
  can follow — today lessons read at grade 8.5–12.7.
- No lives in Relaxed mode or K–2; results screen without a row of zeros.
- Larger targets and 1 idea per card for K–2.
- The whole parent / KWS consent flow end to end (the server side of it is
  fixed in Phase 1 regardless).

## Order and branches

- Phase 0 → 1 → 2 first; 1 and 2 are independent and can be separate PRs
  (`fix/lock-down-profile-fields`, `fix/data-and-startup`).
- Phase 3 next (`fix/a11y-foundation`), then 4 (`feature/clarity-pass`, may
  split by item), then 5 whenever.
- Every PR: `npm run check`, the probe script, and a signed-in walk in the
  preview with the adult + teen test accounts (localhost / 127.0.0.1 tabs).
- Device QA at the end: FAB, tab bar and safe area, haptics, cold start after
  an hour away (Phase 2.1 on a real phone).
