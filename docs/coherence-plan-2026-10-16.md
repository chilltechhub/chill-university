# Coherence plan — 2026-10-16

Goal: **one app, not 26 features.** Fewer places to set things, and parts that update each other.

## 1. One place to shape the app

**Make it yours** = everything about *what's in the app and how it looks*.
**Settings** = only *account, privacy, notifications, help*.

| Today (Settings) | Change |
|---|---|
| Show everything now | **Remove.** Same setting as Make it yours → How you start → **All in**. Its off-switch also dropped you onto Level up even if you were on Just my picks. |
| Experimental Features | **Remove.** Same thing as the **Labs** pick in My features. |
| Teacher / Educator Mode | **Remove.** Same thing as the **Lesson Builder** pick. |
| Calm Home / Calm Library, emoji, subtext, profile-card buttons, finished cards step aside, backgrounds | **Move** to Make it yours → What you see. Settings keeps a one-line link. |

**Add to Make it yours** (built since it was made, never listed):
- **Pet & character**: **Decorate**, backgrounds, tap-avatar behaviour
- **Reminders**: daily nudge, pet hungry nudge

## 2. Merge features that do one job

| Merge | Why |
|---|---|
| **AI Import → Fill with AI** | AI Import needs the `parse-import` server function, which is **still 404**, so the Plus perk doesn't work. Fill with AI does the same job **free** and works today. ⚠ Changes what Plus sells. |
| **Import Hub + Fill with AI** → one **"Bring stuff in"** entry (paste lists · files · with AI) | Three import doors today, two in the Inbox and one in the Library. |

## 3. Make parts talk

| When you… | Today | After |
|---|---|---|
| Tick a **project work session** in the Planner | Nothing on the project | Project log gets **"Worked 45 min"**, and the project moves to the top of "Pick up where you left off" |
| Finish a goal whose steps used a tool you **didn't pick** (teen account: Planner) | The tool shows during the goal, then hides again, with the study block you made in it | The end-of-goal card offers it first: **"Keep Planner? You used it for this goal."** Still only on a yes, as Just my picks promises |
| Finish a **Work Mode** session | Time saved without its name | The name is saved, so Insights can say what you worked on |

## Not merging (on purpose)
- **Idea Garden / Projects / Inbox ideas**: different stages of the same idea, and already linked.
- **Planner / tasks / project steps / calendar**: different tables, but Planner and Home already show them in one list. Merging the tables is a big data migration with no visible gain.
- **Insights / Weekly Review / Stats**: already one screen (Stats is titled Insights).

## Status
Built 2026-10-16 (OK given for the Plus change). Also found on the way:
- **Library Sections** (Settings) hid the same 8 tools My features does → removed; My features is the one switch.
- Life areas changed in Settings never refreshed Home/Library until a reload → the Make it yours chips refresh at once.
- Work Mode names need `20261016120000_timer_session_label.sql` run by hand; until then sessions save without the name, as before.
