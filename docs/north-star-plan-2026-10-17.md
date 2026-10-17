# North Star plan · 2026-10-17

Goal: bring **every screen** in line with [north-star.md](north-star.md). Three phases. Each one gets its own OK.

Not in this plan (already planned elsewhere):
- **Settings vs Make it yours**, where the reminder switches live: [coherence-plan-2026-10-16.md](coherence-plan-2026-10-16.md)
- **Then vs now** (life-area rating history): its own task

## The 6 biggest gaps

| # | Gap | Where |
|---|---|---|
| 1 | **No dream anywhere.** The app never asks for the life someone wants. | Onboarding asks which tool path: `steps.js:350` |
| 2 | **The streak is the loudest number.** Home, Calm Home, Training, Profile, Family, 3 badges, a 9:30pm reminder. | `HomeScreen.js:2081`, `notificationScheduler.js:150` |
| 3 | **Level + points on every screen**, above anything they're working toward. | `TopBar.js:181` |
| 4 | **Values and "Who I'm becoming" stay inside Wayfinder.** Business and Entrepreneur Home never shows them. | `WayfinderWidget.js:101`, `personas.js:94,110` |
| 5 | **Gaps get counted:** MISSED, late, slipped, quiet for 12 days. | `PlannerScreen.js:729`, `notices.js:170` |
| 6 | **A finished goal gets a feature offer**, not a word about what they did. | `UnlockNotification.js:137` |

**Already right** (keep it):
- **Wayfinder**: small experiments, never "what's your passion". Its **"Who I'm becoming"** stems (`wayfinder.js:446`) are the seed of the Dream layer.
- **Project why box**: "Why this project matters to you", in their words (`ProjectOverview.js:164`). One tap deep.
- **Classes L0 money modules**: how the system works, told through regular people (Andre, Keisha, Dani).
- **Insights**: "Done this week", their own numbers, no missed-day counts.
- **Planner catch-up**: Today · Tomorrow · Pick a day · **Drop**.
- **Daily Reminders are off by default** (`SettingsScreen.js:296`).

## Screen test scores

✓ passes · ~ partly · ✗ fails. The [6 questions](north-star.md#the-screen-test): **1** capable · **2** cuts strings · **3** why · **4** bursts · **5** their want · **6** stronger.

| Surface | 1 | 2 | 3 | 4 | 5 | 6 | Worst line |
|---|---|---|---|---|---|---|---|
| Onboarding | ✓ | ✓ | ~ | ✓ | ~ | ✓ | "What did you come here for?" picks a tool path |
| First goals | ✓ | ~ | ~ | ✓ | ✗ | ~ | "Earn 250 points · Evidence that you kept at it." `objectives.js:400` |
| Home | ~ | ✗ | ✗ | ~ | ~ | ~ | "🔥 12 day streak", top right `HomeScreen.js:2081` |
| Calm Home | ✓ | ~ | ✗ | ~ | ✓ | ✓ | "Do one thing today" `CalmHome.js:230` |
| Top bar | ~ | ✗ | ✗ | ✓ | ✗ | ~ | "LV 4 · 120 PTS" on every screen `TopBar.js:181` |
| Projects | ✓ | ✓ | ~ | ~ | ✓ | ✓ | "3 days late" `ProjectDetail.js:61` |
| Planner | ✓ | ✓ | ✗ | ✗ | ✓ | ~ | red "MISSED" `PlannerScreen.js:729` |
| Bell (notices) | ✓ | ~ | ~ | ~ | ✓ | ✓ | "has been quiet for 12 days" `notices.js:170` |
| Phone reminders | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | "🔥 Streak at risk" `notificationScheduler.js:150` |
| Celebrations | ~ | ~ | ✗ | ✓ | ✗ | ~ | "Quest Complete!" `GameOver.js:38` |
| Tutorials | ✓ | ~ | ~ | ✓ | ~ | ~ | "The streak is the one that matters." `screenTutorials.js:50` |
| Streaks + badges | ~ | ✗ | ✗ | ✗ | ✗ | ✗ | "Unstoppable: reach a 30-day streak" `badgeDefinitions.js:20` |
| Pet | ✓ | ✗ | ✗ | ~ | ~ | ✗ | "Feed it now for double bond." `notificationScheduler.js:239` |
| Wayfinder | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | none. Its values just never leave it. |
| Classes | ✓ | ✓ | ~ | ✓ | ✓ | ✓ | "build up that wing of your base" `Classes.js:246` |
| Insights + Weekly Review | ✓ | ✓ | ~ | ~ | ✓ | ✓ | "AVG DAILY COMPLETION" % `WeeklyReviewScreen.js:292` |

## Failures by group

| Group | Copy that fails | Where | Fix |
|---|---|---|---|
| **Guilt + streak** | "🔥 Streak at risk" · "keeps your streak going" | `notificationScheduler.js:150` | 1.2, 3.2 |
| | "Do one thing today to keep it." | `HomeScreen.js:2077`, `CalmHome.js:230` | 3.1 |
| | "a nudge if … your streak is at risk" | `SettingsScreen.js:630`, `steps.js:172`, `steps.js:1009`, `HelpScreen.js:35` | 1.2 |
| | "Both grow your streak." · "The streak is the one that matters." | `screenTutorials.js:46`, `:50` | 1.3 |
| | "Warming Up / On a Roll / Unstoppable" · "Unlocks at a 7-day streak" | `badgeDefinitions.js:18-20`, `characterOptions.js:175` | 3.1 |
| **Punishes gaps** | "MISSED" · "⚠️ Missed" · "2 missed" | `PlannerScreen.js:729`, `:978`, `:1248` | 1.2 |
| | "2 plans slipped · 1 task overdue" | `notices.js:107-112` | 1.2 |
| | "quiet for 12 days" · "sitting for 3 weeks" | `notices.js:170`, `:189` | 1.2 |
| | "Late · do it today" · "3 days late" · "Slipped this week" | `rightNow.js:54`, `ProjectDetail.js:61`, `WeeklyReviewScreen.js:199` | 1.2 |
| | "Don't let it rot" · "Items show **time left**" (wrong: the inbox shows age) | `screenTutorials.js:127-128` | 1.3 |
| **Game voice** | "Level Up!" · "New Tier!" · "Unlocked!" · "Nice!" | `LevelUpNotification.js:74`, `:96` | 1.1 |
| | "Quest Complete!" · "Legendary / Master / Expert" | `GameOver.js:38`, `:20-24` | 1.1 |
| | "Pick a prize!" · "🔥 Almost there!" | `RoundCompleteScreen.js:151`, `MissionCard.js:91` | 1.1 |
| | "where learning levels up real life" | `shareOut.js:77-80` | 1.1 |
| | "**Claim it** on the goal card" | `StageStepsWidget.js:76`, `firstGoalGuide.js:241` | 1.1 |
| | "wing of your base" · "Loading your chronicles..." · "⚔️ Daily Quests" | `Classes.js:246`, `StatsScreen.js:23`, `:94` | 1.4 |
| **Our wants over theirs** | "LV 4 · 120 PTS" on every screen | `TopBar.js:181` | 3.3 |
| | Goal steps: "Reach level 3" · "Earn 250 points" · "Finish a daily drill" · "Play one training game" (5 first goals) | `objectives.js:347`, `:400`, `:312`, `:431,452,468,488,505` | 3.3 |
| | Goal done → "Keep Planner?" is the whole moment | `UnlockNotification.js:137-139` | 2.5 |
| | "**Your whole life**, one app." | `steps.js:276` | 1.4 |
| **No visible why** | No dream to point at. Project why is one tap deep. Tasks and Planner items show none. | `ProjectOverview.js:164` | 2.3 |
| | Goal "why" lines are ours: "easier to win", "a day you run, not one that runs you" | `objectives.js:307`, `:627` | 1.4, 2.3 |
| | Lessons open on "What is it?", not why | `ClassTopicScreen.js:147` | 2.7 |
| **Buried values** | 18 values, up to 5 picked, used only to rank Wayfinder paths | `wayfinder.js:219` | 2.1 |
| | "Who I'm becoming" shows only on the Wayfinder card | `WayfinderWidget.js:101` | 2.1 |
| **Contradicts a belief** | Home quote: "The only way to do great work is to love what you do." (passion is *found*) | `HomeScreen.js:115` | 1.4 |
| | "Success is the sum of small efforts repeated day in and day out." (routines, not bursts) | `HomeScreen.js:116` | 1.4 |

---

## Phase 1 · Copy only

No product decisions. Strings change, plus two colours. No logic.
Every line: **short**, **plain**, names the **real thing** they did. No hype, no slogans.

### 1.1 Celebrations

| Where | Before | After |
|---|---|---|
| `LevelUpNotification.js:74` | Level Up! | **Level 4** |
| | New Tier! | **{rank name}** |
| | Unlocked! | **Now open** |
| `:80` | Your points opened something new | From your points. |
| `:85` | 🎁 You unlocked | **Now open** |
| `:96` | Nice! | **OK** |
| `GameOver.js:38` | Quest Complete! | **Round done** |
| `GameOver.js:20-24` | Legendary · Master · Expert · Skilled · Apprentice | Drop the word. Show **18 of 20 right**. |
| `RoundCompleteScreen.js:151` | Pick a prize! · +40 points! | **Pick a card** · **+40 points** |
| `MissionCard.js:91` | 🔥 Almost there! | **{n} to go** |
| `QuestScreen.js:625` | Quest complete | **{quest title}**: done |
| `shareOut.js:77-78` | I just reached Level 4 in Deskartes, where learning levels up real life. | I reached Level 4 in Deskartes. |
| `shareOut.js:80` | Leveling up with Deskartes. | Working on my goals with Deskartes. |
| `UnlockNotification.js:274`, `:283` | Unlocked · Also unlocked: | **Now open** · Also open: |
| `StageStepsWidget.js:76` | All done. **Claim it** on the goal card. | All done. Tap **Finish** on the goal card. |
| `firstGoalGuide.js:241` | Tap **Finish** on your goal card to claim it. | Tap **Finish** on your goal card. |
| `lifeareas/ActionPanel.js:52` | Logged. Keep it going. | **Logged.** |

The "who you're becoming" line needs real counts, so it's **2.5**.

### 1.2 Reminders, notices, gaps

| Where | Before | After |
|---|---|---|
| `notificationScheduler.js:150` (until **3.2**) | 🔥 Streak at risk · Nothing done yet today. One drill, a planner item or a quick check-in keeps your streak going. | **Your next step is ready** · Open Home when you have a few minutes. |
| `:147` | 📋 Daily Drills open · Today's Daily Drills are still waiting — a few minutes keeps things moving. | **Today's drills** · Three short ones, about 5 minutes. |
| `:238-239` | 🍎 Cleo is getting hungry · Feed it now for double bond. | 🍎 **Cleo** is hungry · Down to one heart. |
| `SettingsScreen.js:630` | A nudge if today's Daily Drills are still open, or your streak is at risk | Evening nudges: **today's drills** and your **next step** |
| `steps.js:172`, `:1009` | same as above | same as above |
| `HelpScreen.js:35` | …nudge you if your streak is at risk. | …nudge you in the evening about **today's drills** and your **next step**. |
| `notices.js:112-114` | 3 things from earlier · 2 plans slipped · 1 task overdue: … · **Review & reschedule** | Pick up **{first title}** (+2 more) · {titles} · **Pick new days** |
| `notices.js:170-171` | "Fence" has been quiet for 12 days · Next step: buy posts | Pick up **Fence** · Next step: **buy posts** |
| `notices.js:189-190` | "Garden bed" has been sitting for 3 weeks · Grow it into a plan, or let it go. | Still want **Garden bed**? · Make it a **project**, or **let it go**. |
| `PlannerScreen.js:729` | MISSED (red) | **NOT DONE** (grey) |
| `PlannerScreen.js:978` | ⚠️ Missed (red) | **Earlier** (grey) |
| `PlannerScreen.js:1248` | · 2 missed | · 2 open |
| `rightNow.js:54` | Late · do it today | **From earlier** |
| `ProjectDetail.js:61` | 3 days late | **was due Oct 14** |
| `WeeklyReviewScreen.js:199` | Slipped this week | **Not done yet** |

### 1.3 Tutorials and help

| Where | Before | After |
|---|---|---|
| `screenTutorials.js:46` | **Study** opens Daily Drills. **Play** opens a game. Both grow your streak. | **Study** opens Daily Drills. **Play** opens a game. |
| `:50` | Points and your **streak**. The streak is the one that matters. | Your **points** and **streak**. |
| `:127-128` | Don't let it rot · Items show **time left**. Empty the inbox a few at a time. | **A few at a time** · Each item shows **how old** it is. Sort a few when you can. |
| `:465` | No specific walkthrough for this screen yet — check Help for the general FAQ instead. | No walkthrough here yet. **Help** has the FAQ. |
| `screenHelp.js:15` | Your dashboard — daily missions, streak, and a snapshot of what needs attention today. … | **Today**: your goal, its next step, and what's planned. |

### 1.4 Onboarding, goals, Classes, Insights

| Where | Before | After |
|---|---|---|
| `steps.js:276` | **Your whole life**, one app. | Start with **one goal**. Add the rest when you need it. |
| `objectives.js:307` | A day with a focus and a plan is easier to win than one without. | A day with **one focus** is easier to finish. |
| `objectives.js:627` | A day with a plan and an empty head is a day you run, not one that runs you. | Get it out of your head and onto **one list**. |
| `objectives.js:423`, `:447` | Every habit starts with a day where you showed up once. This is that day. | Start with **one small habit**. Small is easier to keep. |
| `objectives.js:681` | Discover is a room full of other people's work. Turning up with something of your own changes what it is for. | Share **one thing you made**. |
| `HomeScreen.js:115` | "The only way to do great work is to love what you do." | **Cut.** Says passion is found. |
| `HomeScreen.js:116` | "Success is the sum of small efforts repeated day in and day out." | **Cut.** Says routine is the only way. |
| `HomeScreen.js:170`, `:2405` | Check-ins Due | **Check-ins** |
| `Classes.js:246` | Pick a subject to build up that wing of your base | Pick a **subject** to learn. |
| `StatsScreen.js:23` | Loading your chronicles... | Loading… |
| `StatsScreen.js:70` | Start playing to build subject mastery! | Play a round in a subject and it shows here. |
| `StatsScreen.js:94-96` | ⚔️ Daily Quests · 📅 Weekly Quests · 🏆 Achievements | **Daily Drills** · **Weekly Challenges** · **Milestones** (Training's own names) |
| `StatsScreen.js:132` | No active quests | Nothing here right now. |

**Size:** ~50 strings, ~25 files, one PR.

---

## Phase 2 · The Dream layer

Their dream on top. Everything else **points at it**.

### 2.1 What it holds

| Part | Example, in their words | Comes from |
|---|---|---|
| **The life** | "A small farm. I fix things for neighbors. Home by 5." | Onboarding's Tuesday question, or typed |
| **Parts** (1-3 short names) | **the farm** · **steady money** · **time with my kids** | They name them. Things ladder up to these. |
| **Values** (top 3) | Freedom · Time for family · Owning something | Wayfinder step 3 (`wayfinder.js:219`), or picked here |
| **Won't trade** (0-3) | "Sundays with my kids" | Typed |
| **Becoming** | "someone who finishes things" | Wayfinder "I'm someone who…" stem (`wayfinder.js:447`) |

Rules: **rough is fine** · every field **optional** · **edit any time** · old versions kept.

### 2.2 Data model (sketch)

Per **account**, like `wayfinder_maps`: who you are doesn't change when you switch profile.

```
dreams                       one row per account
  user_id       uuid pk → auth.users
  life          text         their words
  values        text[]       ≤3, Wayfinder value ids or their own words
  wont_trade    text[]       ≤3
  becoming      text
  drafted_from  text         'onboarding' | 'wayfinder' | 'typed'
  updated_at    timestamptz

dream_parts                  what things ladder up to
  id, user_id, label ('the farm'), sort, archived_at

dream_versions               old copies, so it can change without losing the old one
  id, user_id, snapshot jsonb, saved_at

projects.dream_part_id       uuid null → dream_parts
```

- Tasks, steps, work sessions and Planner items linked to a project **inherit** its part. No new columns on them.
- Goals (Compass) store a part in their existing progress row when one is picked.
- **Local-first + sync**, same as `src/api/wayfinderService.js`. Guests keep it on the device.
- **RLS: owner only.** Never shown to Family or Organization links.

### 2.3 Where it shows

| Place | Shows | When empty |
|---|---|---|
| **Home, top** (above the goal card; Calm Home too) | The life line, the parts, top 3 values | "What do you want your life to look like? **Write a rough line.**" · **Later** |
| **Project card + ProjectDetail** | Builds toward **the farm** | Nothing. ⋯ → **Link to my dream** |
| **Right now card** | under the title: for **the farm** | Nothing |
| **Done toast** (`RewardToast.js`) | **Fence posts** done · for **the farm** | Today's toast |
| **Goal card** | for **the farm** | Nothing |
| **Wayfinder paths** | Fits: **Freedom**, **Family** | |
| **Weekly Review** | This week, for **the farm**: **4 steps** | |

The project **why box** stays. It says why this project. The part says what it builds.

### 2.4 How it gets drafted

| Where | What happens |
|---|---|
| **Onboarding**, new card after Aim | "Describe a normal **Tuesday** in the life you want." Free text. **Skip for now** is a full-size button. |
| **Wayfinder**, once a map exists | "**Sound like you?**" A draft from leading themes + values + the becoming statement (reuse `statementSuggestions`, `wayfinderScoring.js:317`). **Use it** · **Edit** · **Not me** |
| **Parts** | After the life line: "Name **1-3 things** in that life you'd work toward." Their words. |
| **Never** | Overwrite what they wrote. Drafts fill empty fields only, or ask first. |

### 2.5 Celebrations that name who they're becoming

From real actions only (`record_action` kinds, `gamificationService.js:526`), last 30 days. Shown on goal done, project done and the Level card.

| They did | Line 1 | Line 2 |
|---|---|---|
| 3+ goals or projects finished | **3 finished** this month. | Their becoming line, quoted. Or: **You finish things.** |
| 5+ steps on one part | **9 steps** for **the farm** this month. | Their becoming line, if set |
| Their first goal | **Plan Your Day**: done. | Nothing |

- **No praise words.** Counts of what they did, then their own words.
- Goal-done card (`UnlockNotification.js:137`): **what they did first**, the feature offer below it.

### 2.6 Welcome back (Home row of the North Star)

| Since their last action | Home's first card |
|---|---|
| under 3 days | Normal Home |
| 3+ days | **Welcome back.** Last time you were on **{step / project}**. · **Pick it up** · **Start fresh** |

- **Start fresh** hides the catch-up for today. Old plans stay in the Planner's **Earlier** list, uncounted.
- That day the bell holds back its catch-up notice.
- Uses `profiles.last_active_date`, already stored.

### 2.7 Classes: why before how

One line of **why** above "What is it?" on each topic (`ClassTopicScreen.js:147`). Content work, no design change.

**Size:** 3 PRs.
1. Data + Home card + onboarding card + Wayfinder draft
2. Project link + Right now + toast + goal card
3. Celebrations + Welcome back + Weekly Review line

Needs: **1 migration** run by hand · a **name** for the layer (3.7).

---

## Phase 3 · Your decisions

Options only. Nothing decided.

### 3.1 Streaks

Today: one day streak (one rest day in 7) on Home, Calm Home, Training ×2, Profile, All Profiles, Family, 3 badges, character items, +20 XP bonus (`gamificationService.js:311`). Habit rings count a streak per habit (`PersonalWidgets.js:96-113`).
Not included: answer streaks **inside** a game round. Those aren't day counts.

| Option | What changes | Trade-off |
|---|---|---|
| **A. Drop** | Gone everywhere. Badges retired, items re-gated. | Cleanest fit. Loses it for people who like it. |
| **B. Opt-in** | Off by default. A switch in Make it yours. | Planners keep it. Two versions to keep working. |
| **C. Momentum** | "**9 days** with something done, last 14" or "**14 things** done this month". Missed days never shown. | Keeps a number, no guilt. Badges become counts. |
| **D. B + C** | Momentum for everyone, streak opt-in | Most work |

### 3.2 Phone reminders

Today: 7pm Daily Drills, 9:30pm streak (`notificationScheduler.js:43-44`). Off by default.

| Option | What changes |
|---|---|
| **A. Drop both** | Only reminders they set themselves |
| **B. Drills only** | At a time they pick |
| **C. Gifts only** | Max 1 a day, their time. Only when there's something of theirs: a saved idea back, their own note, the next step of a project they touched this week. **Nothing** after a gap. |
| **D. C + drills opt-in** | |

### 3.3 XP and levels vs real work

Today: **LV · PTS** on every screen. Stages open on a goal **or** a level. 10 goals have a level, points or game step. Game XP capped at 100 a day; real work pays more.

| Option | What changes |
|---|---|
| **A. Move it down** | Level and points only on Profile and Training. Top bar shows the dream part, or nothing. |
| **B. Real work only** | Levels come from real actions. Games give practice stats (accuracy, subject progress). |
| **C. Fix goal steps** | Swap "Reach level 3", "Earn 250 points", "Finish a daily drill", "Play one training game" for real steps |
| **D. Goals open stages** | Levels stop being gates |

They combine. **C** is the smallest.

### 3.4 Pet hunger

Today: hearts drop over time, a 1-heart phone reminder, **double bond** for feeding at the last heart (PR #64/#65).

| Option | What changes |
|---|---|
| **A. Keep** | |
| **B. No phone reminder** | Hunger stays in the app |
| **C. Paused while closed** | The pet doesn't get hungrier while they're away |
| **D. No double bond** | It rewards waiting until the pet is hungry |

### 3.5 Daily Drills on Home

Today: a default card for Personal and Student (`personas.js:62,78`). "Plan Your Day" makes one a goal step.

| Option | What changes |
|---|---|
| **A. Keep** | |
| **B. Learn aim only** | Shown when they came to learn |
| **C. Opt-in** | In My features, off by default |

### 3.6 "An app people use every day"

`deskartes-brief-for-ai.md:9`.

| Option | What changes |
|---|---|
| **A. Keep** | |
| **B. Reach for** | "The app people **reach for** when it matters" |
| **C. B + new measure** | Success = **kept promises**: goals finished, projects done, dream parts with steps this month |

### 3.7 Still open from north-star.md

- **Layer name:** Your Why · The Dream · The Way
- **The feeling** in one word
- **Founder story** at the front door: your words. Welcome step, or a "Why this exists" link?
- **Under-13s**: same Tuesday question, or "What do you want to **get good at**?"
- **Weekly Review %** ("AVG DAILY COMPLETION"): keep, or counts only (goes with 3.1 C)

---

## Order

| Phase | Size | Needs from you |
|---|---|---|
| **1** | 1 PR, ~50 strings | OK on the lines |
| **2** | 3 PRs + 1 migration | OK + a layer name |
| **3** | One PR per decision | A call on each |

## Status

Plan only. **Nothing built.**
