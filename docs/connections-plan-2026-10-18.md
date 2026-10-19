# Connections: pull from and push to the apps people already use

*2026-10-18. Part of the [refocus plan](refocus-plan-2026-10-18.md). **Approved 2026-10-18.** Built in phases, not all at once. Phase A is Build 1's second PR (`feature/connected-apps`).*

## The goal

People already use **different apps**. Deskartes **meets them there**:

- **Pull in** what they did and what they have: workouts, tasks, events, notes, highlights, money, mood.
- **Push out** what to do next: today's steps, Finds, lesson takeaways.

**The data serves the vision, not management.** Pulled data shows up as **proof on a life area** ("3 workouts this week"), **"Used N×"**, and **today's step**. Deskartes never becomes the place you *manage* those things. The other apps stay the source.

---

## One layer for every app

Every app, however different, turns into **three kinds of signal**:

| Kind | Examples | Where it lands |
|---|---|---|
| **Done** | Finished a workout, a task, a habit, a course lesson | A check on the **life area** + **Used N×** on the Find or lesson |
| **Stuff** | A task, an event, a note, a link, a Kindle highlight | The **Inbox** → becomes a Find, a step or a Vault note |
| **Numbers** | Steps, sleep hours, money spent, mood | The life area's **then vs now** |

**Two small tables** hold every connection:

- `connections`: who, which app, what they allowed, status, last sync
- `signals`: who, which app, kind, life area, date, a short summary, plus the app's own id so nothing is counted twice

**Store summaries, not raw data.** "Ran 5 km, Tue" is enough. The full workout stays in Strava.

**Each app is one small connector file** with the same four parts: **connect**, **pull** (since last time), **push**, **disconnect**. Adding app #21 never touches a screen.

**Where people see it:**

- **Make it yours → Connections** (a background place): the list of apps, on/off, what each one shares.
- **In context**, where it helps: the Physical area says *"Connect Apple Health to see your workouts here."* **Never a new tab.**

---

## Four ways to connect (cheapest first)

| Way | How it works | Reach | Cost |
|---|---|---|---|
| **1. On the phone** | The phone already pools other apps into hubs: **Calendar**, **Reminders**, **Health**, **Share sheet**, **Files** | Hundreds of apps feed these hubs: Google/Outlook calendars, Strava, Fitbit, Garmin, Oura, MyFitnessPal… | **Free, no server** |
| **2. Automation hubs** | Deskartes gets **webhooks + a personal key**. Users wire it up in **Zapier, Make, IFTTT or n8n**, plus **iOS Shortcuts** | **Thousands** of apps, with no code per app | One build, then free |
| **3. Direct connections** | Sign in to the other app (OAuth) and sync both ways. An OAuth broker like **[Nango](https://www.nango.dev/pricing)** handles the sign-ins (its free tier covers OAuth for 190+ APIs), or edge functions do it by hand | The **most-requested** apps, with the best experience | Per app; add 1–2 per release |
| **4. Heavy / regulated** | **Bank accounts** (Plaid, Teller); **AI assistants** via an MCP server (like FamilyWell's) | Banks; Claude, ChatGPT | Cost and compliance (banks); **adults only** |

---

## Which apps, which way

| App | Life area | Pull | Push | Way | Phase |
|---|---|---|---|---|---|
| **Any app's share button** | Any | Links, text, videos | Plans, lessons, Finds | Share sheet | **A** (built) |
| **Google / Outlook / iCloud Calendar** | Any | Events (to fit today's step around them) | Today's steps | Phone calendar | **A** (read + write **built**) |
| **Apple Reminders** | Any | Reminders → Inbox | Steps as reminders | Phone (iOS) | **A** |
| **Files: CSV / JSON / Markdown** | Any | Exports from Daylio, Day One, Loop Habits, bank CSVs, YNAB | Markdown, CSV, calendar file | Files | **A** (Markdown/CSV import exists) |
| **Apple Health / Google Health Connect** (fed by Strava, Fitbit, Garmin, Oura, MyFitnessPal…) | Physical, Mental | Workouts, steps, sleep, mindful minutes, mood where supported | Focus sessions as mindful minutes | Phone | **B** |
| **Zapier / Make / IFTTT / n8n** | Any | Anything they connect | Step done, Find saved, lesson finished | Automation hub | **C** |
| **iOS Shortcuts** | Any | "Add to Deskartes" from anywhere | "What's my step today?" | Automation hub | **C** |
| **Todoist** | Professional, any | Tasks → Inbox | Steps | Direct | **D** |
| **Google Tasks** | Any | Tasks | Steps | Direct | **D** |
| **Microsoft To Do** | Professional | Tasks | Steps | Direct | **D** |
| **TickTick** | Any | Tasks | Steps | Direct | **D** |
| **Notion** | Any | Pages and database rows → Vault | Lessons, plans | Direct | **D** |
| **Readwise** (Kindle, articles) | Mental, professional | Highlights → Vault + Remember this? | | Direct | **D** |
| **Raindrop** | Any | Bookmarks → Finds / Vault | Finds | Direct | **D** |
| **YNAB** | Financial | Month's spending by category | | Direct | **D** |
| **Strava** | Physical | Activities (if not already via Health) | | Direct | **D** |
| **Habitica** | Any | Habits done | Steps as to-dos | Direct | **D** |
| **Google Calendar (web)** | Any | Events for the web version | Steps | Direct | **D** |
| **Duolingo, Khan Academy, Coursera, YouTube** | Mental, professional | **No useful public APIs.** "I finished it" check-in from the Find | Link out | Link + check-in | **A** |
| **Bank accounts** | Financial | Balances, spending totals | | Plaid / Teller | **E** (adults only, if asked) |
| **Claude / ChatGPT** | Any | | Read your steps and Finds, add to the Inbox | MCP server | **E** |

**Apps with no API at all:** a Find's **"Use it in [App]"** button opens the app (or its store page). When they come back, **"Did you set it up? → Yes"** counts it. That tap is the sync.

---

## Phases

| Phase | What | Gets you |
|---|---|---|
| **A** (with the first phone build) | Share in/out, Calendar read/write, Reminders, Files import/export, link + check-in | Most people covered on day one. **Little new code**: much of it is built and waiting on a phone build |
| **B** | Apple Health + Health Connect | Real **then vs now** on Physical and Mental, from whatever fitness/sleep apps they use |
| **C** | Webhooks + Zapier/Make/IFTTT/n8n + iOS Shortcuts | The **long tail**: thousands of apps, no per-app code |
| **D** | Direct connections, **1–2 per release**, picked by a **"Request an app"** button that counts votes | The best experience for the apps people actually ask for |
| **E** | MCP server for AI assistants; bank data only if adults ask | Power users |

## Rules

1. **Pull what serves the vision.** If a signal doesn't show up on a life area, a Find or today's step, don't pull it.
2. **Consent per app**, in plain words: what it reads, what it writes. **One-tap disconnect deletes** that app's signals.
3. **Teens (13–17):** no bank connections. Health stays opt-in, with a plain explanation.
4. **Tokens encrypted on the server** (Supabase Vault). **Never sold, never shared.**
5. **No new tabs or screens per app.** Connections live in Make it yours; their data shows up where it helps.

## Before any of this

- **A real phone build** (EAS dev build). Health and share-in need native code, so they can't run in Expo Go or on web.
- **Edge functions deployed.** Phases C–E need a server, and the functions were returning **404** as of Oct 12.
- **Privacy policy** lists every connection and what it reads.

*Sources: [Nango pricing](https://www.nango.dev/pricing), [react-native-health-connect](https://github.com/matinzd/react-native-health-connect/releases) (Health Connect, needs a dev build and Android 8+), [react-native-healthkit](https://docsearch.algolia.com/mcp/docs/repo/kingstinct/react-native-healthkit) (HealthKit, with an Expo config plugin). Check each library's docs for mood/"state of mind" support before promising it.*
