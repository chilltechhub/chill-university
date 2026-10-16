# Deskartes feature review (2026-10-14)

All 54 use cases: **how the app does each one, what's strong, what's weak, the UI/UX, and how the best app does it.**

- Scores are **1–10**. "Best" is the strongest single app for that one job.
- Based on **main** (a20d3ef) plus past test notes. Everything was tested **on web only**, never on a phone.
- The compound-loop work in the working tree (takeaway + when/then on Vault items, "how did it go" on Done, journal prompts, **Remember this?**) is **uncommitted**, so it's noted as *in progress*, not scored.

**Average: ~5/10 for Deskartes vs ~9/10 for the best single app in each row.**

---

## App-wide UI/UX (applies to every screen)

| Area | What it's like | Verdict |
|---|---|---|
| **Navigation** | 3 bottom tabs: **Library · Home · Training**. Library is on the left, Home in the middle. Library has 3 sub-tabs (**Life · Build · Knowledge**). | Weak: **Planner, Inbox and Vault are 2+ taps deep** inside Library. The tool you use daily isn't a tab. |
| **The + button** | 52pt, movable to any corner. 7 shortcuts: What's next?, New Project, Calendar, New Reminder, New Note, Plan from a link, Capture Inbox. | Strong. It's the real shortcut layer. |
| **Top bar** | Rank emoji (opens a menu: Profile, Help, Screen Tutorial, Make it yours, Settings, Search), **LV · PTS** pill, bell, rewards waiting. | Weak: **Search and Settings hide behind an emoji**. Ctrl+K works on web only. |
| **Visual style** | Each place has its own world: blueprint paper (Workshop), a garden canvas (Idea Garden), "Command" dark theme, scenic backgrounds. | Strong identity. Cost: buttons and inputs differ from screen to screen. |
| **Contrast** | `text4` (below AA on purpose) is used as **text on ~322 lines**. **92 hard-coded whites**, some on bright fills in dark mode (Work Mode, Weekly Review buttons). | Weak. Biggest visual fix. |
| **Screen readers** | ~318 labels vs ~1,033 tappables (**~30%**, up from 4% in September). | Better, still not enough. |
| **Copy** | Short with **bold** key words (RichText). Some leftover jargon: "Commander", "Sectors", "Loading your chronicles…", "Scholar", 20 rank tiers. | Mostly strong. |
| **Guidance** | 8 onboarding cards → 4-step tour → first goal → **103 screen-tutorial steps** with a guide character. | Thorough, but heavy. |
| **Offline** | Most screens read from a cache and queue writes. | Strong. Most apps this size don't do this. |
| **Data kept only on the phone** | Lesson completion, the missed-question review queue, Vault folder names, notice dismissals. | Weak: **lost on a new phone** or a second device. |

---

## Ratings I changed after reading the code

| Use case | Was | Now | Why |
|---|---|---|---|
| Streaks | 6 | **7** | There **is** a rest day (1 missed day in 7 forgiven), and opening the app doesn't count |
| Build skills | 5 | **6** | Missed questions **do** come back after 1, 3 and 7 days |
| To-do lists | 6 | **5** | There's no to-do list screen. To-dos are spread across Inbox, Home and the Planner backlog |
| Stats | 5 | **4** | The Stats screen only shows game numbers |
| Long-term insights | 4 | **2** | Sold as **"Deep Insights"** in Plus, promising trends. There are no trends or charts |
| Business routines | 5 | **4** | "Systems check" is just two life-area ratings |
| Accessibility | 5 | **6** | Good settings card (text size, easy-read font, bold, high contrast, reduce motion) |

---

## 1. Plan and do

### 1. Track habits · **6** · best: **Streaks 9**
- **How:** A habit is a **repeating Planner item** ("Repeats · makes it a habit"). Home's **Habits** card shows up to 6 habits as "3 of 5 days" + a bar for the last 7 days.
- **Strong:** Habits live with the rest of your day, not in a separate app. Ticking one earns XP and keeps the streak going. "Starts today" instead of a red 0% on day one.
- **Weak:** The card shows **daily habits only** (weekly ones are invisible there). No per-habit streak, no history beyond 7 days, no home-screen widget, no Apple Health auto-tick.
- **UI/UX:** Adding one = Planner → Add → title → pick **Repeats**. Clear, but 2 taps deep in Library.
- **They have:** Streaks: one-tap tiles, widgets, Health auto-complete.
- **Fix first:** A **per-habit streak** plus weekly habits on the card.

### 2. Build streaks · **7** · best: **Duolingo 10**
- **How:** Server-side streak. A day counts only when you **do** something real (planner item, task, project step, lesson, game). **One rest day per 7 days** is forgiven.
- **Strong:** Honest (opening the app doesn't count). Kind (rest day). Can't be faked from the device.
- **Weak:** No streak repair, no streak calendar, no "your streak is at risk" moment unless reminders are on (off by default).
- **UI/UX:** "🔥 12 day streak · rest day" on Home, with a clear explanation.
- **They have:** Duolingo: freeze, repair, streak calendar, friends' streaks.

### 3. Plan your day · **7** · best: **Sunsama / Structured 9**
- **How:** Planner **Daily** view, as a list or by time of day (6am–10pm, 80px per hour, overlaps in columns). **Left from earlier** (missed one-offs from the last 14 days) and **No day yet** (open to-dos) sit on today's page. Project deadlines show as **Due** rows. Daily check-in at the top.
- **Strong:** The catch-up lists are excellent; most planners lose missed items. Deadlines from projects show up here. One tap per decision.
- **Weak:** **No drag to move or resize.** No typed dates ("tomorrow 5pm"). No guided "plan my day" ritual.
- **UI/UX:** Clean header: **Add** + ⋯ menu (Add from ideas, list/time, Add to my calendar, Remove duplicates, Weekly review). 8 area filter chips. "Tap to return to today". The Add sheet hides extras behind **More options**.
- **They have:** Sunsama: a guided morning plan, drag tasks onto the calendar.
- **Fix first:** **Typed quick add** and **drag to reschedule**.

### 4. Calendar · **5** · best: **Google Calendar 10**
- **How:** Daily / Weekly / Monthly. Week grid, month dots, real repeats (daily, weekly, monthly). **Add to my calendar** exports the next 30 days as an .ics file.
- **Strong:** Repeats work properly, delete "this + N later", 7-day trash.
- **Weak:** **Doesn't read or sync** Google or Apple calendar, so real meetings are invisible. Export is one-way and one-time. No invites, no time zones.
- **UI/UX:** Clear chips and period arrows. Weekly and Monthly are read-and-tap-into-a-day, not editable grids.
- **Fix first:** **Read the phone calendar** (expo-calendar, already in Phase D).

### 5. Reminders and notifications · **4** · best: **Todoist 9**
- **How:** Local phone notifications only. Per-item reminder (minutes before), optional auto-reminders for every timed plan, **at most one nudge a day**, quiet hours, buttons on the notification (**Done / Snooze / Tomorrow**), tap opens the item. Notification Center: **Now / Upcoming / Updates**.
- **Strong:** Respectful by design (off by default, capped, quiet hours). Action buttons on the notification are a pro feature.
- **Weak:** **Never tested on a phone.** No web notifications. No server push, so nothing reaches a second device. Capped at 30 auto-reminders (iOS allows 64). No location reminders.
- **UI/UX:** The bell + 3 tabs are clear. ReminderComposer is reachable from projects, the FAB and the Planner.
- **Fix first:** A **device build** and one real reminder fired end to end.

### 6. To-do lists · **5** · best: **Todoist / Things 10**
- **How:** To-dos are `tasks` rows, made from Inbox **Create a Task**, a life area's "add to today's tasks", Weekly Review's **Next 3**, or imports. They show in the Planner backlog (**No day yet**), as Due rows, and 3 at a time on Home's desk.
- **Strong:** Nothing gets lost: undated to-dos surface in the Planner.
- **Weak:** **No to-do list screen.** No priorities, no sub-tasks (outside projects), no tags, no quick add. "Task", "plan", "step" and "action" are four words for nearly the same thing.
- **Fix first:** One **Tasks** view (Today / Upcoming / Someday) inside the Planner.

### 7. Set goals · **7** · best: **Strides 8**
- **How:** The Compass. **22 built-in goals** ("Plan Your Day", "Finish Your First Project", "Know Your Numbers"…), each with ticked steps. Some steps tick themselves from real stats. Finishing goals opens more of the app (10 stages).
- **Strong:** A new account is handed **one small goal**, not a blank page. Home shows only the **next step**. Steps with an **Open** button take you to the right screen.
- **Weak:** **Custom Goals doesn't exist.** It's listed in Plus, in Pick your features and in the catalog, but there's no screen (`screen: null`). Goals are about using the app more than about your life ("Try Three Tools").
- **UI/UX:** The CompassCard is excellent: 4 states, never more than one thing to tap.
- **Fix first:** **Build Custom Goals, or take it off the paywall.**

### 8. Break goals into steps · **7** · best: **Notion 8**
- **How:** Goal steps (fixed per goal), project tasks + **next step**, and **split a task into its own project**.
- **Strong:** Step done → next step offered. Splitting a task into a project is rare and useful.
- **Weak:** You can't write your own goal steps (same gap as #7). No nesting beyond task → project.

### 9. Manage projects · **7** · best: **Asana / Notion 9**
- **How:** The Workshop: projects as **Idea → In progress → Done**, on blueprint paper. Project page: next step, tasks, deadlines, work sessions, reminders, linked Vault notes and ideas. **Project Overview**: why it matters (your words), life areas, pieces, what you learned. Progress tops out at 95% until you mark it Done.
- **Strong:** The honest progress rule. Links to notes, ideas and areas. **Plan from a link** turns a saved video into a project with deadlines and work sessions. Share or copy as Markdown.
- **Weak:** Solo only. No board/timeline view, no dependencies, no files or images.
- **UI/UX:** The most distinctive screen in the app. The blueprint look is charming, but dense; "Stamp" labels in capitals are hard to scan.

### 10. Track deadlines · **6** · best: **Asana 9**
- **How:** Project finish dates, project task due dates and task dates all feed the Planner's **Due** rows (deadlinesService).
- **Strong:** One place to see every deadline, from any source.
- **Weak:** No automatic "due tomorrow" reminder. No overdue view across projects. No dependencies.

### 11. Focus timer · **6** · best: **Forest 9**
- **How:** Work Mode: **Start** (what are you working on + area) → **count-up timer** with Pause/Finish → **scratchpad** → **Finish** (was the step done? what's next?) → saves a work session to the project.
- **Strong:** It ties focus time to a project and moves its next step forward. Few timers do that.
- **Weak:** **No Pomodoro / countdown / breaks.** No app blocking. **A running session only lives on that screen**: leave it and it's gone. White text on area colours (low contrast in places).
- **UI/UX:** Big 56px mono clock, calm layout. The 4-step header (START · TIMER · SCRATCHPAD · FINISH) reads well.
- **Fix first:** **Keep the session alive** when you leave the screen, and add a 25/5 preset.

### 12. Weekly review · **6** · best: **Sunsama 8**
- **How:** 3 screens: **Snapshot** (completion rate, stale projects 14+ days, inbox count) → **Wins** (what got done, add your own) → **Next 3** (writes 3 tasks for next Monday).
- **Strong:** Short (Rule of 3), and it ends in action.
- **Weak:** No history of past reviews, no trends, no reminder unless you set one. Phase C ("Learned 5, used 2") isn't built yet.
- **UI/UX:** Clear wizard. The white-on-teal buttons have low contrast in dark mode.

---

## 2. Capture and store

### 13. Quick capture · **6** · best: **Apple Notes / Drafts 10**
- **How:** **+ → New Note** or **Capture Inbox**. 6 types (Note, Idea, Link, Task, Video, Resource) and **11 places to send it** (project, Idea Garden, Vault, Planner, life area, task, save for later, plan with AI…).
- **Strong:** "Jot now, decide later" is done properly, and the 11 destinations are a real strength.
- **Weak:** No voice, photo, widget, Siri, watch or lock-screen capture. The share sheet needs a new build.
- **UI/UX:** Too many choices at the moment of filing. 11 destinations is a lot to read.
- **Fix first:** Show the **3 most-used destinations first**.

### 14. Save links and bookmarks · **6** · best: **Raindrop 9**
- **How:** Paste a link and it knows **12+ sites** (YouTube, TikTok, Instagram, Reddit, X, Etsy…). It gets a title and tells you exactly where to copy the transcript or caption from. **Plan from a link** turns that text into a project via your own chatbot.
- **Strong:** **Link → plan is unique.** No bookmark app turns a video into a schedule.
- **Weak:** No page previews or images, no permanent copy, no browser extension, no full-text search of the page.

### 15. Notes and documents · **5** · best: **Notion / Obsidian 10**
- **How:** Knowledge Vault: 4 kinds (Note, Bookmark, Paper, Tool), folders, stars, sort (Newest / Oldest / A–Z / Starred), area filter, curated research and tool lists by age, export as Markdown or CSV. Links to projects and ideas. *In progress: takeaway + when/then + "Used N×".*
- **Strong:** The curated lists of trusted sources. Links between notes and projects. The coming "Make it stick" layer is the right idea.
- **Weak:** **Plain-text body**: no headings, lists, images or attachments. **Folder names live on one phone only.**
- **Fix first:** **Basic formatting** (lists, headings) and **folders synced** to the account.

### 16. Search everything · **5** · best: **Notion 9**
- **How:** Command palette. Screens, classes and games match instantly on the device. Your content (captures, projects, ideas, plans, tasks) is searched online, 8 results per kind.
- **Strong:** One box finds both places and your stuff. Ctrl+K on web.
- **Weak:** **Exact-text matching only** (no typo tolerance, no ranking). On a phone it's **2 taps behind the rank emoji**.
- **Fix first:** A **search icon in the top bar**.

### 17. Import data · **4** · best: **Notion 9**
- **How:** Import Hub reads, for free: plain URLs, "site — description" lists, browser bookmark HTML, Markdown, CSV. It removes duplicates and exports Markdown/CSV. Messy text → **AI Import** (Plus, or your own Anthropic key).
- **Strong:** The free parsers are solid and handle real-world mess.
- **Weak:** **AI Import is broken for everyone on the shared key** (parse-import returns 404). No importing from Todoist, Notion, Google Calendar or Apple Notes. The code uses model id `claude-sonnet-5`; worth checking it's still valid (current Sonnet is `claude-sonnet-5-5`).

### 18. Share in and out · **3** · best: **Todoist 9**
- **How:** Out: projects, plans and a day's agenda go to the share sheet (clipboard on web). In: expo-share-intent → Notification Center → file it. "Paste something in" is the fallback.
- **Weak:** **Share-in needs a new build** and has never run. No shared projects or lists with other people.

### 19. AI help · **5** · best: **Notion AI / Motion 9**
- **How:** **Fill with AI** (free): pick a target (Projects, Ideas, Vault, Planner, Life Areas, Portfolio), copy a prompt into ChatGPT, Claude or Gemini, paste the reply back. **Every change is listed with a tick box**, nothing saves until you apply, and **Undo** puts it all back.
- **Strong:** Free, private, honest, and the review-every-change step is better than most built-in AI.
- **Weak:** Copy → switch app → paste → switch back is **4 steps** where competitors take 1. No AI inside the app at all while the edge functions are down.

---

## 3. Learn

### 20. Courses and lessons · **6** · best: **Khan Academy / Coursera 10**
- **How:** Academy: **11 subjects, ~203 topics**, grade bands K-2 to 9-12 (adults see Starter…Advanced). Each lesson: **Learn** cards → **Practice** quiz → **Apply** checklist, plus video links. Business track: **48 modules** in 3 depth tiers (first lesson of each level free, the rest Plus). **Pick up where you left off** card. **Add my own knowledge** per subject.
- **Strong:** Huge breadth, plain language, the Apply step turns lessons into action. The business content deliberately avoids hype figures.
- **Weak:** **Text only** (videos are outside links). No read-aloud. Lesson "done" marks are **stored on the phone only**. No certificates. Content was written in-house with no outside review noted.

### 21. Quizzes and games · **6** · best: **Duolingo / Quizlet 10**
- **How:** **32 games** in Training, 5-round runs, difficulty adjusts as you go, the whole question pool is used before any repeats, round prize cards.
- **Strong:** The September overhaul removed the answer "tells" (longest answer, position), and check-games.mjs guards it. Real variety.
- **Weak:** Quality varies by game. No flashcards you write yourself.

### 22. Study planning · **6** · best: **MyStudyLife 7**
- **How:** **Study blocks** = Planner items linked to a class topic; the Home card shows today's blocks; tap a block to jump to the lesson.
- **Weak:** No class timetable, no exam or homework tracker, no "study X days before the test" plan.

### 23. Track learning progress · **6** · best: **Khan Academy 9**
- **How:** **Subjects** card: each subject's XP as a bar against your top subject. Lessons show "✓ Done 2/2".
- **Weak:** **No "% of the course done"**, so there's no sense of an end. Bars are relative, which means your best subject is always "full".

### 24. Build skills · **6** · best: **Duolingo 9**
- **How:** Daily drills (3 a day, only ones you can actually do), quests (22 ten-minute quests), adaptive games, **missed questions come back after 1, 3 and 7 days**.
- **Weak:** The review queue lives on the phone and resets on a new device. Skills aren't named or tracked anywhere a person can see them.

---

## 4. Know yourself

### 25. Personality and self-discovery · **7** · best: **16Personalities 9**
- **How:** Compass "go deeper": **Big Five** (the 20-item Mini-IPIP, 1–5 "Not me…Very me"), with a "closest four-letter match" and **near-the-middle letters flagged**. Plus how you learn (preferences + proven techniques, not "learning styles"), your situation → a plan, and life beyond work. Answers save as you go.
- **Strong:** **More scientific than the market leader.** The map is a loop (pick a path → small experiment → how did it feel → re-rank), not a one-off result.
- **Weak:** Results are less shareable and less polished than 16Personalities' pages. Signed-in paths were never fully walked.

### 26. Explore careers · **5** · best: **CareerExplorer / LinkedIn 8**
- **How:** **25 careers**, each with what the work is, how people get there, tools, a staged roadmap, schools, companies and states. Sort by salary or skills. **Target This Career** saves it; **Start a build** makes a project.
- **Strong:** Action at the end (target → project).
- **Weak:** **Salary and growth figures are typed into the code with no source**, so they'll go stale. Only 25 careers. Not matched to your Big Five results.
- **Fix first:** **Link the personality map to careers**, and cite a source (BLS) or drop the numbers.

### 27. Rate and improve life areas · **7** · best: **Wheel of Life apps 6**
- **How:** **8 areas × 4 sections = 32 screens.** Rate each area; **Check-ins due** lists stale ones. Each section is **action-first**: suggested actions, quick log, habits checklist, tips, trusted resources.
- **Strong:** **You win this category.** Most "wheel of life" apps stop at the rating.
- **Weak:** 32 screens is a lot to maintain. Some sections are thin on content.

### 28. Track wellness · **4** · best: **Apple Health / MyFitnessPal 9**
- **How:** Exercise, Nutrition, Sleep and so on are **free-text logs** with category chips (Cardio, Strength…) and presets ("Went for a walk").
- **Weak:** **No numbers** (minutes, steps, calories, hours slept), no charts, no Health or Fit sync.
- **Fix first:** **Read steps and sleep from Health** before adding anything else here.

### 29. Mood check-ins · **4** · best: **Daylio 9**
- **How:** Daily check-in at the top of the Planner: **sleep, energy, mood, stress (1–5)** + notes. *In progress: Learned / Used / Tomorrow journal prompts.*
- **Strong:** Fast, and sits where you plan your day.
- **Weak:** **No history or chart** of your moods. No link between moods and activities.

---

## 5. Money and business

### 30. Personal finance · **3** · best: **YNAB / Monarch 9**
- **How:** Financial area: Income, Budget, Savings & Investing, Debt & Credit. Each is a log with an optional **"Amount" text field**, a habits checklist, tips, and links to official tools (Investor.gov, AnnualCreditReport). Plus Level 0 money lessons and 3 budget games.
- **Strong:** Trusted sources, no hype. It **teaches** money, which trackers don't.
- **Weak:** **"Amount" is text, so nothing adds up.** No budget, no totals, no bank sync.

### 31. Savings and investing · **3** · best: **Monarch 9**
- Same screen type as #30. Links to Investor.gov's compound interest calculator instead of having one. No goal amount, no progress bar.

### 32. Debt and credit · **3** · best: **Undebt.it / Credit Karma 8**
- Tips explain avalanche vs snowball well, but there's **no payoff calculator** for your actual debts.
- **Fix first:** A small **debts list → payoff order + months-to-free**. It's cheap to build and fits the app.

### 33. Start a business · **6** · best: **LivePlan 7**
- **How:** Entrepreneur profile: **Founder Quest** card, Vault status, Targets & Readiness, ideas → projects, startup courses S1–S4 (validation, MVP, go-to-market, scale).
- **Strong:** Closest to the best app of any money/business row. Learning → doing is built in.
- **Weak:** No business-plan template or financial forecast. Most courses are behind Plus, and Plus can't be bought yet.

### 34. Run business routines · **4** · best: **Trainual 8**
- **How:** **Recurring ops** (weekly/monthly Planner items), **Systems check** (= your Professional and Digital life-area ratings), **Organization** card.
- **Weak:** No SOPs, checklists you can reuse, or team hand-off. "Systems check" doesn't check any business system.

### 35. Track business numbers · **2** · best: **QuickBooks 9**
- **How:** Only the **monthly revenue target** typed during onboarding. Nothing tracks revenue or costs.

---

## 6. Show and measure

### 36. Portfolio · **5** · best: **Behance / LinkedIn 9**
- **How:** Fills itself from finished projects and badges, plus your own experience entries. **Share** copies a text summary for a resume.
- **Strong:** Zero effort, and it's the "show my work" piece of the compound loop.
- **Weak:** **No public link, no PDF, no images.**

### 37. Stats and charts · **4** · best: **Strava 9**
- **How:** The Stats screen shows points / tier / level, game stats (attempted, correct, accuracy, fastest), subject XP bars, and quest progress.
- **Weak:** **No charts.** **Nothing about real life** (plans done, project hours, habits, check-ins), only games.

### 38. Long-term insights · **2** · best: **Exist / Whoop 8**
- **How:** "Deep Insights" in Plus opens **the same Stats screen** (#37).
- **Weak:** The paywall promises "your full history, with trends for each subject". **There are no trends and no history.**
- **Fix first:** **Remove it from Plus** until it exists.

---

## 7. Motivation

### 39. XP and levels · **7** · best: **Habitica 9**
- **How:** XP → levels → 20 rank tiers. Games: **10 XP × difficulty per right answer, 50 × difficulty per run**. Real actions (plan done, task, project step, area action, goal, check-in): **5 XP each, 50 a day max**.
- **Strong:** Real work finally earns something. Rewards are calm (one celebration per moment).
- **Weak:** **One game round outearns a full day of real work.** That rewards playing over doing, the opposite of the compound-loop rule.
- **Fix first:** **Raise real-action XP** above game XP.

### 40. Points, rewards and badges · **7** · best: **Duolingo 9**
- **How:** Points from games, round prize cards and pet coins. **12 badges**. "Rewards waiting" in the top bar.
- **Weak:** 12 badges is few. Points don't buy anything except cosmetics.

### 41. Leaderboards · **3** · best: **Duolingo 10**
- **How:** Global board by points, age-gated, plus a cohort board for organizations.
- **Weak:** **0 users = an empty board.** Points mostly come from games, so it ranks gaming, not progress.

### 42. Virtual pet · **6** · best: **Finch 10**
- **How:** **35 pets**. Your pet walks across every screen and finds a coin every 3 minutes the app is open (50 a day). It unlocks after your first game.
- **Strong:** Charming, always present.
- **Weak:** It reacts to time spent in the app, not to anything you do. Finch's pet grows only when you look after yourself.

---

## 8. People

### 43. Community feed · **2** · best: **Strava 9**
- **How:** Posts by kind, kudos, **report, block and a moderation queue**. Sits under **Labs** ("unfinished extras").
- **Strong:** Safety basics are in place before launch, which is rare.
- **Weak:** **0 users.** Honestly labelled as Labs.

### 44. Find mentors · **2** · best: **ADPList 8**
- Request a mentor with a message. Needs mentors and users; the notify function's deploy status is unknown (the other two functions return 404).

### 45. Study partners · **2** · best: **Discord 7**
- "Fellow Scholars" lists people by subject. No chat, no groups. 0 users.

### 46. Manage a team or class · **3** · best: **Google Classroom 9**
- **How:** Organizations, cohorts, invite codes (30 uses, 7 days), assignments with due dates, a cohort leaderboard, roles. Plus-gated.
- **Weak:** Planned for v2, **never tested with real people**. No grading, no messages.

### 47. Parent view · **3** · best: **Google Family Link 8**
- Family code links a parent to a child; **Child progress** shows their stats. v2, untested, and the privacy policy still says K-12/under-13.

### 48. Create lesson plans · **5** · best: **MagicSchool 8**
- Lesson Builder + templates + My Lesson Plans. Works, but there's no AI to draft one and nowhere to share it.

---

## 9. Make it yours and account

### 49. Customize looks · **8** · best: **Notion / iOS 8**
- **How:** **Make it yours** hub. Light (**Daylight**) or dark (**Command**), button colour, **23 backgrounds, 39 characters, 35 pets**, Home widgets you can drag, hide and restore (24 to choose from), + button in any corner, emoji and subtext toggles.
- **Strong:** **Tie with the best.** One page that lists every choice.
- **Weak:** With this many options, testing every combination is hard (layering bugs have shown up before).

### 50. Pick your features · **8** · best: **few apps do this, 6**
- **How:** Start tracks: **Just my picks / Level up / All in**. **Pick your features** any time. After a goal, it suggests one tool ("Add Classes?"). Tutorials skip tools you didn't pick.
- **Strong:** **You win.** It's the answer to "this app does too much".

### 51. Accessibility · **6** · best: **Apple's own apps 9**
- **How:** Text size (adds to the phone's size), **easy-read font**, bold text, high contrast, reduce motion, button colour. Tab labels at 12px.
- **Strong:** The settings are better than most apps'.
- **Weak:** **Low-contrast grey text on ~322 lines** and **~70% of buttons unlabelled** for screen readers. No read-aloud.

### 52. Onboarding and tutorials · **7** · best: **Duolingo 10**
- **How:** 8 cards: **Welcome → Aim** (9 choices) **→ Profile type → Start track → Features → Name → Sectors → Look**. Guest mode works. Then a 4-step tour, the first goal, and per-screen tutorials with a guide character.
- **Strong:** One question per card. The aim really changes the app. Walked on fresh accounts many times.
- **Weak:** **8 cards before you've done anything.** Duolingo lets you finish a lesson first. "Sectors" is jargon.
- **Fix first:** **Cut to Aim → Name → go.** Move the rest into Make it yours.

### 53. Paid subscription · **2** · best: **any app using RevenueCat 9**
- **How:** RevenueCat, **$2.99/mo or $24.99/yr** with a 7-day trial on yearly. Guests can see prices. The paywall names a free alternative.
- **Strong:** Honest paywall copy.
- **Weak:** **Not buyable yet** (store setup and revenuecat-sync not done). **3 of the 5 perks are hollow:** Custom Goals (doesn't exist), Deep Insights (no trends), AI Import (404). Store reviewers can reject paid features that don't exist.
- **Fix first:** **Ship Plus with only the business courses**, and add the rest as they become real.

### 54. Account, security and privacy · **6** · best: **Apple / Google 9**
- **How:** Email and password, 2-step sign-in (MFA), several profiles per account, **export my data** (JSON), **recently deleted** (7-day restore), **delete account in the app** (works), RLS verified live.
- **Strong:** Data export + trash + real delete is better than many funded apps.
- **Weak:** **The web delete-account page returns 404** (Google Play needs it). The privacy policy still describes a K-12 app. No Apple or Google sign-in. The export file is still named `chill-data-…`. Settings is one ~170-row page.

---

## What this adds up to

**Where you're genuinely ahead**
- **Life areas**, **Pick your features**, **customization**, a **more scientific personality test**, **link → project**, and **review-every-change AI**.
- **Everything links**: a link becomes a project, its steps land in the Planner, and doing them earns XP and a streak. No single app above does that chain.

**Fix before charging money**
1. **Plus perks:** remove Custom Goals and Deep Insights from the paywall, or build them. Deploy parse-import.
2. **XP:** real work should outearn games.
3. **Phone-only data:** lessons, the review queue and folders should be saved to the account.

**Fix before launch**
4. **Device build:** reminders, share-in, haptics, layout.
5. **Planner placement:** make it a bottom tab or the Home lead, and add typed quick add.
6. **Contrast + labels:** `text4` as text and the hard-coded whites.

**Leave for later (already on hold)**
- Social, finance math, business numbers, team and parent views. They're labelled or gated; they just need users or a decision.
