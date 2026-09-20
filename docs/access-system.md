# What someone can see and use: the four questions

Every tool, screen, game, widget, class subject and quick action in the app is
asked four questions, **always in this order**. Each question has one job and
one owner. A later answer never overrides an earlier one.

| # | Question | What decides it | Owner | If the answer is no |
|---|----------|-----------------|-------|---------------------|
| 1 | **Allowed?** | Age (birth date) and remote switches (`app_config`) | `src/logic/allowed.js` | Gone for this account: not in menus, search or links. SQL refuses it too. |
| 2 | **Which door?** | The feature's gate: Open, Earn, Plus or Labs | `src/logic/featureAccess.js`, `src/data/featureCatalog.js` | The item still exists, marked as a closed door that lists the keys that open it. |
| 3 | **Shown now?** | The stage on this account type's path | `src/logic/experienceStage.js`, `src/data/experienceStages.js` | "Not yet": left out of menus, but goal links still reach it. |
| 4 | **Kept?** | The person's own hide switches | each surface (widget layout, hidden Library sections, hidden life areas) | Turned off, and can be turned back on in Settings any time. |

`context/AccessContext.js` asks questions 1–3 once and every screen reads the
answer from it (`accessFor`, `isOpen`, `isScreenVisible`, `isGameVisible`,
`isSubjectVisible`, `can(cap)`). Don't answer these questions inside a screen.

## 1. Allowed?

- **Minor** means under 18 by birth date, or age unknown. That's the same test
  as the SQL `is_restricted_account()`. `profiles.is_minor` is the
  under-13 consent flag. It only drives the parent-consent flow, and never
  means "under 18" on its own.
- Content marked `adult: true` (the business-ownership and startup tracks in
  `classCatalog.js`) never shows to a minor. **Account type is not a safety
  rule.** Adult tracks used to be hidden only because minors can't pick
  Business.
- `disabled_games` (app_config) removes a game for everyone, even when it's
  asked for by name.
- Tailoring (which version of an action to show) uses `ageBandFor` in
  `profileResolver.js`. That's a different question and may fall back to the
  stored `age_category`. Safety never falls back.

## 2. Which door?

Every feature has exactly one gate:

| Gate | Keys that open it |
|------|-------------------|
| `open` | none needed |
| `locked` (Earn) | finish one of `unlockedBy`, **or** pass its test-out once, **or** a Settings switch named by `settingKey` (Educator Mode opens the Lesson Builder) |
| `paid` (Plus) | an active plan |
| `experimental` (Labs) | the Experimental Features switch |

- A test-out is a second key to an Earn door, not a separate layer.
- Something earned is never taken back.
- **A door with no working key is never shown.** Plus doors stay out of sight
  until the `plus_on_sale` app_config row is enabled. Labs doors stay hidden
  until the switch is on.
- The database re-checks every unlock (`unlock_feature`, `complete_objective`,
  `record_test_attempt`). The app only explains the doors; it doesn't
  enforce them.

## 3. Shown now?

The app opens a little at a time. Each account type walks its own **path of
ten small stages** (`PATHS` in `experienceStages.js`). **Each goal finished
and each level gained opens the next stage.** Every stage adds one tool, a few
games, or a widget or two.

- **Account type decides which things come first. Progress decides how many
  are open.** Account type is never a gate. Switching type changes what's on
  the map, never what you're able to open.
- The first five stages are specific to each type. The last five open four
  bigger things, called caps:
  `all-games` (every game, plus filters and the Progress tab), `dashboard`
  (your type's full dashboard, the widget editor, every quick action, the
  Getting Started card), `all-tools` (every open tool, other types' classes
  under "Other tracks", extra profiles, the leaderboard) and `doors` (locked
  tools and their keys, Labs, Plus once it's on sale, every widget).
- **Always shown**, whatever the stage: anything already opened, and anything
  the goal in flight opens.
- Hiding never locks. A hidden tool is still reachable from a goal's "Open"
  button.
- "Show everything" jumps to the last stage. It's saved on the account
  (`profiles.show_everything`), with a copy on the device.
- The stage is worked out from progress, not stored.

### The first goal is guided

Onboarding starts the account type's first goal (`FIRST_GOALS`). The guide
walks through it one step at a time (`src/logic/useGuidedFirstGoal.js`,
scripts in `src/data/firstGoalGuide.js`):

1. It says what's next, then takes the person there.
2. It lights up the control they need.
3. It steps aside while they use it.

Each step **ticks itself** when the thing is done. The step's `signal` is sent
by the screen through `signalAction`, or its `auto` counter moves. While the
guide is on, screens don't run their own first-visit tutorials. "Not now"
pauses the guide until the person is back on Home. Pressing it twice turns the
guide off, and the Compass card's "Show me how" brings it back.

Every first-goal step must point at something stage 1 of that type shows.

## 4. Kept?

The person's own choices: hidden or reordered Home widgets, hidden Library
sections, active life areas, tutorials turned off. These can only hide
things from what question 3 shows, and every one of them can be undone in
Settings.

## Not part of this system

- **Rewards**: outfits, pets and backgrounds earned by level, points or rank
  (`src/logic/unlockUtils.js`). Call them rewards, not unlocks.
- **Roles inside an organization**: owner, manager or member. These are
  permissions inside one feature.
- **Purpose**: it only changes the order of things (`rankForPurpose`) and never
  hides anything.

## Adding something new

1. Is it unsafe for some ages? Mark it (`adult: true`) or give it age bands.
   That's question 1.
2. Does it need to be earned or paid for? Give it a gate in `featureCatalog.js`
   (question 2). Otherwise it's `open`.
3. When should it appear? Put it on a stage in `experienceStages.js`
   (question 3). If you leave it out, it appears with `all-tools`.
4. Don't add a fifth question. If something doesn't fit these four, it belongs
   in one of the "not part of this system" areas.
