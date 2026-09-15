# ChillTech Hub

A daily learning and life-organization app for students and adults, built with
Expo / React Native and Supabase.

## Running it

```bash
npm install
npx expo start
```

Requires a `.env` with:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Layout

| Path | What lives there |
| --- | --- |
| `App.js` | Navigation tree, auth/onboarding routing, app-launch side effects |
| `context/` | Cross-app providers — theme, user progress, remote config, tour |
| `src/screens/` | Screens, grouped by area (`library/`, `classes/`, `family/`, `organization/`) |
| `src/components/` | Shared UI and the training mini-games |
| `src/api/` | Supabase access, one module per domain |
| `src/logic/` | Pure logic and hooks — gamification, scheduling, dates, parsers |
| `src/data/` | Static content and catalogs — including the Wayfinder's `featureCatalog.js`, `objectives.js` and `competencyTests.js` |
| `supabase/` | SQL migrations and edge functions |

## Things worth knowing

- **Dates.** Anything with a daily cadence (focus, missions, streaks, planner,
  due dates) must use `src/logic/dateUtils.js`, not `toISOString()`. ISO strings
  are UTC, so "today" flipped mid-afternoon or mid-morning depending on the
  user's timezone.
- **Streaks.** `profiles.streak_count` / `profiles.last_active_date` are the
  only source of truth, and `gamificationService.touchStreak()` is the only
  writer. It's called once per profile load from `UserProgressContext`.
- **Remote content.** Quotes, class metadata, pets and backgrounds are served
  from Supabase (`app_content`, `app_config`) so they can change without a
  build. Every one falls back to a local default.
- **Offline.** Reads are cache-first via `src/api/offlineCache.js`; writes made
  offline are queued and flushed on next launch from `App.js`.
- **Wayfinder.** The app is large enough that showing all of it at once is the
  same as showing none of it. So each account picks one *purpose*
  (`profiles.purpose_key`) and runs one *objective* at a time
  (`public.user_objectives`, single-focus enforced by a partial unique index).
  Every gateable surface is listed once in `src/data/featureCatalog.js` with a
  gate: `open`, `locked` (finish an objective — or pass its one-attempt
  competence check), `experimental` (opt-in, genuinely unfinished) or `paid`.
  `src/logic/featureAccess.js` is the pure gate logic and mirrors the SQL;
  `context/AccessContext.js` holds the state; `src/components/FeatureGate.js`
  applies it to a tile (`useFeatureGate`) or a whole route (`gatedScreen`).
  Adding a gate is one catalog entry — do not scatter `if (unlocked)` checks.
