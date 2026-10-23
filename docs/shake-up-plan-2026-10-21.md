# Deskartes shake-up plan · 2026-10-21

*The whole-app rework in one place: navigation, the Planner as the dashboard, Calm, the school/workspace feel, the You page, the room, points and XP, and the tutorial redo. Written for a new build session to work through phase by phase. It builds on [vision-2026-10-21.md](vision-2026-10-21.md), the [North Star](north-star.md), the [Studio plan](studio-plan.md), the [consolidation plan](consolidation-plan-2026-10-20.md), the [refocus plan](refocus-plan-2026-10-18.md), the [UI/UX rundown](ui-ux-rundown-2026-10-14.md) and [access-system.md](access-system.md). **Nothing here is built yet.** Marks: ✅ decided · 💡 proposed, needs the founder's OK · ❓ open question.*

> **For the build session:** read §0 and §11 first. Work one phase at a time. A phase is done only when `npm run check` is green, the phase's acceptance list passes, and nothing in **§12 Must not break** has moved without its migration.
>
> **Where this lives:** `docs/shake-up-plan-2026-10-21.md` (saved in P0). The vision doc's §11, §13 and §16 each get a one-line link here.
>
> **How to verify claims:** every file path and line number is as of commit `3c08bfc`. If a line has moved, search for the quoted identifier rather than trusting the number. If a claim here no longer matches the code, trust the code and fix this doc in the same PR.

---

## 0. The plan in one breath

Deskartes becomes **a calm school in your pocket for making it on your own**, built around **ikigai**.

1. You open the app. Before any account exists you get a short **welcome**: the ikigai circles, **where you are in life** (your starting point), and **which circle feels shakiest**. No age question. Then you make your **first deliverable**, "A page about you".
2. After that the app has **three tabs and one dropdown**:
   - **Today** is the Planner, and it is now the dashboard. It shows one next step, your day, and your path's widgets.
   - **Learn** is your course: the path map, units, Finds, classes and practice.
   - **Make** is your work: deliverables, the Studio, projects, Saved and the Showcase.
   - **You** is a full-screen sheet that drops down from the top bar. It holds your ikigai, your receipts, your room and your settings.
3. Every unit ends in **a deliverable you can show**, and it can collect feedback from real people. Progress means **your own receipts**. Levels and points stay quietly underneath, with **no bait and no guilt**. The **pet system stays as it is**.
4. **Calm is kept, and it is the default view for new accounts.** Full stays available. *(Vision §11 said Calm becomes the only Home. The founder now wants Calm kept as the default with Full available. This plan follows the founder.)*
5. **Build order follows the vision:** guardrails first, then the welcome and "A page about you", then the 5-person test, then the surfaces.

**The test for every screen** (North Star): *More capable or more managed? Does it pull strings or cut them? Can they see why?*

---

## 1. Decisions this plan makes

| | Decision | Reason (one line) |
|---|---|---|
| ✅ | Welcome and first use come **before login**. Signed-in users skip them | Already decided in vision §6 |
| ✅ | **Ikigai** is the core theme. The You page *is* your ikigai | Already decided in vision §3 and §16 #1 |
| ✅ | Audience is **17–30**. Starting points: **Finishing high school · Working, no career yet · Didn't finish school (GED)** | Already decided in vision §5 |
| ✅ | First paths: **What's next for me (incl. trades) · Money on my own · Job to career**. **What do I like?** is the default | Already decided in vision §5 |
| ✅ | **Welcome + "A page about you" ship before the structure rework** (P2, right after the guardrails), followed by the 5-person meetup | Vision §2 and §16 "Now". Surfaces come "Then" |
| 💡 | **3 bottom tabs: Today · Learn · Make.** The 4th "tab" is **You**, a full-screen dropdown from the top bar | Keeps all four jobs of the vision's Today/Explore/Make/You, keeps Make (the spine) one tap away, and fits the user's 3 tabs + dropdown |
| 💡 | The second tab stays **Learn** (its label is already "Learn" at App.js 234), not Explore or Path | A school says Learn (answers vision ❓ Explore vs Learn) |
| 💡 | **Route names stay** (`Home`, `Training`, `Library`). Only labels and tab order change. Old names become aliases | Each name has roughly 45–50 string references across 15–21 files (the count depends on the grep), plus tours, objectives and saved links |
| ✅ | **The Planner is the dashboard** on route `Home`. **The Day view is all widgets; nothing is pinned** (founder, 2026-10-21). Next step, Your day, the Today's Find line, the Dream echo and quick add are widgets like any other: movable, hideable, restorable. New accounts get them first in their default layout | Founder's call |
| ✅ | **"Where are you in life?" replaces the age question** in the welcome (founder, 2026-10-21). It is the starting point question: **Finishing high school · Working, no career yet · Didn't finish school (GED) · Not sure / something else**. Age is asked **only at signup** (the existing birth-date gate, needed for the minor rules) | Founder's call; the legal age gate stays where it already is |
| ✅ | **A fourth starting point, "Not sure / something else"**, leads to **What do I like?** (founder, 2026-10-21) | Founder's call |
| 💡 | **One "today" data hook** (`useDayPlan`) replaces 4 separate "today" queries | They can disagree today, and four copies is clutter |
| 💡 | **Calm becomes app-wide** and is the **default for new accounts**, written explicitly at account creation. Existing users keep what they see now | Calm was a main point of the rewrite. The first screen should say one thing |
| 💡 | **Path → Unit → Deliverable** is the school model. A unit is an objective with 4 beats: **Learn · See it · Practise · Do it** | Reuses the objective engine and the MissionScreen beats. "Unit" avoids a clash with the existing "experience stages" |
| 💡 | Keep the **one active objective** SQL rule, read as **one active unit**. Many deliverables can run beside it | Matches "one path at a time" (vision §9) and needs no SQL change |
| 💡 | **Receipts are the visible progress.** XP and level stay as a quiet server ledger. Rank, tiers, the points pill, the leaderboard and XP Challenges leave the UI | North Star: levels and points sit below the dream, with no bait and no guilt |
| ✅ | **The pet system stays as it is** (founder, 2026-10-21): pet care, hunger, feeding, pet food bought with points, the pet finding coins, bonus collectibles and the daily gift. Spendable points stay as the pet's currency, shown in the pet sheet, not the top bar | Founder's call |
| ✅ | **The Screen Tutorial is replaced with relevant info** (founder, 2026-10-21): the old per-screen tours go; each screen gets fresh **"About this page"** info written for the new app (§7.3) | Founder's call |
| 💡 | **Everyday cosmetics become free for everyone.** Only trophies are earned, from finished work | "A lock only holds back control, never the result." Opening everything also means nothing can re-lock |
| 💡 | **Room placement** setting `roomPlace`: `'you'` (default), `'today'` or `'off'`. It covers **Today and You only**. One `Room` component, one editor | Requirement 3. Keeps Today uncluttered unless the person opts in |
| 💡 | **One guide system** in three layers: Welcome, then Mentor notes (keyed by surface), then the generated guided first unit. **Your own character** is the guide | Replaces 7+ competing tutorial voices |
| ✅ | **Share links are kept and ship in P8** (founder, 2026-10-21), alongside files and picture cards. **Feedback v1 needs no accounts**: you write down what people told you, on the deliverable. **Links are 18+** (the existing `allowed.js` rule: minors can't publish), so under-18s get export only. In-app reviews come with the school (P11) | Founder's call, inside the minor rules |
| 💡 | Collaboration with accounts (cohorts, assignments, in-app feedback) is **built on the existing institutional SQL** but **stays off until the first meetup** | Vision §8: switch features on only when real people need them |

---

## 2. Information architecture

### 2.1 The three tabs

| Tab label | Route (kept) | Root screen | Holds | Loop step |
|---|---|---|---|---|
| **Today** (initial) | `Home` | new `src/screens/today/DashboardScreen.js`. `src/screens/HomeScreen.js` becomes a thin re-export | The Planner as the dashboard: Day / Week / Month, the next step, the plan, widgets, Calm | **Walk** |
| **Learn** (label already "Learn", App.js 234) | `Training` → stack `src/screens/TrainingNav.js`, root route `TrainingHome` (kept) | new `src/screens/learn/LearnScreen.js`. `src/screens/GamesScreen.js` moves to a new `Practice` route in the same stack | **My path** (course map + units), **Finds** (moved from Library → Find), map cards (Career Explorer), **Classes** (`ClassesStack` unchanged), Missions, Practice | **See the map, taste, notice** |
| **Make** | `Library` → stack `src/screens/library/LibraryNav.js` (all 58 routes stay) | route `LibraryScreen`, now rendering Make content | **Deliverables board**, Studio, Workshop projects, **Saved** (Inbox · Saved · Finds), Showcase, tools shelf | **Make, hand in, show** |

**Tab order:** today it is Library · Home · Training (App.js 212, 225, 231). The new order is **Today · Learn · Make**, which means **reordering the `Tab.Screen` children in App.js `MainTabs`** to Home · Training · Library. `initialRouteName="Home"` (App.js 173) stays.

**Where the old Library pages go:**

| Old page | New home |
|---|---|
| **Find** | Learn |
| **Make** | Make |
| **Tools** | Planner → Today. Vault and Inbox → Make → Saved. Bring stuff in → Make. Savings/Debt → the money kit (Learn for the Money path, otherwise Make → Tools shelf). Community → off |
| **Life** | You → the ground |

💡 **Saved lives in Make,** not in You. Make is your workspace, and the dropdown stays about *you*.

### 2.2 The 4th "tab": **You**, a full-screen dropdown

| | |
|---|---|
| **Opens by** | Tapping the **avatar** at the left of the top bar (it replaces the rank-emoji crest), or **pulling down** on the top bar. On web, `Cmd/Ctrl+K` opens it with search focused |
| **Closes by** | Swipe up, the chevron at the bottom, Android back, Esc, or picking a destination inside it |
| **In code** | A root-stack route **`You`** (`src/screens/you/YouScreen.js`) using `presentation: 'transparentModal'` with a top-down `cardStyleInterpolator`. It is **not** an RN `Modal`, so `TourOverlay` and `passthrough` keep working. The tab state underneath is untouched |
| **Why a route, not an overlay component** | Tours (`go:'You'`), search, notifications and `navigate('Profile')` all work for free, and back handling comes from the navigator |
| **Aliases** | `Profile` stays registered and renders the same `YouScreen`. `src/logic/appRoutes.js` maps `Profile → You` |
| **Guests** | `YouScreen` is **guest-safe**: local Dream, local Builds and deliverables, local receipts, "Save my progress". Once it is, **remove `'Profile'` from `ACCOUNT_ONLY_SCREENS`** (App.js 82) |
| **Web** | It must not bring back the 50px horizontal-scroll bug (the `forShiftWeb` fix, App.js 140-153) |
| **TourSpot** | `topbar-avatar` (new). This replaces the unused `topbar-profile` |

**Inside the dropdown, top to bottom:**

| # | Section | Built from |
|---|---|---|
| 1 | **Search** bar (opens `CommandPalette`) | Crest menu "Search" |
| 2 | **Your room** header (only when `roomPlace = 'you'`) | Profile stage → `Room` (§5) |
| 3 | **Your Dream** + **Your ikigai** (4 circles + the ground) | `DreamCard`, `studio.js` sparks, Wayfinder values, Career Explorer, life areas |
| 4 | **Receipts**: made, tried, mastered, shown, feedback received, then vs now. Level appears in small type at the bottom | `src/logic/builds.js receipt()`, `InsightsPanel`, Stats |
| 5 | **Showcase** shelf (short; the full page is in Make) | `src/screens/library/portfolio.js`, `StudioShowcase` |
| 6 | **My class** / **Family** (only when one is linked and switched on) | Organization, CohortRoster, Family |
| 7 | **Footer:** **What's next?** (the old FAB `next` action) · ProfileSwitcher · Work Mode · Notifications · Make it yours · Settings · **About this page** · Show me around · Sign in / **Save my progress** (guests) | TopBar, CrestMenu (TopBar 34-71), FloatingActionButton `next` |

### 2.3 The top bar (`src/components/TopBar.js`, rebuilt)

```
[avatar ▾]   Money on my own · Unit 2 of 5   [🔍] [🔔]
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ thin bar: steps done in this unit
```

| Change | Detail |
|---|---|
| **Avatar ▾** | Opens You. Replaces the tier-emoji crest |
| **Path chip** | Path name + unit progress. Tapping it opens Learn → My path. With no path yet it reads *"Pick where to start"* |
| **Thin bar** | Comes back meaning **unit progress** (steps done in this unit). Today it is mislabelled: it draws tier progress |
| **Before units exist (P6)** | The chip shows the **active objective's title**, or *"Pick where to start"* if there is none. The bar counts that objective's steps |
| **Removed** | The `LV n · N PTS` pill, the tier crest and the gift button (`pendingRewards` is always empty, so the button never shows). The CrestMenu items move into the You footer |
| **Work Mode** | Shows as a compact pill only while a session is running |

### 2.4 FAB, search and the background

**FAB** (`src/components/FloatingActionButton.js`): **hidden on Today**, which has its own **+ Add**. Shown on **Learn and Make**. Keep the `ACTIONS = [` array literal, because `check-pickables` parses it. Keep the four position options (top/bottom × left/right). Every current action keeps a home:

| Current key (ACTIONS 71-77) | New home |
|---|---|
| `next` "What's next?" (`always:true`, founder request 2026-10-10) | **Stays in the FAB** on Learn/Make. On Today it lives in the ⋯ menu and in the You footer |
| `project` "New Project" | FAB · Make → Start something |
| `calendar` "Calendar" | FAB → opens Today → Week (no more `CalendarModal`) |
| `reminder` "New Reminder" | FAB · Today + Add sheet |
| `note` "New Note" | FAB · Today + Add sheet |
| `plan` "Plan from a link" (AI bridge) | FAB · Today + Add sheet → **"Bring stuff in"** tab |
| `inbox` "Capture Inbox" | FAB · Make → Saved · Today + Add sheet |

Which FAB actions show first depends on the path (§8.2). The rest stay one tap further in.

| Piece | Rule |
|---|---|
| **Search** | `src/logic/searchIndex.js` is repointed at the new hubs. Remove the dead rows (BreakthroughsScreen, TopTalentScreen, CommunityProjectsScreen). Add the missing ones (MakeItYours, MyFeatures, Notifications, ConnectedApps) |
| **Background (no tab)** | Work Mode, Notifications, Weekly Review, Settings and subscreens, AllProfiles, AIBridge, Connected apps, Plus, Practice games, BuildScreen, MissionScreen, ProjectDetail, LifeAreaScreen, Receipts (`Stats`) |
| **Settings merge** | Make it yours and Settings both open from the You footer. Family and Organization rows are **hidden while the feature is `place:'off'`** (SettingsScreen 604-616). Their tour steps `settings-organization` and `settings-family` are updated in the same change |

### 2.5 Route aliases (`src/logic/appRoutes.js`)

Add an `ALIASES` map read by `goToScreen`, `routeLabel` and App.js `onUnhandledAction`.

| Old name | Resolves to | Notes |
|---|---|---|
| `PlannerScreen` | `Home` | Params `date`, `editInstance`, `review`, `addFor` pass through. `PlannerScreen` stays registered in `LibraryNav.js:139` as a redirect that calls `goToScreen('Home', params)` and pops itself. That covers the 28 files that reference it and the stored `link_screen` values |
| `Profile` | `You` | |
| `Compass` | `Training` → `PathScreen` | Goals become the path view |
| `Stats` | `You` (receipts anchor) | The route is kept for "See all numbers" |
| `PortfolioScreen` | kept, opened from Make | |

**Also fix:** `ConnectedApps` is missing from `ROOT_SCREENS` (appRoutes.js 25-32).

---

## 3. Today: the Planner as the dashboard

### 3.1 Layout (Full view, Day)

```
┌ TopBar: [avatar ▾]  Money on my own · Unit 2 of 5   🔍 🔔 ┐
│ Tue 21 Oct ‹ ›   [Day|Week|Month]   ⏷ filter(2)   ◐ Calm   ⋯ │  ← one control row
├───────────────────────────────────────────────────────────┤
│  ── everything below is a widget (WidgetBoard) ──           │
│ [nextStep] ▌"Draft your money sheet · step 2 of 4" [Start] │  ← edge = in progress
│            builds toward: "the farm" · aim for Fri          │  ← Dream echo (a widget option)
│ [quickAdd] "dentist thu 4pm" .................... [+ Add] │  ← TourSpot planner-add
│ [yourDay]  2 of 5 done  [⏱ grid | ☰ list]  [check-in]      │
│            time grid / list · due · phone events            │
│ [find]     "Ask a tradesperson…" (one line)  [Try]          │
│ [deliverable] [stillOpen] [dueSoon] [room] …                │
│  Edit layout: ⋯ or long-press · add, move, hide, restore   │
└───────────────────────────────────────────────────────────┘
```

**Rules**

- **The Day view is one `WidgetBoard`, and nothing is pinned** ✅. **Next step** (`nextStep`, with an optional Dream echo line), **Quick add** (`quickAdd`), **Your day** (`yourDay`, the Planner's day list/grid) and the **Today's Find line** (`find`, one-line or expanded) are widgets like every other: moved, hidden and restored from the tray. `src/components/WidgetBoard.js` already does all of this.
- **Only the control row is fixed** (date, Day/Week/Month, filter, Calm, ⋯, **+ Add**), because it is how you reach the Planner's features, not content. Adding stays possible with every widget hidden.
- **Empty board:** if every widget is hidden, Today shows one line, *"Your board is empty"*, and an **Add a widget** button.
- **Default layout for new accounts:** `nextStep`, `yourDay`, `find`, then the path's widgets (§8.2). Existing saved layouts keep theirs and get the new widgets offered, not forced.
- **Week and Month carry no widgets.** They replace everything under the next step with `WeeklyView` / `MonthlyView`. Both show **deliverable "aim for" dates** as `Due:` chips and dots, so the calendar feels like a school calendar.
- **One next step, from one place:** new pure module `src/logic/nextStep.js`. Its priority order:
  1. a deliverable you're halfway through
  2. the current unit's next step
  3. something due soon
  4. a drill that's due
  5. otherwise, pick a path

  **Before P6** (no deliverables or units yet), 1 and 2 fall back to **the current objective's next unticked step**, then due items. The module takes whatever inputs exist and skips the missing ones.

  It replaces CompassCard, RightNowCard, GettingStartedCard and StageStepsWidget as front doors. Each of those keeps its logic as an input to `nextStep`.
- **Fixed cards leave the top of the dashboard:**

  | Card | Where it goes |
  |---|---|
  | DreamCard | You. On Today, the Dream shows as an **optional echo line** in the `nextStep` widget, or as its own `dream` widget |
  | StudioCard | Make |
  | TodaysFind | The **`find` widget** (one-line or expanded) on Today. The full card also lives in Learn |
  | GettingStartedCard | Retired |
  | RightNowCard | Folded into the next step |
  | TodayReview | An optional widget |

### 3.2 Every Planner feature, and where its control lives

| Feature (today, `src/screens/PlannerScreen.js`) | New place | Control |
|---|---|---|
| Day / Week / Month (`VIEWS`, 61-62) | Control row | Segmented chip, always visible. **TourSpot id `planner-views` kept** |
| Prev / next, "Back to today" (1774-1786) | Control row | Chevrons. Tapping the date goes back to today |
| Tap a day in Week/Month → Day (`onDayPress`) | Same | Same |
| Time grid ↔ list (`@cth_planner_time_mode`) | "Your day" header | **Visible toggle** (it was hidden in ⋯). Same storage key |
| Week grid ↔ list (`@cth_planner_week_layout`) | Week header | Toggle. Same key |
| Now-line in the time grid (`CurrentTimeLine`, 883, 924) | Time grid | Same |
| Empty day (`SleepyCat`, 957) | "Your day" | Same art, with copy that says what to do (§4.6) |
| Life-area filter (8 AREAS + count) | Control row | Funnel sheet. It also filters widgets that have an area. 💡 Adds **"Only my path"** and **"Deliverables only"** |
| One active area = default for add | Same | Same |
| Profile scope (`useViewScope('planner', SCOPE_PROFILE)`) | ⋯ Options | Only when there is more than 1 profile. See §3.4 for the Week/Month scope |
| Guests (`SignInPrompt`) | Gone from the Planner | Guests get a local planner (§3.4). `SignInPrompt` stays only on "sync to phone" and other account-only actions |
| Add (InstanceModal) | Quick-add row | **+ Add**. **TourSpot id `planner-add` kept** (6 guide scripts and `SPOT_FOR` use it) |
| Tap an empty slot to add | Time grid | Same |
| Quick add (`PlannerQuickAdd`) | Under the next step | Same. In Week/Month it adds to the picked day |
| Add from ideas (`SidePanel`) | + Add sheet → tab **"From ideas"** | Moved out of ⋯ |
| Fill with AI (`FillWithAIButton`) | + Add sheet → tab **"Bring stuff in"** (Plus) | Moved. "Plan from a link" and "Capture Inbox" also live here |
| **Plan time for a deliverable** (new) | Deliverable card → **"Plan time"** | Opens InstanceModal prefilled through `goalIdeaFor` |
| InstanceModal fields (title, suggestions, area, cadence, date via `MiniCalendar` (446), time, **duration** (126, 601), More options) | Unchanged | It must keep firing `signalAction('planner-item-added'[:area])` |
| **Link to a class, game, quest or project** (InstanceModal More options, `link_type` pickers 170-190, 543-584) | InstanceModal → More options | Unchanged. Saved `link_type: 'quest'` rows keep resolving through `getQuest` (quest ids are in §12), even after XP Challenges retire. The quest picker offers only quests still shown in Practice |
| Repeats, `extendRepeatingPlans`, series | Unchanged | Runs once a day on dashboard focus, and with force after a new habit |
| Reminders (`planReminderActions`, `markManualReminder`) | InstanceModal → More options | Unchanged |
| AgendaRow (tick + haptic, Do now / Move to today / Drop, notes, profile label, duration line 747-749) | "Your day" | Moved to `src/screens/today/AgendaRow.js`. The overdue badge becomes a neutral **"still open"** dot |
| PlanDetailSheet | Everywhere | Still **the one item sheet** |
| Backlog (`PlannerBacklog`) | **"Still open"** widget (Day, today only) | Copy: *"Last time you were halfway through X"*. Never "overdue" |
| DueList (deadlines) | Inside "Your day" + **"Due this week"** widget | Includes deliverables and (later) cohort assignments |
| Phone events (`PhoneEventsList`) | Inside "Your day" | Same |
| DailyCheckin | Check-in chip in the "Your day" header, plus an optional **Check-in** widget | Same data. "Learned:" still goes to Saved |
| Day progress | "Your day" header | *"2 of 5 done"*. No percent, no colour pressure |
| Phone calendar (connect, copy out) | ⋯ → Phone calendar | **Debounce `syncPlansToPhone`**, because Today refreshes more often |
| .ics export ("Add to my calendar") | ⋯ | Same |
| Remove duplicates | ⋯ → "Tidy up duplicates" | Same (`duplicateIds`) |
| Weekly review | ⋯, plus a Sunday "Look back at your week" card in the Due widget | Becomes **then vs now** on deliverables (§4.6) |
| Month view (today filled, ringed days, all-done ring) | Same | Adds deliverable due dots |
| Route params `editInstance`, `review`, `date`, `addFor` | Accepted by `Home` | Through the `PlannerScreen` redirect |
| ReminderComposer, AreaPlanCalendar "+ Plan", CaptureInbox date, NotificationCenter review | Unchanged | They navigate to `PlannerScreen`, which redirects |
| "What's next?" (FAB `next`) | Today ⋯ menu | Same action |
| **Drag to reschedule** (never built) | Day grid (time) and Week grid (day) | Long-press, then drag. Late phase (P10) |

**Parity checklist:** every row above becomes a line in `docs/shake-up-planner-parity.md` (steps + expected result), walked by hand in P3. The pure parts (params, add-flow signals, scope defaults, `useDayPlan` merge) are covered by extending `scripts/check-planner.mjs`.

### 3.3 Widgets on the Day view

- **`WIDGET_DEFS` moves** from `src/screens/HomeScreen.js` (164-205) to `src/data/dashboardWidgets.js`. Update `scripts/check-wiring.mjs` (93-114), `scripts/check-pickables.mjs` (65-71) and `scripts/check-style.mjs` (line 25) **in the same PR**. Keep the literal markers `const WIDGET_DEFS = [` and `const WIDGET_KEYS` so the parsers keep working.
- **`check-pickables` rule:** every widget key must be in `BASE_WIDGETS` or owned by a pickable in `src/data/pickables.js`, and every owned key must exist in `WIDGET_DEFS`. **Every new key** (`deliverable`, `dueSoon`, `stillOpen`, `find`, `room`, `money`, `assignments`, `unit`, `missions`, `checkin`) is added to `BASE_WIDGETS` or a pickable's `widgets` **in the same PR that adds it to `WIDGET_DEFS`**. Otherwise the check goes red.
- **`WIDGET_ALIASES`** in `reconcileWidgetLayout` stops saved layouts (`persona_profiles.active_widgets`, `user_settings.home_widget_layout`) from silently dropping renamed keys. It covers **all 24 current keys**:

| Old key | New key / fate |
|---|---|
| `hq` (CommanderCard: level ring, rank) | `room` (no level, no rank) |
| `focus` + `activities` + `desk` (TodayCard) | Removed from the board, because the plan *is* the day now. `desk` becomes "Next on your project" inside `deliverable` |
| `compass`, `goalSteps` | Folded into the `nextStep` widget. `goalSteps` survives as `unit` (this unit's 4 beats) |
| `stageSteps` ("gain a level") | `unit` |
| `wayfinder` | Kept and pickable. Its content also fills the You ikigai **"World needs"** circle. The HomeScreen 252-253 rule that forces it near the top is removed |
| `quests` (gamified "Missions" drills) | `missions` (Software for You + quests) |
| `checkins` | `checkin` |
| `wisdom` | Retired |
| `orgSnapshot`, `systemsCheck`, `recurringOps`, `vaultStatus`, `founderQuest`, `targetsReadiness` | Kept in code. **Pickable in Edit layout**, off by default (an "own boss" pack later) |
| `habitRings`, `lifeAreas`, `dailyDrills`, `studyBlocks`, `classProgress`, `builds`, `ideas` | Kept and pickable. **`lifeAreas` is in every path's pickable set** |

- **New keys:** `nextStep`, `quickAdd`, `yourDay`, `dream`, `deliverable` (this unit's deliverable: status, aim-for date, Open, Plan time, Share, Feedback), `dueSoon`, `stillOpen`, `find` (one-line or expanded Today's Find), `room`, `money` (money sheet snapshot), `assignments` (only when a class is on), `unit`, `missions`, `checkin`.
- **Defaults come from the path** (§8), **4 at most**. A widget's first appearance gets a mentor note (§7), not a widget-intro tour.
- `WIDGET_INTROS` (`src/data/widgetIntros.js`) stays until P7 because `check-wiring` needs an entry per key. Add entries for the new keys.

### 3.4 One source of "today"

- New **`src/logic/useDayPlan.js`**: `useDayPlan(date, {scope, areas})` merges `agenda_instances`, tasks, due items, `calendar_events`, deliverables and cohort assignments **once**. Inputs that don't exist yet (deliverables before P6, assignments before P11) are empty arrays.
- The Day/Week/Month views, Calm Day, `CalmWeek` and (until it retires) `TodayCard` all read it.
- **`CalendarModal` is retired.** Its 6 dependents move in the same PR:

  | File | Change |
  |---|---|
  | `src/components/FloatingActionButton.js` | `calendar` action → `goToScreen('Home', {view:'week'})` |
  | `src/components/FloatingCard.js` | Same |
  | `src/components/CalmWeek.js` | Reads `useDayPlan`; "open the week" → Today → Week |
  | `src/screens/HomeScreen.js` | Remove the modal mount |
  | `src/logic/notificationScheduler.js` | Notification taps open Today on the date |
  | `src/api/profileScopedClient.js` | Keep any scoping helper it shares; drop the CalendarModal reference |

  **Acceptance:** `grep -rn CalendarModal src context App.js` returns only comments.
- **Profile scope:** the Planner used `useViewScope('planner', SCOPE_PROFILE)`; CalendarModal used `useViewScope('calendar', SCOPE_ALL)`. Today's **Day** keeps the `planner` scope. Today's **Week/Month** use the `calendar` scope id with its `SCOPE_ALL` default, so people who relied on the calendar showing every profile still see every profile. Both toggles sit in ⋯ Options.
- **Guests:** `src/api/plannerService.js` gets a **storage adapter**:
  - Supabase when signed in.
  - AsyncStorage `@cth_local_agenda` as a guest.
  - Remove `PlannerScreen` from `ACCOUNT_ONLY_SCREENS` (App.js 82).
  - At signup, local plans are copied once into `agenda_instances`, with dedupe through `isSamePlan`.

### 3.5 Calm (kept, and widened)

**One setting.** `SETTING_KEYS.HOME_VIEW` (storage key `homeView`, already synced) **now means the app view**. `libraryView` (`src/screens/library/LibraryScreen.js` 358) is read once as a fallback and then retired. **`src/components/CalmLibrary.js` becomes the Calm view of Make** (it already renders the Calm Library; it is re-pointed at Make content). Toggles:
- the ◐ button in the control row
- Make it yours (MakeItYoursScreen 50, 171)
- "Show my desk" in Calm

**Default, without flipping anyone:**
- The hook default **stays `'full'`** (`useSetting(SETTING_KEYS.HOME_VIEW, 'full')` in HomeScreen.js 920 and MakeItYoursScreen.js 50). Existing users who never toggled have no stored value, so changing the default would change their view.
- New accounts get **`homeView = 'calm'` written explicitly** in the welcome (guest), in `finish()` and in `claimLocal()`.
- **"New account"** means: onboarding finished on a build that includes P2. `finish()` writes `metadata.shakeup_onboarded_at` (ISO date). Anything without it is an existing account.

| | Calm | Full |
|---|---|---|
| **Today – Day** | One `CalmPanel` rendering **the same widget board in the calm style**: only calm-capable widgets, fewer by default (`nextStep`, `yourDay` as "Today: 3 things", `find`, up to 2 path tiles), each still movable and hideable. Then `CalmWeek` · "Show my desk". Nothing pinned | §3.1 |
| **Today – Week / Month** | `CalmWeek` expanded, and a dot month in the CalmKit palette. Tapping a day opens Calm Day | Full views |
| **Controls** | Day/Week/Month and Add stay visible. Filter and ⋯ sit behind one **"Options"** link. **Every feature is still reachable** | All visible |
| **Learn** | Only the current unit card and its deliverable | Full map + shelves |
| **Make** | `CalmLibrary` re-pointed: "What you're making" + "Hand it in" | Full board + shelves |
| **You** | Dream, ikigai circles, Showcase shelf | Everything |
| **Numbers** | Only "done today" | Receipts counts, momentum |
| **Room** | A still frame (StudioStage style), only if placed on Today | A walking banner widget |
| **Celebrations** | One quiet line. No modals | The hand-in moment |
| **Guidance** | Single-card Calm notes. **The view is never flipped** | Spotlight available |

`src/components/CalmHome.js` becomes `src/screens/today/CalmToday.js`. `TILES` is re-keyed by path, not persona. `src/components/CalmKit.js` becomes the seed of the UI kit (§9).

---

## 4. The school / workspace feel (project-based learning)

### 4.1 The model

| School | Deskartes | Built from |
|---|---|---|
| Course | **Path** | New path purposes in `src/data/objectives.js` (old purposes kept for saved progress) |
| Syllabus | **My path** board on Learn: units in order, each with goal, steps, deliverable, aim-for date and status | New `src/screens/learn/PathScreen.js` |
| Unit | **Unit** = one objective with 4 steps: **Learn · See it · Practise · Do it** | Objective engine (`auto` / `signal` / `have` ticks) + `MissionScreen` beats → `src/screens/learn/UnitScreen.js` |
| Homework | **Tastes** (online or real life, each with a script) and **Notice** (*Want more · Not for me · Not sure* + one line) | Finds, `TodaysFind` actions |
| Assignment | **The unit's deliverable**, with a 3-line **"What good looks like"** self-check | Studio Builds, Workshop projects, Vault checklists, practice tests |
| Hand-in | **"Hand it in"**: run the self-check → snapshot → Showcase → receipt → mentor line | `src/logic/buildRender.js`, `record_action` |
| Feedback | **"Feedback I got"** on each deliverable (v1, manual), then in-app reviews (P11) | §4.5 |
| Portfolio | **Showcase** | `portfolio.js`, `StudioShowcase` |
| Report card | **Receipts** (then vs now) | `builds.js receipt()`, InsightsPanel, rating history |
| Class / teacher | Cohort + mentor (**off until the meetup**) | Institutional SQL, `CohortRosterScreen` |

**Across a path, units follow the loop** **map → taste → notice → walk → grow**. Inside each unit, the 4 beats are the steps.

### 4.2 First units and deliverables per path (v1 content)

| Path | U1 · map | U2 · taste | U3 · notice | U4 · walk | U5 · grow |
|---|---|---|---|---|---|
| **What do I like?** (default) | **A page about you** ✅ *(done in the welcome)* | 3 tastes → **taste log** | **"What pulls me" page** | A rough dream on your ikigai | Pick a path |
| **What's next for me** (incl. trades) | After-school **map card** (college, community college, trades, apprenticeship, work, military, gap year) | Try 2 options (shadow, campus visit, free intro) | **Compare sheet** | **Decision plan** (one page) | First real step booked |
| **Money on my own** | Read your pay stub | **Money sheet** (budget Build) | Open or check an account (checklist) | **$500 cushion plan** | One automation set up |
| **Job to career** | What fits (career cards) | One informational chat | **Skill-gap** card | One skill (class) + **proof project** | **Resume** Build + one application |
| **GED** (starting-point overlay) | Which test your state uses | A free practice test (link out to GED.com) | Your weakest subject | Study plan on Today | **Passed practice test** per subject |
| **Ground fix** (mini-path, one per life area; used when "The ground" is shakiest) | **Rate it** (1–5 + one line, stored in `life_area_ratings`) | — | — | **One small fix** this week (a plan on Today, with the area set) | **Then vs now** re-rate after 7 days → deliverable **"My reset plan"** (one page: where I was, what I changed, what's next) |

The Ground fix is one short unit per life area, so the "keep basic life needs" part of the loop has a real deliverable on Today. When it's handed in, the person moves on to their suggested path (§8.1).

**New Build kinds:** `money` (money sheet), `resume`, `plan` (decision plan / compare sheet / reset plan). Each must pass `check-builds` (every kind × option renders and escapes).

**Content and license rules (✅ vision §16, unchanged):**
- Host natively only **CC BY, CC BY-SA, CC0, public domain, MIT/BSD/Apache**.
- **Link out** to anything NC, plus roadmap.sh, MIT OCW and CK-12/LibreTexts. Link out to The Odin Project until its LICENSE is checked.
- **Credit every source** on an Open Source Credits screen.
- **Rewrite in our own voice.**
- Map cards use **O\*NET (CC BY 4.0)** and **BLS**.
- GED practice, GCFGlobal and apprenticeship.gov are link-outs (check their terms).
- Every fact gets a source and a review date.

### 4.3 One deliverable concept (instead of five)

| Layer | What |
|---|---|
| `src/logic/deliverables.js` (pure, checked) | Adapts Builds, Workshop projects, Vault checklists, `portfolio_entries` and cohort assignments into one shape: `{id, kind, source, ref, title, pathKey, unitKey, status, aimFor, nextAction, rubric, snapshotAt, shareable, feedback}` |
| `kind` | `build` · `project` · `checklist` · `test` · `reflection` (taste log, pattern card, reset plan) |
| `status` | **To do · Doing · Handed in · Shown** (+ **Reviewed** once feedback exists) |
| `aimFor` | A soft date **the student picks** ("When do you want this by?"). Never red, never "overdue". A late item shows "Still open" with Move / Drop |
| `feedback` | A list of `{who, said, change, changed, at}` notes (§4.5). `changed:true` when the student marks "I changed it" |
| `src/api/deliverableService.js` | Local-first (`@cth_deliverables_<uid|guest>`), then the Supabase table `deliverables` (`id, user_id, path_key, unit_key, kind, ref_id, title, status, aim_for, rubric jsonb, feedback jsonb, snapshot_at, created_at`). RLS owner-only. **The source records stay where they are**: this row only overlays status, dates, path and feedback |
| Builds sync | New `builds` table (RLS owner) with a one-time upload of `@cth_builds_<uid>`. Guest Builds (`@cth_builds_guest`) are claimed at signup |
| Data export | `src/api/dataExport.js` adds `builds`, `deliverables` and `life_area_ratings` (the "your data" promise) |
| Showcase unlock | The `portfolio` feature keeps its id. `unlockedBy` changes from `ship-first-build` to **"first deliverable handed in"**, so Builds count |

### 4.4 The Make tab: a work board

- **Board:** To do · Doing · Handed in · Shown. On a phone it's a segmented list. On a wide web screen it's a kanban.
- **Each card:** a thumbnail of the snapshot, the unit, the aim-for date, the receipt line (*"You changed 3 of 4 parts"*), the feedback count (*"2 people looked"*), and **one primary button**.
- **Shelves below the board:**

  | Shelf | Holds |
  |---|---|
  | **Start something** | Studio kinds, ordered by path |
  | **Missions** | Software for You + quests |
  | **Projects** | Workshop |
  | **Saved** | Inbox · Saved · Finds |
  | **Showcase** | Everything handed in |
  | **Tools** | Money trackers and extras, by path |

- **"Missions" means one thing only:** `SoftwarePathScreen`. The gamified `MissionsScreen.js` drills list is retired (§6).

### 4.5 Visually displayed, shared, collaborated

| When | Share | Collaborate | Under 18 |
|---|---|---|---|
| **v1 (P8)** | **"Take it home"**: the single-file HTML from `buildRender.js` for any deliverable. **"Share my work"**: new `renderShowcase()` makes one offline HTML page of your deliverables and receipts, **with no level, XP or streak at the top**. A **picture card** (image + one line) through `shareFile`. `portfolio.js` share (351-370) leads with the work | **"Ask for feedback"**: shares the file plus a prompt (*"3 things I'd like you to look at"*) through `shareText`. **"Feedback I got"** on every deliverable: *who* (free text, e.g. "my aunt"), *what they said*, *what I'll change*, and later a tick for **"I changed it"**. No accounts needed. Stored locally and on the `deliverables.feedback` column. It shows on the card, in the Showcase file (opt-in) and in Receipts (*"3 people looked at your work · you changed 2 things"*). "I changed it" counts toward the **then vs now** line | ✅ Export only. Feedback notes are private and never published |
| **v1 too (P8) ✅** | Read-only **share link** `/s/<token>` (table `share_links`: token, owner, target, revoked_at), rendering the snapshot or the Showcase on the Expo web build. **18+ only**; revoke any time | — | ✅ No links (export only) |
| **After the meetup (P11)** | — | `cohort_assignments` gains `path_key, unit_key, deliverable_kind` (new migration). An assignment **becomes a deliverable** on the board and in "Due this week". New `assignment_submissions` and `deliverable_feedback` (kinds `looks_good` / `try_this`, **no grades**), moderated through `allowed.js`. `deliverable_feedback` **replaces manual entry** for people inside the app; manual notes stay for everyone else. The **teacher grid** in `CohortRosterScreen` is students × units, with cells To do / Doing / Handed in / Reviewed | Links only to a **linked parent or their class**. `communityAccess()` rules apply. Mentors still refuse minors |
| **Family v2** | — | `get_my_children` v2 returns path, unit and the last deliverable handed in (with the teen's consent toggle) instead of level/XP/points/streak | Consent toggle |

### 4.6 Every screen ends in one action

| Screen | Primary button |
|---|---|
| Today | **Start** (the next step) |
| Learn | **Continue Unit N** |
| Unit | **Hand it in** |
| Make | **Keep going** (the Doing card) |
| You | **Try something for your shakiest circle** |
| Weekly review | **Pick next week's 3** (then vs now on deliverables first) |
| Empty states | Say what to do. Never "nothing here" |

---

## 5. The You page (ikigai) and room placement

### 5.1 `YouScreen`

1. **Your Dream** in your words (`DreamCard`, tinted, with the Later snooze kept).
2. **Your ikigai:** `src/components/IkigaiCircles.js` draws four overlapping SVG circles that **fill in from real data**. Each circle opens its own detail view.

   | Circle | Filled by |
   |---|---|
   | **Love** | `src/logic/studio.js` sparks / `sparkLine` + tastes marked *Want more* |
   | **Good at** | Mastered parts + deliverables handed in + feedback that said "looks good" |
   | **World needs** | Wayfinder values (the `wayfinder` widget's data) |
   | **Paid for** | Saved career cards, the path's destination |

3. **The ground:** the 8 life areas as a quiet row of `LevelRing`s, each opening its existing screen and its Ground fix unit. **Then vs now** needs a new append-only `life_area_ratings` table (RLS owner, added to `dataExport`).
4. **Shakiest circle**, highlighted, with one suggested taste.
5. **Receipts** and a **Showcase** shelf.
6. **Your room**, if it is placed here.

All of it renders for guests from local data (§2.2).

### 5.2 Character, pet and scene placement

| | |
|---|---|
| **Setting** | `SETTING_KEYS.ROOM_PLACE = 'roomPlace'`: `'you'` (default) · `'today'` · `'off'`. It uses the `@cth_setting_` prefix, so `src/logic/prefsSync.js` syncs it across devices |
| **Scope** | `roomPlace` covers **Today and You only**. **Learn → Practice keeps its walking pet as today** (the pet finds coins there). The Studio and the welcome keep their own stage |
| **Where you set it** | The room's own ⋯ ("Show on Today / Show on You / Hide"), Make it yours → Your room, and one welcome/guide step |
| **One component** | `src/components/Room.js` wraps `LandscapeBackground` + `CharacterWalker` + the ambient mode from `StudioStage`, with props `size` and `calm`. **One size per place:** a 160px header on You, a 120px `room` widget on Today, and the existing sizes in Studio and the welcome |
| **Calm** | A still frame with no walking (StudioStage style) |
| **Off** | Only the avatar in the top bar |
| **Wallpaper** | `HOME_BACKGROUND 'player'` (`PlayerMatchBackground`) becomes the sub-option **"Room as Today's background"**. It applies only when the room is on Today, and only in Full |
| **One editor** | **Edit room** opens `src/components/RoomEditorSheet.js`, with tabs **Wardrobe · Decorate · Pet · Trophies** (moved from `src/screens/ProfileScreen.js` 282-420: `WardrobeModal`, `DecorateSheet`, `PetCareSheet` **with feeding**). It opens from either placement |
| **Storage** | `useCharacterLoadout` and its key **`@cth_cache_characterLoadout`** are **unchanged** (it is in the prefsSync `EXACT` list) |
| **Pet** | Your **study buddy**. It speaks the mentor lines (`companionLine`), appears in Builds, and stands beside the guide. ✅ **The whole pet system stays as it is today**: care, hunger, feeding, pet food, coins, bonus collectibles, the daily gift and the `petsOpen` gate (`src/data/petOptions.js`). Only its copy is checked for the mentor voice (no guilt lines) |
| **Coins keep working** | Today `useCoinRewards` / `useBonusRewards` mount on `GamesScreen` (the Learn root) and `ProfileScreen`, with `TrainingNav.js` and `CharacterWalker.js` wired to them. **Keep them.** When `GamesScreen` moves to the `Practice` route (§2.1), keep the coin hook mounted at app launch (the reason `Training` has `lazy:false`, App.js 226-234) so the pet still finds coins on any screen. Keep `RewardToast hideCoins` (App.js 584). If the room is on Today, the pet's coins show there too |

---

## 6. Points and XP, reworked: receipts, not a score

**Rule:** the **server ledger stays** as it is (`increment_user_progress`, `_award_progress`, `level_for_xp`, the claim tables, the `profiles_protect_server_fields` trigger). The rework changes **what shows** and **what pays**. Nothing is rare. **The one currency is the pet's** (points for pet food), kept as it is today.

| Today | Becomes | Why |
|---|---|---|
| XP → Level 1-20 | **Quiet.** Shown only at the bottom of Receipts as *"Level 6 · builder"*. Never in the chrome | North Star: levels sit below the dream |
| Points → Rank 1-20 → 5 Tiers | **Gone from the UI.** The column keeps accumulating (the ledger). `rankUtils` is kept for the leaderboard, which is parked | Seven scales is too many |
| Spendable points, pet food | ✅ **Kept** as the pet's currency (`feed_pet`, `point_spends`, `useSpendablePoints`). Shown in the pet sheet and the room editor, **not** in the top bar | Founder's call: keep the pet stuff |
| Pet coins (1 per 3 min), bonus collectibles, the daily pet gift | ✅ **Kept** as today (§5.2) | Founder's call |
| Pet hunger, hunger reminders | ✅ **Kept.** Copy is checked for the mentor voice: a hungry pet is a nudge, never a scolding, and a comeback is *"Welcome back"* | Founder's call; the North Star's no-guilt rule shapes the words |
| Pet bond 1-5 | Kept as shown. 💡 It grows from **units done**, never goes down (small new migration, optional in P6) | Companion, not a leash |
| Streak + *"Do one thing today to keep it"* (HomeScreen 2079-2090, CalmHome 231-259) | **Momentum:** *"You did something on 3 days this week."* No missed-day count, no at-risk copy. A comeback says *"Welcome back. The next step is ready."* It is computed from the same rest-day logic (UserProgressContext 491-503). Shown in Full Receipts only, with a switch to hide it | No guilt |
| XP Challenges (`claim_mission_reward`, MissionsScreen drills, the `quests` widget) | **Retired.** First rewrite the Compass "Finish a daily drill" step: `src/data/objectives.js:322`, step id `'mission'`, currently `auto: { stat: 'missions', value: 1 }`, fed by the daily-drill counter in `context/AccessContext.js` (~268, `missionsToday`). **Keep the id `'mission'`** (objectives.js never renames ids) and change only its `auto` stat to count **Practice drills done**, not daily mission rows. The daily-mission refill in UserProgressContext (330-345, comment at 353) can stop once nothing reads it | Rewards activity, not work |
| Leaderboard | **Parked** (flag off, route kept) | Competes on accumulation |
| 14 client-only badges, including "Point Hoarder" and "Point Legend" | **Milestones** with a date, derived from deliverables and units (first deliverable, first unit, first shown, first feedback, 3 tastes, first comeback). **Built in P6**, when deliverables exist. P5 only removes the point badges. Delete `BadgePopup.js` (0 importers) in P0 | Shareable, with a history |
| Subject XP / levels | **"Topics done"** per subject, inside Classes only | Honest |
| `LevelUpNotification` | **Retired in P5**, replaced by a quiet mentor-line toast. **`HandInMoment.js`** (calm-aware; shareable through `shareOut.milestoneText` and `useCalmMoment`) arrives **in P6** with hand-ins. `UnlockNotification` shows **"Your map got bigger"** and stops folding in level-ups | One signature celebration |
| `RewardToast` "+N XP" | **Mentor-line toast:** *"You finished it. Most people never start."* | The North Star voice |
| Round prize card (Practice) | Still claims through the ledger, but shows a line instead of points | No score above the dream |

### 6.1 What pays (ledger, server-side; ships in P6)

A new migration file `supabase/migrations/2026102x_record_action_work.sql`. It is **hand-applied in the SQL editor, never `supabase db push`**. It keeps the same daily caps and leaves the protect trigger untouched. New `record_action` kinds:

| Kind | XP |
|---|---|
| `deliverable_handed_in` | 50 |
| `deliverable_shown` | 30 |
| `unit_done` | 100 |
| `taste_logged` | 10 |
| `build_mastered` | 40 |

The existing kinds stay. Game XP stays capped at 100 a day, and only inside Practice. Feedback notes earn **nothing** (they are self-reported, so paying for them would invite farming).

### 6.2 Receipts (the visible unit)

- **`src/logic/receipts.js`** (pure) derives the counts from data that already exists: deliverables (and their feedback), Build receipts, units done, tastes, `action_claims` and `activity_log` timestamps.
  - *"4 handed in · 9 parts mastered · 6 tastes tried · 3 people looked · 23 steps done"*
  - Then vs now, from `life_area_ratings` and "I changed it" feedback ticks
  - Milestones with dates
- **Before P6** it shows Build receipts, objective steps and tastes only.
- 💡 **No new receipts table.** The ledger, `action_claims` and `deliverables` already hold the dates.
- **Guests:** receipts derive from local deliverables, so they **carry into the account at signup** along with the work. **Points and XP still don't carry over** (the anti-farming rule, UserProgressContext 62-66).

### 6.3 Cosmetics without bait

1. **All outfits, held items, backdrops and level-gated decor are open to everyone** from the first minute. Gate checks in `src/data/characterOptions.js` (92-98) and `src/data/backgroundOptions.js` (32) return open. The `unlockLabel` copy goes. **Pets keep their own system unchanged** (§5.2), including `petsOpen` in `src/data/petOptions.js`.
   - **Why:** nothing can re-lock, so no `owned_cosmetics` migration is needed, and `findUnlocked` can never fall back.
2. **Earned by real work:** Build trophies (`stageDecor.setEarnedTrophies`, already working) plus **one trophy per unit done** (new decor entries in `sceneArt.js`, P6). These are earned. They are not bait.
3. **Remove the "Not yet" level teasers** in the onboarding outfit picker.

### 6.4 Who else sees progress

| Surface | Change |
|---|---|
| Family / `ChildProgressScreen` | Unchanged until Family v2 (§4.5), then path, unit and deliverables |
| Cohort | Progress grid (§4.5). `get_cohort_leaderboard` unused |
| Insights (`Stats`) | Real-life numbers first. Points, rank and the old game stats move under "See all numbers" |

---

## 7. The tutorial redo, with the welcome before login

### 7.1 From 7+ voices to one guide in 3 layers

| Layer | When | How | Replaces |
|---|---|---|---|
| **1. Welcome** | First launch, signed out | Full-screen cards, no spotlight (§7.2) | `MultiStepOnboarding`'s 8 cards, the welcome tour (`tourSteps.js`), GettingStartedCard |
| **2. Mentor notes** | The first time you see a **surface**. **At most 1 automatic note per session** | One card in place: *"This is your week. Tap a day to plan it."* Buttons **Got it** and **Show me** (Show me runs a ≤3-step spotlight). Manual trigger: **"About this page"** (§7.3) | `useFirstVisitTutorial`, widget intros, the new-widget offer, Settings "Replay Tutorial" (reworded) |
| **3. Guided first unit** (teach by doing) | The first unit of your path, and each unit's first time | `passthrough` + `completeAction` + `prefill` + signals, **generated from unit data** by `autoScript`. The framing is the deliverable: *"Let's make your money sheet. Tap Add."* It ends with **one check-for-understanding quiz step** (the existing quiz block) | `useGuidedFirstGoal`'s hand-written walks. The 14 `FIRST_GOAL_GUIDE` scripts stay for old goals until those goals retire |

**Engine (kept)**

- `TourOverlay`, `TourSpot` and the `startLesson` primitives are unchanged.
- `context/TourContext.js` gains a new front door, `src/logic/guide/useGuide.js`:
  - **one queue** with one priority order: **guided unit > first-day walk > mentor note**
  - the `SCREEN_TUTORIALS_ENABLED` kill switch kept
  - the "mark before show, un-mark on replaced" rule kept
  - the NEVER list kept
- `startTour` and `startScreenTour` stay as thin wrappers over `startLesson`, so every call site keeps compiling: Help 103, Settings 681-683, TopBar 119, UnlockNotification 93/106, ModuleScreen 126, HomeScreen 1347.

**Keys**

- Notes are keyed by **surface id** in `src/logic/guide/surfaces.js`: `today.day`, `today.week`, `today.month`, `today.calm`, `learn.path`, `learn.unit`, `learn.finds`, `make.board`, `make.saved`, `you`, `you.room`. Each one maps to its current route(s).
- New seen-set **`@cth_guide_seen_v2_<uid>`**. **It does not sync on its own:** `PREFIXES` in `src/logic/prefsSync.js:24` is `['@cth_setting_', '@cth_screen_tutorials_seen', '@cth_widget_', '@cth_experience_stage_seen']`. **P0 adds `'@cth_guide_seen'` to `PREFIXES`.** The set is **seeded once** from `@cth_screen_tutorials_seen_<uid>` through a `ROUTE_TO_SURFACE` table, and existing accounts are seeded as "seen" for every surface that existed before. **Nobody gets re-taught, on any device.**

**The guide character**

- It is **your own character, with your pet beside it** (`PlayerCharacter` with your loadout). Before the welcome's character pick, it uses the default outfit.
- `src/data/guides.js` (Sage/Quill/Ward/Rook) becomes `getGuide(loadout)`, with the old persona guides as the fallback only.

**Calm guidance**

- Notes render as a `CalmPanel` card with no spotlight unless **Show me** is tapped.
- New TourSpots on the Calm parts: `calm-next`, `calm-plan`, `calm-add`.
- The HomeScreen 1003 rule (tours force Full) is **removed in P7**, together with the content that needed it.

**Content rules**

- No guide copy mentions points, levels, streaks, rank or the old tab names. That includes `src/logic/screenTutorials.js` 243 (*"Your traveler walks around Home and Learn. New gear unlocks as you level up."*, step `profile-rank`), which is rewritten in P5.
- First-day walk (Today, 4 steps): next step → `planner-add` → `planner-views` → `topbar-avatar` (*"Your ikigai lives up here"*).
- Content lives in `src/logic/guide/lessons/`.
- `screenHelp.js` folds into `src/data/pageInfo.js` for **"About this page"** (§7.3).

### 7.3 "About this page" replaces the Screen Tutorial ✅

The founder's call (2026-10-21): **replace the current Screen Tutorial with relevant info.** The old per-screen tours (`src/logic/screenTutorials.js`, opened from TopBar "Screen Tutorial", TopBar.js 42 / 119) teach the **old** app (points, rank, old tab names). They are **not ported**. Each surface gets **fresh info written for the new app**.

| | |
|---|---|
| **Where** | The top bar menu item **"Screen Tutorial" becomes "About this page"**, plus the same link in the You footer. Same spot, so habits keep working |
| **What it shows** | One sheet per **surface** (`src/logic/guide/surfaces.js`), four short parts: **What this is for** (one line) · **How it helps you** (which ikigai circle or the ground, and your path) · **What you can do here** (the 2–3 main actions, each a button that does it) · **Show me** (the ≤3-step spotlight, optional) |
| **Tailored** | The "How it helps you" line and the actions follow your starting point and path (§8). A GED user's Learn page says *"Your practice tests live here"* |
| **Content** | New file **`src/data/pageInfo.js`**, keyed by surface id. `screenHelp.js` folds into it. Plain words, under 60 words per sheet, no points / rank / streak / old tab names |
| **Guard** | `check-tour-spots.mjs` checks every surface has a `pageInfo` entry and every action button targets a registered route or alias |
| **Kill switch** | The `SCREEN_TUTORIALS_ENABLED` setting keeps controlling the **automatic** notes only. "About this page" always works |

**Guard**

`scripts/check-tour-spots.mjs` gains a **route/surface check**:
- every `go` / `screen` / `SCREEN_FEATURES` key must be a registered route or alias
- every surface key must exist

Its file list adds `src/logic/guide/**`. Today a renamed route fails silently, and this closes that gap.

### 7.2 Welcome flow (before login): `src/screens/welcome/`

One new root route **`Welcome`**, added to `NO_TOPBAR_ROUTES`. Pure gating lives in **`src/logic/welcomeCards.js`** (no imports, the same pattern as `onboardingCards.js`). Answers are kept **on the phone only** in `@cth_welcome_v1` (`{startPoint, shakiest, pathKey, firstName, done, guest}`; **no age**), next to `@cth_onboarding_draft`.

| # | Screen | Asks / shows | Stored locally |
|---|---|---|---|
| W1–W3 | **Ikigai in 30 seconds**: the four circles, then the ground, then *"You're not behind. You're starting from here."* A "where'd this come from?" link. A small **"I already have an account"** link | — | — |
| W4 | **"Where are you in life right now?"** ✅ (replaces the age question; this is the starting point) | Finishing high school · Working, no career yet · Didn't finish school (GED) · Not sure / something else | `startPoint` |
| W5 | **"Which feels shakiest right now?"** | Love · Good at · World needs · Getting paid · The ground | `shakiest` |
| W6 | **"Want to start here?"** One suggested path (§8), changeable in one tap | — | `pathKey` |
| W7 | **First use: "A page about you."** A Studio `page` Build, prefilled from W4–W6 and the Dream question (*"Describe a normal Tuesday in the life you want"*). The guide walks *change one part, see it live* through a **hand-written lesson on the existing `startLesson`** (`src/logic/guide/lessons/welcomePage.js`); P7 replaces it with the generated version. You pick your character here (outfit picker, `src/screens/onboarding/steps.js` 726-755) and your first name (local). About a minute | `BuildScreen` in guest mode (`@cth_builds_guest`). Dream via the local `saveDream`. Marks path Unit 1 handed in (before P6: a local `unit1Done` flag that P6 converts into a deliverable row) |
| W8 | **"Want to keep this?"** | **Create account** · *Keep going as a guest* | `done`, `guest` |
| → | **Today**, already tailored, in Calm (`homeView = 'calm'` written). Unit 1 handed in, the next step is Unit 2 (before P6: the next step is the starter objective) | — | — |

**No age before signup.** Guests see **all-ages content**: anything marked adult-only (`DISCOVER_AGE_BANDS` in `src/data/knowledgeCatalogs.js`) stays hidden until a signup birth date says 18+. Guests can't publish or make share links anyway (both need an account).

**Boot** (App.js 446-468, LoginScreen 122-158). Today every signed-out user goes to `Login` (App.js 449-454) and guests reach MainTabs only through LoginScreen's guest button (522-546). The new boot reads `@cth_welcome_v1` before the session check:

| State | Goes to |
|---|---|
| Session + `onboarding_completed = true` | Today. **The welcome never shows** |
| Session + no `metadata.path_key` (existing accounts) | Today, plus a one-time **"Pick your path"** mentor note (not a wizard) |
| Session + `onboarding_completed` not true | Slim `MultiStepOnboarding` (below) |
| No session, welcome not done | `Welcome` |
| No session, welcome done, `guest: true` | Today as a guest |
| No session, welcome done, otherwise | Login |

The 10-second boot timeout and the error path also check `guest: true` before falling back to Login. LoginScreen's guest button sets `guest: true` too, so it survives a relaunch.

**Signup:** Login (signup mode), then a **slim `MultiStepOnboarding`** (route name kept):

1. **Age gate → KWS parent consent** (the existing phases, MultiStepOnboarding 153-159). **Nothing personal leaves the phone before this.**
2. **Name** (prefilled from the welcome).
3. Done.

`finish()` keeps its order (583-733), reads the welcome answers and adds the claim:
- `saveOnboardingFields` (`onboarding_completed = true`, and `metadata.start_point / path_key / shakiest / shakeup_onboarded_at` (the age band comes from the birth date, as today))
- `setExperienceMode('picks')`
- `saveDream`
- `choosePurpose(pathPurpose)`
- `createMasterProfile(derivePersona(...))`
- `startFirstGoal(firstUnit)`
- write `homeView = 'calm'` (new accounts only, §3.5)
- **`claimLocal()`**: Builds, deliverables (or the `unit1Done` flag), local agenda, Dream and welcome answers
- `clearOnboardingDraft`

**The old cards:** aim, persona, start/track, features and sectors are **dropped from the wizard**. `DreamStep`, `CharacterStep`, `InterestsStep`, `SectorsStep` and `PlannerStep` stay as **optional sheets** that a mentor note offers when relevant. `LookStep` (unused) is deleted. The header comment that says K-12 is fixed. `scripts/check-pickables.mjs` (85-97) is updated to the new step keys **in the same PR**.

**Derived persona** (`src/logic/derivePersona.js`, pure) keeps every persona reader working: `createMasterProfile`, curriculum, widgets, quests and experienceStages.

| Inputs | Persona |
|---|---|
| Finishing high school, or GED | `STUDENT` |
| Working + any path | `PERSONAL` |
| Business Build chosen | `ENTREPRENEUR` |
| Fallback | `PERSONAL` |

---

## 8. Tailoring by starting point and path

**One pure module, `src/logic/tailoring.js`** (no imports), guarded by **`scripts/check-tailoring.mjs`**.
- **Input:** `{startPoint, shakiest, pathKey, isMinor}`. `isMinor` comes from the signup birth date (unknown for guests → treated as under 18 for content).
- **Output:** suggested path, Today default widgets (`nextStep`, `yourDay`, `find` + ≤4 path widgets), Calm tiles, Learn shelves, Make kinds order, FAB actions shown first, which tools show, mentor-note set, and the derived persona.
- Its data lives in `src/data/pathKits.js`. It **re-keys** `src/data/experienceStages.js` PATHS. Persona PATHS stay as the fallback for old accounts.

### 8.1 Suggested path

| Start ↓ / Shakiest → | Love / not sure | Good at | World needs | Getting paid | The ground |
|---|---|---|---|---|---|
| **Finishing high school** | What do I like? | What's next for me | What do I like? | Money on my own | **Ground fix** first, then What do I like? |
| **Working, no career yet** | What do I like? | Job to career | What do I like? | Money on my own | **Ground fix** first, then Job to career |
| **Didn't finish school (GED)** | What's next for me (GED units first) | What's next (GED) | What's next (GED) | Money on my own | **Ground fix** first, then What's next (GED) |
| **Not sure / something else** ✅ | What do I like? | What do I like? | What do I like? | Money on my own | **Ground fix** first, then What do I like? |

### 8.2 What each path shows (strict tailoring: nothing else in sight)

| Path | Path widgets (≤4, after `nextStep`, `yourDay`, `find`) | Calm tiles | Learn shelves | Make kinds first | FAB first |
|---|---|---|---|---|---|
| **What do I like?** | deliverable, find, checkin, room* | find, unit | Sampler map, Today's Find | page, beat, game | What's next?, Note, Add plan |
| **What's next for me** | deliverable, dueSoon, find, stillOpen | unit, dueSoon | After-school map (trades incl.), Career Explorer, Classes | page, plan | What's next?, Note, Add plan |
| **Money on my own** | deliverable, money, dueSoon, stillOpen | money, dueSoon | Money map, money lessons, Savings/Debt calculators | money, business | What's next?, Add plan, Reminder |
| **Job to career** | deliverable, dueSoon, missions, find | unit, dueSoon | Career map (O\*NET/BLS), skill classes | resume, page, ai | What's next?, Add plan, Project |
| **Ground fix** | lifeAreas, checkin, deliverable, dueSoon | unit, checkin | That area's lessons, the life area screen | plan | What's next?, Add plan, Reminder |

\* `room` only when `roomPlace = 'today'`. `lifeAreas` is pickable on every path. Every widget, including `nextStep`, `yourDay` and `find`, can be hidden.

| Starting point | Changes the start and the words |
|---|---|
| **Finishing high school** | School-year examples, "after graduation" dates, Classes shelf first, under-18 rules (export only), parent-link offer if the signup birth date is under 18 |
| **Working, no career yet** | Evening/weekend time defaults, time- and money-saving Finds first, *"learn without going back to school"* copy, Work Mode in Today's ⋯ |
| **Didn't finish school (GED)** | The GED overlay units, asks **which state** (kept on the phone), Classes = the 4 GED subjects, the lowest reading level, *"no shame"* copy |
| **Not sure / something else** ✅ | The **What do I like?** sampler first, tastes from every map, *"you don't need to know yet"* copy, and a gentle **"Where are you in life?"** re-ask after a few tastes |

**Nothing is forced onto Today** ✅. The core (**next step, Dream echo, your day, Today's Find**) arrives as **default widgets** you can move or hide. One tap away from any screen: **a short lesson** (Learn → Continue) and **Saved** (Make → Saved).

**The map grows, not the features:**
- A finished unit opens more of the map (new map cards, a new taste, the next path).
- The `auto` / "Level up" track is **retired**, and saved `auto` maps to `picks`.
- `full` becomes **"Show everything"** in Make it yours. My features stays for adding extras.
- `access-system.md` gates (allowed / door) are unchanged.
- `STARTER_FEATURES`, `FULL_TUTORIAL_AT` and `reteachBetween` are removed in P7 with the old tutorials.
- **Studio, Missions, Wayfinder and AIBridge get `featureCatalog` entries** (open, place front/background), so they can be tailored by path.

---

## 9. Visual direction

- **Built from Calm.** The accent-tinted `CalmPanel` is the signature surface. 💡 The default base is **warm light "notebook paper" with the Calm panel as the accent**, and dark is a true twin (❓ brand call).
- **One card rule** (consolidation §11): **tinted = yours** (Dream, your deliverables) · **edge = in progress** (next step, current unit, a Build halfway) · **plain = everything else**. **One primary button per card.**
- **School cues, quietly (Classroom / Canvas without the corporate feel):**
  - Each **path has one colour + icon**, used on the path chip, unit edges and deliverable cards. Buttons follow the person's accent.
  - **Status chips always have words** (To do · Doing · Handed in · Shown · Reviewed). Never colour alone.
  - **Progress bars count steps**, not percent. **Aim-for chips are neutral, never red.**
  - **Deliverable cards show a real thumbnail** of the work, so the board looks like a portfolio wall.
  - **Week view reads like a syllabus:** plans plus `Due:` deliverables.
- **Kit:** tokens + about 10 primitives in **`src/ui/`**, grown from `CalmKit.js`: `Panel`, `Card`, `Headline`, `Chip`/`StatusChip`, `Segmented`, `StepBar`, `DueChip`, `PrimaryAction`, `Sheet`, `EmptyState`, `Skeleton`.
- **The rule for front screens:** the front screens (Dashboard, CalmToday, Learn, Path, Unit, Make, You, Welcome) use **only** the kit. `check-style.mjs` is extended to them (no inline hex colours, no inline style blocks).
- **Pixel art only in the room and trophies.** The base UI is premium and plain.
- **Feel:** skeletons instead of spinners, press feedback, light haptics on tick and hand-in, and **one signature celebration** (the hand-in moment, with an ikigai circle filling a little).
- **Reach:** 16px gutters at phone width, no horizontal scroll, works on a cheap phone with weak data. Plain words, low reading level, bold key words. Clean web titles (App.js 257-263 formatter; add `title` options to new routes).

---

## 10. What gets parked or cut

| Item | Fate |
|---|---|
| LV/PTS pill, tier crest, tier strip, gift button, "Commander", rank chips | **Cut from the UI** (ledger kept) |
| Streak and its at-risk copy | **Replaced** by momentum |
| XP Challenges, `MissionsScreen.js`, the `quests` widget meaning | **Retired** (drills stay as Practice; saved quest links still resolve) |
| Leaderboard | **Parked** (flag off, route kept) |
| Level, rank and point cosmetic gates | **Removed** (everything open; trophies earned) |
| `auto` track, StageStepsWidget "gain a level" | **Retired** |
| Welcome tour, GettingStartedCard, widget intros, new-widget offer, per-route first-visit tours | **Replaced** by the one guide |
| Screen Tutorial (old per-screen tours) | **Replaced** by **"About this page"**: fresh, relevant info per surface (§7.3) |
| Pet care, hunger, food, coins, bonus collectibles, daily gift | ✅ **Kept as today** (not parked) |
| Persona guides (Sage/Quill/Ward/Rook) as the voice | **Fallback only** |
| Wizard cards aim / persona / start / features / sectors; `LookStep` | **Cut** from the first run |
| CommanderCard/`hq`, `wisdom`, AffirmationModal, quotes pool, `CalendarModal`, TodayCard on the board, RightNowCard as a card | **Cut / folded** into Today |
| `libraryView` setting | **Retired** after a one-time read into `homeView`. `CalmLibrary.js` lives on as Calm Make |
| Idea Garden | **Folded** into Workshop's Idea stage |
| Community, Feed, Fellow Scholars, Labs, Mentors marketplace, Lesson Builder (K-12 bands) | **Off** until the in-person school exists |
| Hosting, GitHub sync, WebGL, AI-made content (Plus), collaborative filtering | **Later** (vision §16). Share links are **not** parked: they ship in P8 |
| 30+ mini-games | Kept inside **Practice**, not promoted, with the walking pet as today |
| Living on my own, Homeschool, Re-entry, "Never been shown" | **Next content packs**, same engine |
| Dead code: `BadgePopup.js`, `AgendaItem.js`, `pendingRewards`, the TopBar `{tab:'rewards'}` param, dead search rows, stale "+5 XP" comments (`src/logic/gameXpCap.js`, `src/components/RewardToast.js`) | **Deleted in P0** |

---

## 11. Build phases

**Every phase must:**
- pass **`npm run check`** (today's 18 scripts plus every new script added to the `check` line in `package.json` line 11)
- update any check script that parses a moved file **in the same PR**
- never rename a persisted key without a migration
- never edit an old SQL migration: new files only, **hand-applied** in the SQL editor, never `supabase db push`
- pass a **manual matrix**: guest/signed-in × Calm/Full × light/dark × phone-width web + one native device
- state **how it works before later phases** and **how to roll it back**

New check scripts this plan adds:
- `check-routes` (inside `check-tour-spots.mjs`, or as its own `scripts/check-routes.mjs`)
- `check-tailoring.mjs` (tailoring, pathKits, welcomeCards, derivePersona)
- `check-deliverables.mjs` (deliverables, receipts, nextStep)

**Order:** P0 → P1 → **P2 welcome** → **meetup gate** → P3 → P4 → P5 → P6 → P7 → P8 → P9 → P10 (optional) → P11. This follows vision §2/§16 ("Now": welcome, "A page about you", You-as-ikigai; "Then": tabs and surfaces). ❓ If the founder wants the surfaces first instead, that **overrides a ✅ decision** and must be recorded as such (Founder answer 9: kept).

### P0 · Guardrails (no visible change)

- **Goal:** make every later rename safe.
- **Work:**
  - Save this plan as `docs/shake-up-plan-2026-10-21.md`. Add a one-line link to it in vision §11, §13 and §16.
  - `appRoutes` `ALIASES` + the `ConnectedApps` fix.
  - Route/surface check in `check-tour-spots.mjs`.
  - `WIDGET_ALIASES` in `reconcileWidgetLayout` (all 24 keys, §3.3).
  - Move `WIDGET_DEFS` → `src/data/dashboardWidgets.js` (update check-wiring, check-pickables, check-style).
  - Pure `tailoring.js`, `pathKits.js` (skeleton), `derivePersona.js`, `welcomeCards.js` + `check-tailoring.mjs`.
  - Delete dead code (§10).
  - Seen-set v2 key + seeding function (not wired yet). **Add `'@cth_guide_seen'` to `PREFIXES` in `src/logic/prefsSync.js`.**
- **Works before later phases:** yes, nothing visible changes.
- **Accept:**
  - The app behaves the same.
  - A deliberately bad `go:'Nope'` fails the check.
  - An old `active_widgets` fixture with renamed keys (including `wayfinder`) reconciles without losing order.
  - `navigate('PlannerScreen', {date})` still works.
  - `isSyncedPref('@cth_guide_seen_v2_x')` is true.
- **Rollback:** revert the PR; no data written.
- **Risks:** alias gaps cause silent no-op navigation, so the route check must scan `src/data/objectives.js`, `firstGoalGuide.js`, `openTarget.js`, `src/logic/searchIndex.js`, `src/data/experienceStages.js` and `src/data/featureCatalog.js`.
- **Built (2026-10-21, branch `feature/shakeup-p0`).** Where the code settled something this plan left open:
  - **Aliases** live in `src/logic/routeAliases.js` (no imports). One only resolves once its target is registered **and** its `gate` is on, so `PlannerScreen → Home` waits for `setAliasGate('dashboardV2', true)` in P3, and `Profile`/`Stats → You` and `Compass → PathScreen` wait for those routes. A target not yet registered needs a `phase`.
  - **Route check** (in `check-tour-spots.mjs`) also scans every literal `goToScreen`/`navigate` call, `SCREEN_HELP`, `STARTER_FEATURES`, and keeps `appRoutes.js` `ROOT_SCREENS` equal to App.js's root stack (the ConnectedApps bug class). It found exactly the 3 dead search rows, plus the same 3 dead `STAGED_SCREENS` entries, now removed.
  - **Widgets:** `WIDGET_DEFS`, `WIDGET_BLURBS`, `NEW_WIDGETS_SHOWN`, `PLANNED_WIDGET_KEYS` and `WIDGET_ALIASES` are in `src/data/dashboardWidgets.js`; the reconcile is pure in `src/logic/widgetLayout.js` (tested in `check-wiring`). `focus` and `activities` alias to **`yourDay`** and `desk` to **`deliverable`**, so their saved places survive; `wisdom` is `null` (retired). A planned key leaves `PLANNED_WIDGET_KEYS` in the PR that adds it to `WIDGET_DEFS`.
  - **Ids (stored, never rename):** starting points `highSchool · working · ged · unsure`; shakiest `love · goodAt · needs · paid · ground`; paths `like · next · money · career · ground`.
  - **`derivePersona`:** a business Build wins over the starting point (a choice they made beats where they start), so a working adult who builds a business is `ENTREPRENEUR`. Flip the first line if the founder reads §7.2's table top-down instead.
  - **"Add plan"** in §8.2's FAB column is the `calendar` action (it opens Today's week to plan).
  - `tailoring.js` imports only `pathKits.js` and `derivePersona.js`, which import nothing; the check swaps them in (the `check-builds` pattern). `welcomeCards.js`, `derivePersona.js`, `pathKits.js`, `routeAliases.js` and `guide/surfaces.js` have no imports.
  - **Seen-set v2:** `src/logic/guide/surfaces.js` (`SURFACES`, `ROUTE_TO_SURFACE`, pure `seedGuideSeen`) and `src/logic/guide/seenSet.js` (`@cth_guide_seen_v2_<uid|guest>`, `seedGuideSeenOnce`), not wired. `learn.unit` is the only surface an existing account isn't seeded with.
  - `npm run check` is now 19 scripts (`check-tailoring.mjs` added).

### P1 · Planner extraction + one data hook + guest planner

- **Goal:** split the 1,911-line Planner and stop four "today" queries from disagreeing. Give guests a planner (the welcome lands on it).
- **Work:**
  - Split `src/screens/PlannerScreen.js` into `src/screens/today/`: `DayView` (DailyPage), `TimeView`, `ListView`, `DueList`, `WeekView`, `MonthView`, `InstanceModal`, `SidePanel`, `AgendaRow`, `PlannerHeader`, `PlannerOptions`.
  - Add `useDayPlan`, with `TodayCard` and `CalmWeek` reading it.
  - `plannerService` storage adapter (`@cth_local_agenda`) + remove `PlannerScreen` from `ACCOUNT_ONLY_SCREENS`.
  - Debounce `syncPlansToPhone`.
- **Works before later phases:** yes; `PlannerScreen` still renders the same screen from the split parts.
- **Accept:**
  - **All 5 add flows** work as before and fire `signalAction('planner-item-added'[:area])`: **InstanceModal (+ Add), tap an empty slot, `PlannerQuickAdd`, `SidePanel` ideas, `FillWithAIButton`**.
  - The filter, views, params, reminders, repeats, links (class/game/quest/project), duration, phone sync, .ics, duplicates and weekly review work as before.
  - TodayCard and the Planner show the same items.
  - A guest can add, tick and delete a local plan.
- **Checks:** `check-planner` extended to `useDayPlan` merging (`layoutDay`, `hourRange`, `duplicateIds`, `isSamePlan` exports unchanged).
- **Rollback:** the old `PlannerScreen.js` is kept on a branch tag; the guest adapter is behind `ACCOUNT_ONLY_SCREENS` (re-adding the entry turns guests back to SignInPrompt).
- **Risks:** a big file move. Profile scoping (`useViewScope` `planner` vs `calendar`) must survive.
- **Built (2026-10-21, branch `feature/shakeup-p1`, on top of P0; tag `planner-pre-split` marks the old file).**
  - `src/screens/today/` holds the parts (plus `EventsList`, `plannerShared`); `PlannerScreen.js` is the state and wiring (1,911 → ~440 lines).
  - **One read:** pure `src/logic/dayPlan.js` (normalise, merge, group, `splitDue`) and `src/logic/useDayPlan.js` (`loadDayPlan` + the hook). Day, Week, Month and `CalmWeek` use the hook; **Home calls `loadDayPlan`** and keeps its own cache and instant ticks around it (6 queries became 1). The Planner's Day and Week now show **calendar events** (they never did); Calm's week now shows **project deadlines** (it only had plain tasks). Home still lists earlier not-done deadlines inline as "Late"; the Planner keeps them in its backlog card. Assignments stay off (`[]`) until P11.
  - **Guests:** `src/logic/agendaRows.js` (pure) + `src/api/localAgenda.js` (`@cth_local_agenda`, serialised writes). plannerService sends no-`userId` reads and `local-` ids there; new `insertInstances`, `updateInstance`, `findPlansOn`, `getScheduledTitles` replace the direct writes in InstanceModal and quick add. A guest's ⋯ hides Add from ideas and Weekly review; Phone calendar opens a sign-in sheet; Fill with AI and the check-in are hidden. Home's Today shows a guest's plans too.
  - **Signals:** "Add from ideas" and Fill with AI never fired `planner-item-added` before; both do now, so all 5 add flows count for goal steps.
  - **Phone sync:** `syncPlansToPhoneSoon` (`src/logic/coalesce.js`): a burst is one sync 1.5 s after the last, never two at once.

### P2 · Welcome before login + slim onboarding + carry-over

- **Goal:** requirement 2, and vision §6 / §16 "Now".
- **Work:**
  - `Welcome` route + `welcomeCards.js` + `@cth_welcome_v1` (with `guest`).
  - "A page about you" in guest mode, Unit 1 **hard-coded** to it, with the hand-written `welcomePage` lesson on `startLesson`.
  - Boot rewrite (§7.2), including `guest: true` and the timeout/error paths. LoginScreen's guest button writes `guest: true`.
  - Slim `MultiStepOnboarding` (consent + name).
  - `finish()` + `claimLocal()`, including `homeView = 'calm'` and `metadata.shakeup_onboarded_at`.
  - The one-time "Pick your path" note for existing accounts.
  - A minimal guest-safe **You** (Dream + "A page about you" + "Save my progress") on the existing `Profile` route; remove `'Profile'` from `ACCOUNT_ONLY_SCREENS`.
- **Works before later phases:** the welcome lands on the **current Home in Calm**. The next step is the starter objective. The You page is the minimal version until P4/P6. The `unit1Done` flag waits for P6 to become a deliverable row.
- **Accept:**
  - Fresh install → welcome → finished page in under 2 minutes.
  - **Zero Supabase writes and no personal data in any request before signup.** Error reports (`src/logic/errorReporting.js`) and other non-personal calls are allowed but scrubbed of names, answers and Build content (check the network panel).
  - A guest relaunch lands on **Today, not Login**.
  - Signup carries the Dream, Build, plans and answers, and **points don't** carry.
  - New accounts start in Calm; existing accounts' view is unchanged.
  - Existing signed-in users never see the welcome.
  - "I already have an account" works.
  - An under-18 signup birth date goes through KWS consent before any write.
  - The welcome never asks for age; a guest never sees adult-only Finds.
- **Checks:** `check-pickables` (new step keys), `check-tailoring` (welcome gating), `check-dream`.
- **Rollback:** a `WELCOME_V1` setting (default on for fresh installs); off sends signed-out users to Login as today. The old wizard steps stay in the file for one release.
- **Risks:** COPPA/GDPR. `onboarding_completed` must keep its meaning. `finish()` side effects (`setExperienceMode`, `startFirstGoal`, `createMasterProfile`, `choosePurpose`) must all still run.
- **Gate:** **run the 5-person test (the first meetup)** with the Studio plan's 3 questions straight after this phase, before P3.

### P3 · Today = the Planner dashboard + Calm

- **Goal:** requirements 5 and 6.
- **Work:**
  - `DashboardScreen` on route `Home`: the fixed control row, then **one `WidgetBoard` with nothing pinned**: `nextStep` (+ Dream echo option; `nextStep.js` + `check-deliverables.mjs` for its pure rules), `quickAdd`, `yourDay`, `find`, the path widgets; the empty-board state; Week/Month with due chips.
  - Every row of §3.2, walked through `docs/shake-up-planner-parity.md`.
  - `PlannerScreen` redirect.
  - Fixed cards moved out.
  - `CalmToday` for Day/Week/Month, `homeView` widened to app-wide (hook default stays `'full'`).
  - FAB hidden on Today; "What's next?" in Today ⋯; FAB `calendar` → Today → Week.
  - Retire `CalendarModal` and move its 6 dependents (§3.4).
  - Register every new widget key in `BASE_WIDGETS` or a pickable.
  - Update tour steps that point at moved spots: the welcome tour's `fab` step goes to `planner-add`. Keep the ids `planner-add`, `planner-views`, `home-compass` (move it onto the next step) and `nav-tabbar`.
  - Ship behind setting **`DASHBOARD_V2`**: on when `metadata.shakeup_onboarded_at` is set (and for guests from the welcome), opt-in from Make it yours for existing accounts for one release.
- **Works before later phases:** `nextStep` uses the current objective and due items; the `deliverable` and `money` widgets are hidden until P6 provides data.
- **Accept:**
  - Every line in `docs/shake-up-planner-parity.md` passes, and `check-planner` covers its pure parts.
  - Saved layouts migrate.
  - Calm and Full show the same items.
  - Old Planner links open Today on the right date.
  - `grep -rn CalendarModal src context App.js` returns only comments.
  - Week/Month still show every profile for people who had the calendar on "all".
  - Every old FAB action is reachable.
  - Phone sync runs at most once per change.
- **Checks:** `npm run check` (check-wiring, check-pickables, check-tour-spots, check-style on the new files).
- **Rollback:** `DASHBOARD_V2` off renders the old `HomeScreen` + `PlannerScreen`; both stay registered for one release.
- **Risks:** the main screen. Keep the HomeScreen 1003 rule (tours force Full) until P7, so old tours still find their spots.
- **Built (2026-10-22, branch `feature/shakeup-p3`, on top of P2).** Parity walked in `docs/shake-up-planner-parity.md`. Where the code settled something this plan left open:
  - **Today stays the `Home` route** (no `DashboardScreen`): `HomeScreen.js` renders the old Home or Today on `useDashboardV2()` (`src/logic/useDashboardV2.js`, rule in `welcomeCards.js` `dashboardV2On`). The Planner's state is one hook, `src/screens/today/usePlanner.js`, shared by Today and the old `PlannerScreen` (its sheets in `PlannerSheets`). New: `TodayControls`, `AddSheet`, `TodayWidgets` (Next step, Quick add, Your day, Still open, Due this week).
  - **Today's layout is its own setting**, `todayLayout:<profileId|guest>`, so Home's saved layout is untouched for the rollback. First open migrates the Home layout (`widgetLayout.js` `todayLayoutFrom`).
  - **`nextStep.js`** takes `now` (Right now) first, then the plan's order; claim, first goal and path fall back to CompassCard's own UI. `check-deliverables.mjs` covers it (`npm run check` is 20 scripts).
  - **Calm on Today** is `CalmHome` with `v2` (not yet renamed `CalmToday`): the same keys in the board's order, `CalmWeek` following ‹ ›, a month in Month, and another day's plan when you open one.
  - **The setting carries its last answer** to screens that mount later, and `PlannerScreen` waits for it, so an old link's params reach Today.
  - Moved: TodaysFind → Learn, StudioCard → Library (Full), DreamCard → You. "Missed" / "NOT DONE" → "Still open".

### P4 · Tabs, top bar, You shell

- **Goal:** requirement 7.
- **Work:**
  - Tab labels **Today · Learn · Make** (routes unchanged; Learn's label already exists). **Reorder the `Tab.Screen` children in App.js `MainTabs`** to Home · Training · Library; `initialRouteName` stays `Home`.
  - `LearnScreen` as the `TrainingHome` root, with `GamesScreen` → `Practice`.
  - `LibraryScreen` renders Make, `CalmLibrary` renders Calm Make. Find → Learn, Life → You, Tools split (§2.1). `gatedScreen` wrappers kept on every route.
  - New TopBar (avatar, path chip, unit bar, search, bell). The chip and bar use the active objective until P6.
  - `You` route as the full-screen dropdown (`Profile` renders it too), guest-safe.
  - CrestMenu items move to the You footer, plus "What's next?".
  - Search index repointed.
  - Family/Org rows hidden while off.
- **Works before later phases:** yes, with objective-based chip/bar and the P2 You content.
- **Accept:**
  - Every old Library/Learn screen is reachable within 2 taps, or through search.
  - `navigate('Profile')` opens You, signed in or as a guest.
  - Tool-screen back behaviour is unchanged (`libraryStackRouter`).
  - No horizontal scroll on web.
  - `nav-tabbar` and the TourOverlay tabbar navHint still work in the new order.
  - No locked screen is reachable unwrapped.
- **Checks:** `check-search`, `check-tour-spots`, `check-syntax`.
- **Rollback:** a `TABS_V2` setting restores the old order, the old TopBar and the Profile screen for one release.
- **Risks:** habits change. `NO_TOPBAR_ROUTES`, `NO_FAB_ROUTES`, `WORKSHOP_SCREENS` sets. Web title formatter. The `RewardToast` `hideCoins` prop (App.js 584) stays (coins are kept).

### P5 · Cut the strings: progress rework + room

- **Goal:** requirements 3 and 4.
- **Work:**
  - Remove LV/PTS, crest, strip and streak copy. Add momentum.
  - Retire `LevelUpNotification` → quiet mentor-line toast. `UnlockNotification` → "Your map got bigger". Mentor-line `RewardToast`.
  - **Keep the pet system as it is** (care, hunger, feeding, coins, bonus items, daily gift). Move the spendable points display from the top bar into the pet sheet and room editor. Check pet copy for the mentor voice.
  - Keep `lazy:false` on `Training` and the `hideCoins` prop (coins stay mounted at launch).
  - Open all outfit, backdrop and decor cosmetics (pets keep `petsOpen`).
  - Remove the point badges (milestones come in P6).
  - Leaderboard flag off.
  - Retire Challenges, after rewriting `objectives.js:322` (id `'mission'` kept, `auto` stat → Practice drills done) and its `AccessContext.js` counter.
  - `receipts.js` (Builds, steps, tastes).
  - `Room` + `roomPlace` (Today and You only) + `room` widget + `RoomEditorSheet`.
  - Tutorial copy about points/rank removed, with `training-stats` and `profile-rank` steps (`screenTutorials.js` 243) updated together.
- **Works before later phases:** yes. Receipts show what exists; hand-in XP waits for P6.
- **Accept:**
  - No screen shows points, rank or level in the chrome.
  - A grep for "keep it", "streak", "at risk", "PTS" and "level up" in `src/` finds no user-facing copy.
  - The pet still gets hungry, can be fed with points, finds coins and gives its daily gift, exactly as before.
  - A level-12 test account keeps every equipped item.
  - The room moves Today ↔ You and syncs across devices; Practice keeps its walking pet.
  - Calm shows a still room.
  - The Compass "Finish a daily drill" step ticks from a Practice drill.
- **Checks:** `check-pet-hunger` (files untouched, so green), `check-tour-spots`, `check-builds`.
- **Rollback:** a `PROGRESS_V2` setting restores the TopBar pill and toasts for one release (the SQL never changed).
- **Risks:**
  - The `UnlockNotification` level summary.
  - `useSpendablePoints` readers: TopBar loses its display; GamesScreen, Profile and PetCareSheet **keep working** (pet food).
  - `ChildProgressScreen` and the cohort leaderboard still read points, and that is fine until Family v2.

### P6 · Paths, units, deliverables, Learn, Make, You content

- **Goal:** requirement 8 (the school feel) and the full ikigai You page.
- **Work:**
  - Path purposes + unit objectives in `objectives.js` (**new ids only, never rename**), including the **Ground fix** units.
  - `pathKits.js` filled in (§8.2, including the Ground fix row).
  - `PathScreen`, `UnitScreen` (4 beats + Hand it in + self-check).
  - Map card template (O\*NET/BLS) and the What's next map.
  - `deliverables.js` + `deliverableService` + migrations `builds`, `deliverables` (with `feedback jsonb`), `life_area_ratings` (RLS owner, added to `src/api/dataExport.js`).
  - Builds upload; convert the welcome's `unit1Done` flag into a deliverable row.
  - `money`, `resume`, `plan` Build kinds.
  - Make board.
  - Showcase unlock change.
  - `deliverable`/`unit`/`dueSoon`/`money` widgets switched on.
  - `nextStep` priorities 1–2 use deliverables and units.
  - **`HandInMoment.js`**, **milestones**, unit trophies, and migration **`record_action_work`** (§6.1).
  - `IkigaiCircles` + full `YouScreen`.
  - Open Source Credits screen.
- **Accept:**
  - A Money on my own user finishes Unit 2, and the money sheet shows on Make (Handed in), Showcase, Today (Due → done) and Receipts.
  - A "The ground" user rates an area, plans one fix, re-rates, and hands in "My reset plan".
  - XP arrives for hand-ins, and the daily cap holds.
  - Each path shows `nextStep`, `yourDay`, `find` + ≤4 path widgets by default, every one hideable, and the right shelves.
  - One active unit at a time.
  - The 4 circles reflect real sparks, receipts, values and careers.
  - The data export includes the new tables.
- **Checks:** `check-builds` (new kinds × options), `check-quests`, `check-deliverables`, `check-tailoring`, `check-link-sources` (licences), `probe-security` review of the migrations.
- **Rollback:** deliverables are an overlay; hiding the Make board and the new widgets falls back to P5 behaviour. Migrations are additive and can stay.
- **Risks:** content volume (sources and review dates). Objective step ids stored in `user_objectives.steps`. The unique active index. Hand-applied SQL.

### P7 · Guide redo

- **Goal:** one guidance voice, calm-native.
- **Work:**
  - `useGuide`, `surfaces.js`, the seen-set v2 seed wired.
  - Mentor notes for every surface.
  - First-day walk.
  - Generated guided units + quiz step; replace the hand-written welcome lesson.
  - Your character as the guide.
  - Calm TourSpots + Calm notes, and **remove the HomeScreen 1003 rule**.
  - Retire `tourSteps.js`, `src/logic/screenTutorials.js`, `widgetIntros` (update `check-wiring` to stop requiring it), GettingStartedCard, `useWelcomeTour`, `useFirstVisitTutorial`.
  - **"About this page"** (§7.3): `src/data/pageInfo.js` for every surface, the TopBar "Screen Tutorial" item renamed and repointed, `screenHelp.js` folded in.
  - Reword Help and Settings "Replay Tutorial".
- **Accept:**
  - A new account gets the first-day walk once.
  - An upgraded account gets **no** re-teaching.
  - Notes seen on device A don't re-show on device B.
  - At most 1 automatic note per session.
  - Calm users are never flipped to Full.
  - Every `go` resolves.
  - "About this page" opens on every front surface, with relevant, tailored info and working action buttons; no old tour copy remains.
- **Checks:** `check-tour-spots` (ids + routes + surfaces + `pageInfo`), `check-wiring`.
- **Rollback:** `SCREEN_TUTORIALS_ENABLED` off silences all automatic notes; the old tour files stay registered for one release.
- **Risks:** objective signals that never tick leave the guide waiting forever, so every unit step needs a signal or `auto` rule (checked in `check-deliverables`).

### P8 · Share v1 (files + links) + feedback v1 (everyone)

- **Work:** **share links** (`share_links` table as a new hand-applied migration + the read-only `/s/<token>` viewer on the Expo web build, 18+, revocable), `renderShowcase()`, "Share my work", picture card, "Ask for feedback", **"Feedback I got"** notes on every deliverable (who / said / change / I changed it), feedback counts on cards and in Receipts, Take it home on every deliverable, `portfolio.js` share text.
- **Accept:**
  - The Showcase file opens offline with no level/XP header.
  - It works for under-18s (export only; feedback notes stay private).
  - An adult's link opens read-only in any browser, and revoking it stops it at once.
  - A minor cannot create a link.
  - A feedback note saved as a guest survives signup, and "I changed it" shows in then vs now.
- **Checks:** `check-builds` covers `renderShowcase`; `check-deliverables` covers the feedback shape; `probe-security` and an RLS review on `share_links`.
- **Rollback:** hide the share and feedback buttons; revoke all links by setting `revoked_at`; the column stays.

### P9 · Visual kit on the front screens

- **Work:** `src/ui/` primitives. Move the front screens onto them. Extend `check-style`.
- **Accept:** 0 inline hex colours in the front files. Skeletons instead of spinners. `check-a11y` clean.
- **Rollback:** per-screen revert; the kit is additive.

### P10 · Drag to reschedule (optional)

- **Work:** long-press drag in Day (time) and Week (day) using `react-native-gesture-handler`, reusing the `src/logic/plannerLayout.js` math.
- **Accept:**
  - A drag calls `rescheduleInstance` (the same path as "Pick a day") and respects series rules.
  - Undo works.
  - "Pick a day" remains the a11y alternative.
- **Checks:** `check-planner` (drop math).
- **Rollback:** a setting turns drag off.
- **Risk:** conflicts with `WidgetBoard` drag. Long-press goes on items only.

### P11 · School on (after the first meetup)

- **Work:**
  - Assignment migration + `assignment_submissions` + `deliverable_feedback` (replaces manual entry for in-app reviewers).
  - Teacher grid.
  - "My class" in You.
  - Family v2 RPC.
  - `organization` from `place:'off'` → `'background'`.
- **Accept:**
  - A mentor leaves *looks good / try this*, and the student sees it on Today and in the deliverable's feedback list.
- **Checks:** `probe-security`, RLS review.
- **Rollback:** `organization` back to `place:'off'`.
- **Risks:** SECURITY DEFINER RPCs as **new** migrations only. Moderation on feedback text.

---

## 12. Must not break

| Kind | Keep working |
|---|---|
| **Route names** | `Home`, `Library`, `LibraryScreen`, `Training`, `TrainingHome`, `MainTabs`, `PlannerScreen` (redirect), `Profile` (renders You), `Compass`, `Stats`, `ProjectsScreen`, `KnowledgeScreen`, `CaptureInbox`, `StudioScreen`, `BuildScreen`, `PortfolioScreen`, `ClassesStack` and its screens (`check-wiring` needs `CLASS_SCREEN_MAP`), `MultiStepOnboarding`, `Login` |
| **Route params** | `editInstance`, `review`, `date`, `addFor` on the Planner |
| **Supabase** | `profiles.onboarding_completed` (boot), `profiles.metadata.track/picks`, the protected `xp/points/level/streak*` columns, `agenda_instances.link_type/link_screen` (including `'quest'` links, resolved through `getQuest`), `user_objectives.steps` + the one-active index, `feature_unlocks` feature ids, `persona_profiles.active_widgets`, `user_settings.home_widget_layout`, `pet_care`, `point_spends`, quest ids, objective step ids (e.g. `'mission'`) |
| **Device / synced keys** | `homeView` (hook default stays `'full'`), `libraryView` (read once), `homeBackground`, `hideDoneWidgets`, `@cth_planner_time_mode`, `@cth_planner_week_layout`, `@cth_cache_characterLoadout` (prefsSync `EXACT`), the prefsSync `PREFIXES` `@cth_setting_`, `@cth_screen_tutorials_seen`, `@cth_widget_`, `@cth_experience_stage_seen` (+ the new `@cth_guide_seen`), `@cth_onboarding_draft`, `@cth_builds_<uid|guest>`, `@cth_screen_tutorials_seen_<uid>` (read once for the v2 seed), `@cth_welcome_tour_<uid>`, `@cth_setting_tourSeen`, `@cth_setting_screenTutorialsEnabled`, `useViewScope` ids `planner` and `calendar`, `guest_progress` (still never carried) |
| **Tours** | TourSpot ids `planner-add`, `planner-views`, `nav-tabbar`, `home-compass` (until P7), plus every id still referenced by live content. `startTour` / `startScreenTour` / `startLesson` signatures |
| **Signals** | `signalAction('planner-item-added'[:area])` from all 5 add flows, `build-exported`, the objective `auto`/`signal`/`have` rules |
| **Checks** | All 18 scripts in `npm run check`. Markers parsed by scripts: `const WIDGET_DEFS = [` … `const WIDGET_KEYS`, FAB `ACTIONS = [`, the onboarding step keys. The `BASE_WIDGETS` / pickables ownership rule |
| **FAB** | All 7 actions reachable (§2.4); the 4 position options |
| **Web** | The `forShiftWeb` 50px fix (App.js 140-153), the document title formatter |
| **Safety** | Age gate + KWS consent before any personal write. Under-18: export only, no public publishing. `communityAccess()`, mentors refuse minors |

---

## 13. Key files to start from

| | |
|---|---|
| **Navigation / boot** | `App.js`, `src/logic/appRoutes.js`, `src/logic/navRules.js`, `src/components/TopBar.js`, `src/components/FloatingActionButton.js`, `src/screens/library/LibraryNav.js`, `src/screens/TrainingNav.js`, `src/screens/LoginScreen.js` |
| **Today** | `src/screens/PlannerScreen.js`, `src/screens/HomeScreen.js`, `src/components/CalmHome.js`, `src/components/CalmKit.js`, `src/components/CalmWeek.js`, `src/components/CalmLibrary.js`, `src/components/WidgetBoard.js`, `src/components/CalendarModal.js` (+ its 6 dependents, §3.4), `src/api/plannerService.js`, `src/logic/plannerLayout.js`, `src/logic/useViewScope.js`, `src/data/pickables.js` |
| **Progress / room** | `context/UserProgressContext.js`, `context/AccessContext.js`, `src/logic/gamificationService.js`, `src/logic/useCharacterLoadout.js`, `src/logic/useCoinRewards.js`, `src/logic/useBonusRewards.js`, `src/components/CharacterWalker.js`, `src/components/StudioStage.js`, `src/components/RewardToast.js`, `src/screens/ProfileScreen.js`, `src/screens/GamesScreen.js`, `src/data/petOptions.js`, `src/data/characterOptions.js`, `src/data/backgroundOptions.js`, `src/logic/prefsSync.js` |
| **School** | `src/data/objectives.js`, `src/data/experienceStages.js`, `src/data/featureCatalog.js`, `src/logic/builds.js`, `src/logic/buildRender.js`, `src/logic/studio.js`, `src/api/buildService.js`, `src/api/dataExport.js`, `src/screens/library/portfolio.js` |
| **Guide / welcome** | `context/TourContext.js`, `src/components/TourOverlay.js`, `src/logic/screenTutorials.js`, `src/data/guides.js`, `src/data/widgetIntros.js`, `src/screens/MultiStepOnboarding.js`, `src/screens/onboarding/steps.js`, `src/api/onboardingService.js`, `src/logic/errorReporting.js` |
| **Checks** | `scripts/check-tour-spots.mjs`, `scripts/check-wiring.mjs`, `scripts/check-pickables.mjs`, `scripts/check-style.mjs`, `scripts/check-planner.mjs`, `scripts/check-builds.mjs`, `scripts/check-pet-hunger.mjs`, `package.json` (line 11) |

---

## Founder answers (2026-10-21)

All answered. Kept as planned unless noted.

1. ✅ **You as the top-bar dropdown, with Today · Learn · Make as the tabs.** Is that the right fourth "tab", or should You be a tab and Make move into Learn? — **kept as this plan says** (founder, 2026-10-21).
2. ✅ **Tab name:** Learn (this plan, and today's label), Explore, or Path? — **kept as this plan says** (founder, 2026-10-21).
3. ✅ **Default room placement:** You (this plan) or Today? — **kept as this plan says** (founder, 2026-10-21).
4. ✅ **Calm as the default for new accounts?** (This plan says yes, with Full kept. Vision §11 had said Calm becomes the only Home.) — **kept as this plan says** (founder, 2026-10-21).
5. ✅ **Brand base:** warm light paper with the Calm panel as the accent (this plan), or Calm-dark? — **kept as this plan says** (founder, 2026-10-21).
6. ✅ ~~Pet care game~~ — **kept as it is**, the whole pet system (founder, 2026-10-21).
7. ✅ **Momentum:** a quiet line in Full Receipts with a switch to hide it (this plan), off by default, or gone? — **kept as this plan says** (founder, 2026-10-21).
8. ✅ **Opening every cosmetic** for everyone: OK, or keep a few items earned by units? — **kept as this plan says** (founder, 2026-10-21).
9. ✅ **Welcome timing:** right after the guardrails (P2, this plan, following ✅ vision §16), or after the new surfaces? Choosing "after" overrides a ✅ decision. — **kept as this plan says** (founder, 2026-10-21).
10. ✅ ~~Age bands~~ — replaced by **"Where are you in life?"**; age only at signup (founder, 2026-10-21).
11. ✅ ~~Fourth starting point~~ — **"Not sure / something else"** added, leads to What do I like? (founder, 2026-10-21).
12. ✅ **Unit lists and welcome wording** (§4.2, §7.2): the founder reviews them, with sourced facts, **before P6 ships**. Build with the draft text until then.
13. ✅ **Deliverable status words:** "Handed in" (school feel) or "Done"? — **kept as this plan says** (founder, 2026-10-21).
14. ✅ ~~Share links~~ — **kept, ship in P8**, 18+ (founder, 2026-10-21).
15. ✅ ~~"Always there" core~~ — **nothing pinned; Today is all widgets** (founder, 2026-10-21).
16. ✅ **Screen Tutorial** — replaced with relevant **"About this page"** info (§7.3) (founder, 2026-10-21).
