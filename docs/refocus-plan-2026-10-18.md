# Refocus: the guide for the rest of us

*2026-10-18. Written after the Reddit research ([reddit-research-2026-10-18.md](reddit-research-2026-10-18.md)) and the founder's own story. Checked against the [North Star](north-star.md). **Approved 2026-10-18.***

> **Build 1 (shipped on `feature/front-door`):** the first question (5 + More reasons), "Discover useful tools" → Finds with the **Try Your First Find** goal, **Today's Find** on Home, Training → **Learn** (Classes first), **Classes open for every account** from day one, feature **places**, and the Library as **Life · Find · Tools**.
> **Changed while building:** an *extra* is hidden from "All in" and the stage path, but still shows for someone whose **aim or path** opens it (Entrepreneurs and "Start something" keep the Idea Garden; their first goals use it). The new aims (Save time, Stay safe online, Use AI well) wait for Finds v1.

## Why (the founder, in short)

- **Walmart electronics:** customers were **lost**, stuck in their own bubble, cut off from tech that could help them.
- **Even techy people get lost:** GitHub has *everything*, but it's hard to search and full of things you don't understand.
- **The tools and know-how already exist.** People **don't know**, **forgot**, or **don't know how to apply** them.
- **We're in the brainrot and disinformation era.** Finding what's true and useful keeps getting harder.

**Belief:** everyone can use tech to improve their life, through **time** or **money**.

---

## The decision

**Deskartes is not a life organizer.** LiveIt, Kynote and FamilyWell organize a life people already have, and they do it better.

**Deskartes is the guide you wish the Walmart customer had.** It connects regular people to the **tools and know-how** that make life better, **explained plainly**, **checked for truth**, **matched to them**, and **turned into a step** they actually take.

> **Brainrot is endless, vague, and leaves you where you started.**
> **Deskartes is short, true, and ends in a step.**

**Four pillars: Discovery · Education · Implementation · Execution.** Everything else in the app (life areas, journal, projects, games) **supports** those four. Those parts don't compete with full management, notes or journal apps.

**This is a refocus, not a rebuild.** Classes, Compass, Career Explorer, the Vault, the compound loop, and **86 curated tools with plain-language summaries** already exist. What drifted is the **front door and the order**.

---

## What it does: 5 jobs

| Job | The person gets | Built from (already exists) |
|---|---|---|
| **1. Find** | The right tool or idea **for their situation**. Not a search through everything | Discover catalogs (27 research tools + 59 everyday sites, **editable live** from Supabase), Compass, the Dream layer |
| **2. Understand** | What it is, who it's for, what it costs, **the catch**, in plain words | Catalog summaries, "Teach me this · 2 min", Academy classes |
| **3. Trust** | Checked facts, the source, the date, no paid picks | "(reviewed 2026)" stamps, the regulated-figure rule, Level 0's **myth-busting**, Media & Digital Literacy |
| **4. Use** | **One step to try it**, today, tied to their goal | Lesson **Apply** step → Planner / Projects, "Put it to use" |
| **5. Remember** | It comes back when it matters, so it doesn't get forgotten | Compound loop: "Remember this?", spaced resurfacing, "Used N×" |

**A mentor walks through all five**: the guide character and the North Star voice. **Every screen should serve one of these jobs.** If it doesn't, it's parked.

---

## How the parts fit

```
 DISCOVER          EDUCATE            IMPLEMENT                 EXECUTE              KEEP IT
 ┌────────┐      ┌──────────┐      ┌──────────────────┐      ┌──────────────┐      ┌──────────────┐
 │  Find  │ ───▶ │  Lesson  │ ───▶ │ Life area        │ ───▶ │ Planner step │ ───▶ │ Journal:     │
 │ (card) │      │ "the why"│      │ (small: try it)  │      │ Work Mode    │      │ how did it go│
 └────────┘      └──────────┘      │ Project          │      └──────────────┘      │ Games:       │
                                   │ (big: build it)  │                            │ practice it  │
                                   └──────────────────┘                            │ Resurface    │
                                                                                   └──────────────┘
```

| Part | Its job in the flow | Example |
|---|---|---|
| **Finds** | Discover: the input | "A beginner 3-day workout routine" |
| **Lessons / classes** | Educate: the why and how | "Why progressive overload works (2 min)" |
| **Life areas** | Implement: **the shelves where Finds land** | Workout → **Physical**. Budget method → **Financial**. Password manager → **Digital** |
| **Projects** | Implement: for **bigger** Finds | "Start a side business" → project with steps (capture → project already exists) |
| **Planner + Work Mode** | Execute: the step, on a day | "Monday 7am: workout A" |
| **Journal** | Reflect: **how did it go?** | Already asked after a step ("What happened?") |
| **Games + drills** | Practice: **keep remembering it** | Quiz on what *you* found and learned, spaced 1/3/7 days |

**It's already wired more than it looks:**

- **The 8 life areas match the catalog's tags exactly**: physical, mental, social, financial, creative, professional, spiritual, digital. Every curated resource already knows which shelf it belongs on.
- **Life areas already have live-editable actions and resources** (`area_actions` / `area_resources`, with quick tiers of 2 minutes or less).
- **Games already link to lessons** (`skillLinks.js`: "struggled with this game → here's the lesson"), and missed questions already come back after 1/3/7 days.

**The rule for supporting parts:**

> **If it holds a Find or a lesson, keep it light and connected.**
> **If it competes with a dedicated app, don't deepen it.**

Life areas **hold what you're trying and what you've learned**. They're **not** a full fitness tracker or budget app. The journal holds **how it went**; it isn't a full journaling app. Projects are for **building what you found**; they aren't Asana.

**Connections to build (the missing joins):**

1. **On a Find:** **Add to my [area]** · **Make it a project** · **Learn the why** · **Practice it**.
2. **On a life area:** **Trying now** (Finds you added, each with its step) · **Learned** · **Then vs now**.
3. **Practice that's personal:** games and drills pull from **the Finds and lessons you opened**, not random trivia.
4. **After a step:** "How did it go?" → **Used N×** → shows on the life area.

---

## Less app: front, background, extra

**Stop adding. Show less.** Every feature gets one of four places. Nothing is deleted.

| Place | What it means | Features |
|---|---|---|
| **Front** | In the tabs, on Home, **in the pitch** | **Home** (Dream → Today's Find → Today's step) · **Finds** (the Discover catalogs) · **Learn** (Academy classes + tracks) · **Practice** (games, drills) · **Life Areas** (the shelves) · **Find your way** (Compass, Dream, Career Explorer) |
| **Background** | **No tile.** It shows up only when a flow needs it | **Planner** (from Today's step) · **Projects / Workshop** (from "Make it a project") · **Work Mode** (from starting a step) · **Capture Inbox** (where shared links land) · **Knowledge Vault** (= "My Finds") · **Journal / check-ins** ("How did it go?") · **Weekly Review** (Sunday check-in) · **Insights** (from a life area's then vs now) · **Portfolio** (when a project ships) |
| **Extra** | **Off by default.** Turn on in Make it yours → **More tools** | **Idea Garden** (Projects already have an Idea stage) · **Bring stuff in** · **Savings & Investing** and **Debt & Credit** trackers (their calculators move into the money lessons) |
| **Off (v2)** | Hidden until schools, teams or people exist | Lesson Plan Builder · Organizations & Cohorts · Community, Labs, Mentors, Feed, Fellow Scholars (social, already off) |

**Plus is not a closet.** Don't move clunky features behind Plus: people pay for what's **front and center**. Plus = **more guidance** (guided tracks, long-form courses, the business curriculum).

**It's cheap to do.** `featureAccess.js` already hides a whole group with one flag (that's how social is off), and **Pick your features** already lets people opt in. Add a `place` field (`front` / `background` / `extra`) to `featureCatalog.js`: the Library shows **front** only, **background** features stay reachable from their flows, and **extra** waits for opt-in.

---

## Connect to the apps people already use (pull + push)

**Full plan: [connections-plan-2026-10-18.md](connections-plan-2026-10-18.md).** Built in phases, aiming at **20+ apps**.

- **Pull in** what they did (workouts, tasks, events, highlights, spending, mood). It shows up as **proof on a life area**, **Used N×**, and **today's step**.
- **Push out** today's steps, Finds and lesson takeaways.
- **One layer for every app.** Everything becomes **Done**, **Stuff** or **Numbers**, and each app is one small connector file.
- **Cheapest first:** phone hubs (Calendar, Reminders, Health, Share sheet, Files) → automation hubs (Zapier, Make, IFTTT, Shortcuts) → direct connections (Todoist, Notion, Readwise, YNAB…) → banks and AI assistants.
- **Phase A is mostly built already:** share-in and **calendar read + write** exist and just need a phone build.

**How "direct them to the app" works on a Find:**

1. **Use it in [App]** opens the app if it's installed (web links do this on their own), or its store page if it isn't.
2. When they come back: **"Did you set it up?" → Yes** → a check mark on the life area + **Used N×**.

**That one tap is the sync.** It's honest, free, and never breaks when another app changes its API.

---

## The signature: Finds

**A Find is one card:** a tool, a skill, or a piece of know-how that can save someone time or money, or keep them safe.

| On the card | Example (format only) |
|---|---|
| **What it is**, in one line | "A free password manager" |
| **Who it's for** | "Anyone who reuses passwords" |
| **What it costs** | "Free; $10/yr for extras (reviewed 2026)" |
| **The catch** | "If you lose the master password, it's gone" |
| **Why trust it** | Who makes it, what they get from you, a source |
| **Try it in 10 minutes** | One step → goes to the Planner |
| **Go deeper** | A 2-minute lesson or a class topic |

**Grouped by outcome, not by tech:** **Save money · Save time · Stay safe** (scams, privacy) **· Earn more · Learn faster · Use AI well**.

**One Find for you today**, matched to their dream and situation. **Finite, never a feed.**

**Also:**

- **Myth vs fact cards.** Short, sourced corrections (Level 0 already does this for money). **Shareable**, which makes them free marketing that spreads truth.
- **"GitHub for the rest of us."** Plain-language picks of free and open-source tools, the ones you'd never find yourself.

---

## Trust rules (the anti-disinformation promise)

1. **No paid placements.** If affiliate links ever appear, they're labeled. Better: none at launch.
2. **Every Find shows the catch.** No tool is all upside.
3. **Every number is stamped and sourced.** It's the rule the curriculum already uses.
4. **Teach the mechanism, never "you should".** It's the regulated-content rule, applied everywhere.
5. **Say when we're unsure**, and when something changed.

---

## Keep

- **Discover catalogs**: they become the Finds library
- **Academy classes + ownership curriculum**, guide lessons, quests: the "go deeper" behind each Find
- **Compass, Dream layer, Career Explorer**: what makes the matching personal
- **Life areas**: the **shelves** where Finds land (keep light; see the rule above)
- **Projects, Planner, Work Mode**: where the step lives. Fix bugs, **stop adding organizer depth**
- **Journal / check-ins**: "how did it go?"
- **Games + drills**: **practice** to remember what you found and learned
- **Vault + capture → plan + the compound loop**: Use and Remember
- **Guide character + mentor voice**
- **Pet + XP + customization**: the reward layer (XP points at **using** what you found and learned)
- **Portfolio, gradual unlocks, Pick your features**

## Change

| What | From | To |
|---|---|---|
| **"Discover useful tools" aim** | Tours the **app's own** tools (planner, inbox, vault) | Shows **real-world Finds** matched to you |
| **Website + store listing** | "K-2 through career", 14 feature sections | Your **Walmart story**, "short, true, ends in a step", real screenshots, free + Plus price |
| **First question** | 9 aims, several of them organizer jobs | **Save money · Save time · Stay safe online · Use AI well · Find my way · Learn a skill · Start something** |
| **Home order** | Dashboard of tool cards | **Dream → Today's Find → Today's step → Remember this?** |
| **Training tab** | Games first | Rename to **Learn**: Finds, classes and tracks first, games as **Practice**. Still 3 tabs *(revises Oct 14, your call)* |
| **Plus** | Thin perks | Sells **guidance**: guided tracks, long-form courses, the business curriculum (first lesson free stays) |
| **Career Explorer** | 25 careers, unsourced salaries | **How AI is changing this job**, skills that hold up, first step this week, sourced numbers |

## Park for v1 (hide, don't delete)

See **[Less app](#less-app-front-background-extra)** for where every feature goes. Also park: Retail (R1) + Workplace Compliance (W1) training (B2B, v2) and the "keep my info in one place" aim.

**Keep light, don't deepen:** money logs and wellness logs inside life areas. They hold **what you're trying**; the real data lives in the [apps people connect](#connect-to-the-apps-people-already-use-pull--push).

## Add

1. **Finds**: the card format above, built on the existing catalogs. **Start with 30 great ones** across the 6 outcomes. Quality beats count.
2. **"Tech for the rest of us" track**: how AI really works, using it well and safely, scams and deepfakes, your data, what AI changes about jobs. Each lesson ends in a step.
3. **Myth vs fact cards**, shareable.
4. **"What changed this month"**: one honest explainer of a tech change and what it means for you. *(Ongoing writing. Monthly is fine.)*
5. **Weekly coach check-in**: Weekly Review reframed as *what did you find, what did you try, what's next?*
6. **Your story at the front door.**

**On AI answers:** "connect people with information" invites an Ask box. In a disinformation era, **an answer without sources is part of the problem**. v1 uses curated Finds + **"Ask your own AI"** (the Fill with AI bridge) with a prompt that **demands sources**. A built-in, sourced AI answer comes later, after the 13+ safety questions.

---

## Order (solo founder, 0 users)

1. **Front door + less app (cheap, high impact):** story, one-liner, first question, Home order, the "Discover useful tools" aim, the Learn tab, and the **front / background / extra** places. Mostly copy, ordering and one catalog field.
2. **Finds v1:** the card format + 30 Finds + "Today's Find" on Home + **Add to my area / Make it a project**, built on the catalogs you have.
3. **Close the loop:** "Trying now" on life areas, personal practice (games pull from what you opened), and "how did it go?" → Used N×.
4. **Real phone + 5-person test.** Pick people who **feel behind on tech**. Did they find something useful, understand it, and try it?
5. **Then** the "Tech for the rest of us" track, park the v1 items, and Plus = tracks.

**The screen test still applies:** *more capable or more managed? Can they see why? Their want or ours? Stronger, or just more hooked?*
