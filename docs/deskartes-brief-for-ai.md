# Deskartes: product brief for analysis

> **For the AI reading this:** this is a plain-language summary of an app that's built but not launched. Use it to analyze the product: what to cut, what to fix first, where it can win, how it compares to competitors. Scores are the founder's own honest estimates (with Claude's help), not user data. There are **no users yet**, so there's no usage data.

> **Read [north-star.md](north-star.md) first.** It's the founder's mission. Every recommendation should pass its **screen test**.

## North Star

**Mission:** help people **discover who they really are**, **find a dream they can reach**, and **walk the way there**: on **their** terms, not the system's. Their **dream** sits on top, every task ties back to it, and the app speaks like a **mentor**, not a game.

---

## The app in one paragraph

Deskartes is a phone app that combines **planning, learning, and self-improvement** in one place. You save something you learned (a video, a note, a lesson), turn it into a plan or a project, get reminded, do it, and see your progress add up. It also has courses, short learning games, life-area tracking, a personality/self-discovery tool, and light game-style rewards (XP, levels, a pet). The founder's stated goal: an app people use **every day**, not a niche tool.

## Key facts

| | |
|---|---|
| **Stage** | Built, **not launched**, **0 users**. Tested on a web build only, **never on a real phone**. |
| **Team** | One founder (solo company). Learns by building. |
| **Platform** | iOS + Android (React Native / Expo), Supabase backend. Web is for testing only. |
| **Price** | Free + **Plus** at $2.99/month or $24.99/year (7-day trial). |
| **Launch audience** | Consumers **13 and up**. Schools, teams and kids are planned for later. |
| **Values** | **Anti-manipulation**: reminders off by default, max one nudge a day, quiet hours, honest progress numbers, no fake urgency. |
| **Core purpose** | **"Compounding knowledge"**: what you learn turns into what you do, and you can see it add up. |

## Who it's for: 4 account types

The type you pick changes your Home screen and which courses show first.

| Type | For | Ages |
|---|---|---|
| **Personal** | Habits, daily planning, life balance | All |
| **Student** | Study time, classes, exams | All |
| **Business** | Running a business you already have | 18+ |
| **Entrepreneur** | Starting something new | 18+ |

## Why people come: the first question

Onboarding asks **"What did you come here for?"** and the answer picks your first goal and which tools open first:

Build a daily rhythm · Ship something real · Learn a real skill · Get my money right · Find my way · Discover useful tools · Improve parts of my life · See where I stand · Keep my info in one place. (*Look after myself* and *Move my career forward* can be picked later.)

## How it's organized

- **3 bottom tabs:** **Library** (all the tools) · **Home** (dashboard) · **Training** (games).
- **Home** is a dashboard of cards you can rearrange: your current goal and its next step, today's plans, habits, projects, and more (24 cards to choose from).
- **A floating + button** gives shortcuts: new project, note, reminder, calendar, capture, "plan from a link".
- **The app opens gradually.** New users start with a few tools. Finishing small goals unlocks more (10 stages), or users can pick features themselves or turn everything on.

## The core loop (decided, partly built)

1. **Save**: a link, note, lesson or idea. *(built)*
2. **Distill**: one-line takeaway + "When ___, I will ___". *(being built)*
3. **Plan**: that line becomes a planner item or project step. *(partly built)*
4. **Remind with the why**: the reminder shows the takeaway. *(being built)*
5. **Do + log**: "how did it go?" saved on the note. *(being built)*
6. **Resurface**: old notes come back on a spaced schedule ("Remember this?"). *(being built)*
7. **See it add up**: "Used 6 times", learned vs. used. *(not built)*
8. **Journal**: evening prompt: learned / used / tomorrow. *(being built)*

---

## Feature by feature

**Score = Deskartes / best single app at that one job (1–10).** Overall average: **~5 vs ~9.**

### Plan and do

| Use case | Score | How it works | Strong | Weak |
|---|---|---|---|---|
| Habits | **6** / 9 (Streaks) | A habit is a repeating planner item; Home shows "3 of 5 days" for the last week | Lives with the rest of your day | Daily habits only on the card, no per-habit streak, no widget or health-app sync |
| Streaks | **7** / 10 (Duolingo) | A day counts only if you **do** something; 1 rest day per week forgiven | Honest and kind | No repair, no streak calendar |
| Daily planning | **7** / 9 (Sunsama) | Day view as list or timeline; missed items and undated to-dos carry over to today; deadlines show up | Nothing gets lost | No drag to move items, no typed dates ("tomorrow 5pm") |
| Calendar | **5** / 10 (Google Calendar) | Day/week/month, real repeats, export to calendar file | Repeats work well | **Doesn't read or sync** Google/Apple calendar |
| Reminders | **4** / 9 (Todoist) | Phone notifications with Done/Snooze/Tomorrow buttons; max 1 nudge a day; quiet hours | Respectful design | **Never tested on a phone**, no web or cross-device alerts |
| To-do lists | **5** / 10 (Things) | To-dos made from the inbox, reviews or imports show inside the planner | Undated to-dos still surface | **No to-do list screen**, no priorities or tags |
| Goals | **7** / 8 (Strides) | 22 built-in goals with steps; Home shows just the **next step** | New users get one small goal, not a blank page | **Can't write your own goal** (advertised but not built) |
| Goal steps | **7** / 8 (Notion) | Step done → next step offered; a task can split into its own project | Smooth hand-off | No custom steps |
| Projects | **7** / 9 (Asana) | Idea → In progress → Done; next step, tasks, deadlines, linked notes; honest progress (never 100% until marked done) | **"Plan from a link"** turns a saved video into a project | Solo only, no board/timeline, no files |
| Deadlines | **6** / 9 (Asana) | All due dates from everywhere show in the planner | One place for every deadline | No "due tomorrow" alert |
| Focus timer | **6** / 9 (Forest) | Pick what you're working on → stopwatch → notes → save to project | Ties focus time to a project | No Pomodoro or breaks, no app blocking, **timer lost if you leave the screen** |
| Weekly review | **6** / 8 (Sunsama) | 3 screens: Snapshot → Wins → Next 3 (creates 3 tasks) | Short and ends in action | No history or trends |

### Capture and store

| Use case | Score | How it works | Strong | Weak |
|---|---|---|---|---|
| Quick capture | **6** / 10 (Apple Notes) | Jot a note/idea/link/task, decide later where it goes (11 destinations) | "Jot now, sort later" done right | No voice, photo or widget capture; 11 choices is a lot |
| Save links | **6** / 9 (Raindrop) | Recognizes 12+ sites, tells you where to copy the transcript, can plan it into a project | **Link → plan is unique** | No previews, no browser extension |
| Notes | **5** / 10 (Notion) | Vault for notes, bookmarks, papers, tools; folders, stars, curated trusted sources | Notes link to projects | **Plain text only**; folder names don't sync |
| Search | **5** / 9 (Notion) | One box finds screens and your saved stuff | Covers everything | Exact text only; hidden in a menu on phones |
| Import | **4** / 9 (Notion) | Free import of URLs, bookmarks, Markdown, CSV; AI sorts messy text | Free parsers are solid | **AI import is broken** (server not deployed) |
| Share in/out | **3** / 9 (Todoist) | Share projects/plans out; share into the app from other apps | | Share-in needs a new phone build, never run |
| AI help | **5** / 9 (Notion AI) | "Fill with AI": copy a prompt to your own ChatGPT/Claude/Gemini, paste the reply, **review every change**, undo | Free, private, safe | 4 steps vs 1 for built-in AI |

### Learn

| Use case | Score | How it works | Strong | Weak |
|---|---|---|---|---|
| Courses | **6** / 10 (Khan Academy) | 11 subjects, ~200 topics, school grade levels (adult labels for adults), each lesson = read → quiz → apply; 48 business modules | Huge breadth, plain language, ends in action | **Text only**, no read-aloud, progress saved on the phone only |
| Quizzes and games | **6** / 10 (Duolingo) | 32 short games, difficulty adapts, no repeats until the pool is used | Real variety | Uneven quality, no own flashcards |
| Study planning | **6** / 7 (MyStudyLife) | Study blocks in the planner, linked to a lesson | | No timetable or exam tracker |
| Learning progress | **6** / 9 (Khan Academy) | Bar per subject | | No "% of course done" |
| Skill building | **6** / 9 (Duolingo) | Daily drills, 10-minute quests, missed questions return after 1/3/7 days | Uses spaced review | Review queue lost on a new phone |

### Know yourself

| Use case | Score | How it works | Strong | Weak |
|---|---|---|---|---|
| Personality | **7** / 9 (16Personalities) | Big Five test (research-backed), translated to a 4-letter type with "near the middle" flags; learning preferences; your situation → a plan | **More scientific than the leader**; results feed small experiments | Less polished and shareable |
| Careers | **5** / 8 (CareerExplorer) | 25 careers with roadmap, schools, employers; "target this career" → project | Ends in action | Salary numbers have no source, only 25 careers, not linked to personality |
| Life areas | **7** / 6 (wheel-of-life apps) | 8 areas × 4 sections; rate each, then get suggested actions, quick logs, tips | **Wins**: action, not just a rating | Lots to maintain; some thin sections |
| Wellness | **4** / 9 (Apple Health) | Text logs for exercise, food, sleep | | **No numbers**, no charts, no health-app sync |
| Mood check-ins | **4** / 9 (Daylio) | Daily 1–5 for sleep, energy, mood, stress + notes | Fast | **No mood history or chart** |

### Money and business

| Use case | Score | How it works | Strong | Weak |
|---|---|---|---|---|
| Personal finance | **3** / 9 (YNAB) | Logs + tips + links to official tools; money lessons and budget games | **Teaches** money honestly | Amounts are text, **nothing adds up**, no bank sync |
| Savings/investing | **3** / 9 (Monarch) | Same as above | | No goal amount or progress |
| Debt/credit | **3** / 8 (Undebt.it) | Explains payoff methods | | **No payoff calculator** |
| Start a business | **6** / 7 (LivePlan) | Founder quest, idea → project, startup courses | Learning → doing | No plan template or forecast; most courses paid |
| Business routines | **4** / 8 (Trainual) | Weekly/monthly repeating tasks | | No reusable checklists or team hand-off |
| Business numbers | **2** / 9 (QuickBooks) | Only a revenue target typed at signup | | Basically missing |

### Show and measure

| Use case | Score | How it works | Strong | Weak |
|---|---|---|---|---|
| Portfolio | **5** / 9 (LinkedIn) | Fills itself from finished projects; copy as text | Zero effort | No public link, PDF or images |
| Stats | **4** / 9 (Strava) | Points, level, game accuracy, subject XP | | **Games only**, no charts, nothing about real life |
| Long-term insights | **2** / 8 (Exist) | Sold in Plus as "trends" | | **Same screen as Stats; trends don't exist** |

### Motivation

| Use case | Score | How it works | Strong | Weak |
|---|---|---|---|---|
| XP and levels | **7** / 9 (Habitica) | XP from games and from real actions | Calm, one celebration at a time | **One game round outearns a full day of real work** |
| Points and badges | **7** / 9 (Duolingo) | Points from games, prize cards, pet coins; 12 badges | | Few badges; points only buy cosmetics |
| Leaderboard | **3** / 10 (Duolingo) | Global + group boards, age-gated | | 0 users; ranks gaming, not progress |
| Virtual pet | **6** / 10 (Finch) | 35 pets walk across every screen and find coins while the app is open | Charming | Reacts to time in the app, not to what you do |

### People

| Use case | Score | How it works | Strong | Weak |
|---|---|---|---|---|
| Community feed | **2** / 9 (Strava) | Posts, kudos, **report/block/moderation** | Safety built in early | 0 users; labelled "Labs" |
| Mentors | **2** / 8 (ADPList) | Request a mentor | | No mentors, no users |
| Study partners | **2** / 7 (Discord) | List of people by subject | | No chat; 0 users |
| Teams/classes | **3** / 9 (Google Classroom) | Groups, invite codes, assignments, group leaderboard | | Planned for later, untested |
| Parent view | **3** / 8 (Family Link) | Link a child, see their progress | | Planned for later, untested |
| Lesson plans | **5** / 8 (MagicSchool) | Build and save lesson plans from templates | Works | No AI drafting, no sharing |

### Make it yours and account

| Use case | Score | How it works | Strong | Weak |
|---|---|---|---|---|
| Customize looks | **8** / 8 (Notion) | Light/dark, button colour, 23 backgrounds, 39 characters, 35 pets, rearrange Home, move the + button | **Ties the best**; one page lists every choice | Many combinations to test |
| Pick your features | **8** / 6 (few apps) | Start with "Just my picks", "Level up" or "All in"; add tools any time | **Wins**: answers "too much app" | |
| Accessibility | **6** / 9 (Apple) | Text size, easy-read font, bold, high contrast, reduce motion | Better settings than most | Low-contrast grey text in many places; ~70% of buttons unlabelled for screen readers |
| Onboarding | **7** / 10 (Duolingo) | 8 one-question cards, then a short tour, a first goal, and per-screen tips with a guide character; guest mode | The first answer really shapes the app | **8 cards before doing anything**; lots of tips |
| Subscription | **2** / 9 | Plus with a free trial; honest paywall copy | | **Can't be bought yet**; 3 of 5 paid perks are missing or broken |
| Account and privacy | **6** / 9 (Apple) | 2-step sign-in, multiple profiles, data export, 7-day trash, delete account | Better than many funded apps | Web delete-account page missing (Google Play needs it); privacy policy outdated; no Apple/Google sign-in |

---

## App-wide UI/UX

- **Look:** each area has its own visual world (blueprint paper for projects, a garden for ideas, a dark "command deck" theme). **Strong identity**, but buttons and inputs differ from screen to screen.
- **Navigation:** the **Planner, the most-used tool, isn't a bottom tab**; it's 2 taps deep inside Library. Search and Settings hide in a menu behind the rank emoji.
- **Copy:** short sentences with **bold** key words. Some leftover jargon ("Commander", "Sectors", "Scholar", 20 rank names).
- **Guidance:** heavy: onboarding + tour + first goal + 100+ screen tips.
- **Works offline:** most screens load from a cache and save later. Strong.
- **Contrast:** some grey text falls below readability standards; some white text sits on bright buttons in dark mode.
- **Phone-only data:** finished lessons, the review queue and folder names don't sync to the account.

## Biggest problems (the founder's current list)

1. **Paid perks that don't exist:** "Custom Goals" (no screen), "Deep Insights" (no trends), "AI Import" (server down).
2. **Rewards point the wrong way:** games earn far more XP than real-life actions.
3. **Never run on a phone:** reminders, sharing, layout and haptics are unproven.
4. **Breadth over depth:** 54 use cases at ~5/10 vs competitors at ~9/10 in their one job.
5. **No users:** social features, leaderboards and mentors are empty by definition.

## Where it can win

- **The connected chain:** link → project → planner → done → XP/streak. No single competitor does all of it.
- **Life areas with actions**, **pick your own features**, **customization**, a **research-backed personality test**, **AI changes you review before saving**.
- **Values:** calm, honest, non-manipulative, in a category full of dark patterns.

## Already decided (please don't re-suggest)

- Core purpose = **compounding knowledge** (learn → do → show your work).
- **Hiding weak features is on hold**; the founder will decide later.
- Big Five, **not** Myers-Briggs. No "learning styles".
- Consumer **13+ first**; schools, teams and kids later.
- Web is for testing only; the product is the phone app.
- Round prize cards stay (they're how points are awarded).
- Reminders stay **off by default**, max one nudge a day.

## Questions to analyze

1. Which **3–5 use cases** should the app be *great* at to become a daily habit, and which should be cut or hidden?
2. Does the **compound-knowledge loop** hold up? What's missing for someone to come back tomorrow?
3. What should **Plus** contain at launch so it's honest and worth paying for?
4. Which competitor is the **closest real threat**, and what would make someone switch?
5. What's the **smallest launch** that still shows the app's unique chain?
6. Are the **4 account types and 11 aims** too many choices for a new user?
7. How should **XP and rewards** work so they push real-life action, not more screen time?
