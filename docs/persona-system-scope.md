# Persona System & Advisory Expansion — Scope

Status: Filled in from the Gemini transcript (`gemini_businessrework.pdf`, 2026-09-10).
ENTREPRENEUR track is specified for real. PERSONAL / STUDENT / BUSINESS are placeholder-level by your call.
Scoped against the codebase on `feature/inbox-research-import-upgrades`.

---

## A. Sequencing recommendation (unchanged, and now stronger)

Ship v1 first. Land exactly one thing from this doc before launch:

```sql
alter table public.profiles add column if not exists active_persona text;
```

Nothing else. No UI, no default value, no backfill. That single column means v1.1 doesn't need a data migration, and it costs you nothing if you never build the rest.

**Why this got stronger after reading the transcript:** you wrote Level S1 yourself. It opens with *"Level S1 prevents founders from spending months building products nobody wants."* The plan in this document is Level S2 work — building product — and you have not run S1 on it. You said it yourself earlier in that same chat: *"i already have the ct app already done, i just need users."* Users is an S1/S3 problem. None of the 180 lessons below solve it.

I'm not telling you to drop this. I'm telling you your own framework already ranked these, and it put validation first.

---

## B. Gemini's spec vs. your actual repo

The transcript's "MASTER SYSTEM & ARCHITECTURE SPECIFICATION" was written without seeing your code. Most of its technical section does not apply. Do not hand it to a coding agent as-is.

| Gemini spec says | Your repo actually is | Verdict |
|---|---|---|
| `expo-router`, file-based routing | React Navigation (`native-stack` + `bottom-tabs`), see [`App.js`](../App.js) | **Ignore.** Migrating routing for this is weeks of risk for zero user-visible gain |
| TypeScript | Plain JavaScript (`.js`) throughout `src/` | **Ignore.** Don't mix |
| NativeWind / Tailwind | `react-native-paper` + your own theme system | **Ignore.** Also: your theme hook returns long names but components expect the `{c,t,s,r}` shorthand — don't pass the raw context through |
| Zustand for state | React Context ([`UserProgressContext.js`](../context/UserProgressContext.js), `UIPrefsContext`, `TourContext`) | **Ignore.** Add `PersonaContext` in the same style as the three you already have |
| `CREATE TABLE profiles (...)` | You already have `profiles` with `xp`, `streak_count`, `grade`, `is_minor`, `date_of_birth`, `goals_completed`, `missions_completed` | **DANGER — see below** |
| `CREATE TABLE user_progress (level, xp_points, streak_count, badges_unlocked)` | That data already lives on `profiles` | **Ignore.** Creating this splits your gamification across two tables |
| `active_persona persona_mode` | — | **Keep.** Good name, matches what we'd pick anyway |
| `chilltech.com/consulting` | Your site is **chilltechhub.com** | Fix before anyone builds a link |

### The one genuinely destructive line

Gemini's spec contains `CREATE TABLE profiles (id, email, full_name, active_persona, created_at)`. Your `profiles` table is live and carries every user's XP, streak, grade, and minor status. If that statement is ever run against your database — by you, or by an AI agent handed the spec — you either get an error or you lose data. Use `alter table ... add column` only. Never `create table profiles`.

Same for `persona_configs` and `vault_documents` — those two are fine as new tables, but they need RLS policies from day one. Gemini's spec includes no RLS at all, and your most recent migration ([`20260907120000_fix_rls_and_security_definer_view.sql`](../supabase/migrations/20260907120000_fix_rls_and_security_definer_view.sql)) exists because RLS has already bitten you once.

---

## C. The four personas

### ENTREPRENEUR — specified

- **Focus:** ideation → entity setup → business credit → funding readiness → S1–S4 scaling.
- **Dashboard widgets:** Startup Validation Checklist · Vault Document Status · Capital & Credit Scorecard · Expense-to-Income Offset Ratio.
- **Game theme:** "Venture Architect / Founder's Quest" — Idea ➔ Legal Entity ➔ First Revenue.
- **Sample quests:** File LLC Articles · Set Up Business Checking Account · Complete 5 Customer Interviews.
- **Academy tracks:** Startup Track S1–S4, plus Small Business Levels 1–4.
- **CTA:** "Book a Startup Architecture Advisory Session" → chilltechhub.com booking.
- **Level-up criteria (this was an open question — the transcript answers it):** each level ends with a **Gate Review** that compiles that level's vault deliverables into a package. S1's gate is "compile research data for Level S2 engineering approval." That's your level-advance rule: *a level completes when its vault package is complete*, not when lessons are ticked.

### BUSINESS — placeholder

- Widgets: Live Revenue vs. Burn · System Audit Checklist · Active Project Sprints · Team Milestone Tracker.
- Game theme: "Empire Builder / Factory Sim."
- CTA: "Book a 1-on-1 Chill Tech Systems Consulting Call."
- **Reuses what you already have:** [`orgLabels.js`](../src/data/orgLabels.js) and the [institutional layer](../supabase/migrations/20260901120000_institutional_layer.sql) already model `business` organizations with teams, managers, employees, invite codes, and assignments. `OrganizationScreen` and `CohortRosterScreen` are already wired up. This persona is a dashboard over an existing system, not a new one.
- **Open:** revenue/burn data source. Transcript's answer: start with direct APIs (Square/Stripe/QuickBooks are all $0/mo), add an aggregator (Unified.to, ~$50/mo + $1–2/client) only past ~15 clients. Sound advice — but note this is a *whole second product* (see Section E).

### PERSONAL — placeholder

Habit rings · energy/hydration logs · RPG avatar stats (Mind, Body, Discipline). Theme: "Life RPG." Maps onto your existing Life Areas content and the MetroCity character assets you already have.

### STUDENT — placeholder

Grade trackers · exam countdowns · Pomodoro log · student budget meter. Theme: "Knowledge Tree." Your `profiles` table already has a `grade` column, and the school side of the institutional layer already models classes/teachers/students.

---

## D. Curriculum & Vault architecture

The real intellectual asset in the transcript is **Direct Learn ➔ Action ➔ Vault**: every lesson ends by producing a real artifact, and the artifacts accumulate into a lender-ready / investor-ready package.

Nine levels, five modules each, ~four lessons per module:

| Track | Levels |
|---|---|
| Small Business (cash flow) | L1 Personal Sovereignty · L2 Business Architecture · L3A Capital & Funding · L3B Real Estate · L4 Taxes & Wealth |
| Startup (venture) | S1 Validation · S2 Product/MVP · S3 Go-To-Market · S4 Venture Scale & Exit |

**That is roughly 180 lessons, and every one has its own Action Ledger row — meaning ~180 distinct interactive tools, calculators, wizards, and document generators.** Not 180 pieces of text. 180 features.

Data model (new tables, all needing RLS):

- `persona_configs` — per-user, per-persona widget layout + theme
- `vault_documents` — the artifact store
- something for lesson/action state (your existing missions system may already cover this — check before adding)

---

## E. Sizing reality check

Honest numbers, because you asked me to help you actually get there:

| Piece | Realistic solo effort |
|---|---|
| `active_persona` column + `PersonaContext` + header switcher + drawer | ~1 week |
| Per-persona dashboard widget composition + settings toggles | ~2–3 weeks |
| Vault (storage, RLS, upload, categorize, export) | ~3–4 weeks, **plus** the security work in Section F |
| One level of curriculum (20 lessons + 20 working tools, content researched and written) | ~4–8 weeks *per level* |
| All nine levels | **1.5–3 years** |
| BUSINESS persona API aggregation (a separate SaaS product) | ~2–3 months to first client |
| Monetization from zero (no IAP in the repo today) | ~2–3 weeks |

The persona system itself is not the big rock. **The curriculum is.** The switcher is a month; the content is years.

### Proposed thin slice — "Founder's Quest v0"

Instead of nine levels, ship **one**: Level 2, Modules 1–3 (entity selection, EIN, operating agreement, business banking, corporate veil). Reasons:

- It's the part people actually get stuck on and will pay for.
- It's the natural feeder into your consulting offer ($300–700 formation packages) — revenue on day one instead of year three.
- It's ~12 lessons, not 180.
- It tests the entire thesis — persona switching, vault, learn→action, consulting CTA — end to end, with real users, for one month of work instead of three years.
- If nobody completes it, you've learned that for the price of a month. That's your own S1 gate review, applied to yourself.

---

## F. Risk register

These are not style notes. Each one can end the business or the app-store listing.

### F1. Minors + adult financial content — **highest severity**

Your app today has family linking, child accounts, `is_minor`/`date_of_birth`, a kids'-consent vendor (KWS) in the privacy flow, a `grade` column, a school institutional layer, and content on nutrition, tool safety, reading, and media literacy. **It is, in part, a children's product.**

The curriculum you want to add includes credit-dispute letter generation, 0% APR balance-transfer eligibility checks, "stack $50k–$250k in unsecured business credit lines," anonymous LLC jurisdictions and nominee registered agents, land trusts, dynasty trusts, and self-directed IRAs.

Those two things should probably not live in the same app binary. Gating the persona behind `is_minor` is the *minimum*, and it may not be sufficient — COPPA obligations attach to a child-directed service broadly, not just to the screens a child happens to open. **Get an actual opinion on this before building, not after.** The realistic options:

1. Hard-gate the persona *and* the entire Academy/consulting funnel behind verified-adult accounts.
2. Ship the entrepreneur product as a **separate app** from the same LLC, sharing the codebase and Supabase project but not the child-directed store listing. Cleaner positioning, cleaner compliance, and honestly a better App Store story for both.

Option 2 is worth serious thought. It is not a retreat — it's the same engine, two front doors.

### F2. Credit repair letters — CROA

Auto-generating bureau dispute letters while charging a subscription likely makes you a **credit repair organization** under the federal Credit Repair Organizations Act. CROA requires specific written disclosures and a 3-day cancellation right, and — the part that breaks your business model — **prohibits charging any fee before the service is fully performed.** A monthly subscription that includes dispute-letter generation collides with that directly. Many states add bonding and registration on top.

Fix: teach the mechanics, let the user write their own letter, don't generate-and-send as a paid feature. Or carve it out of the subscription entirely.

### F3. Document generation — unauthorized practice of law

Operating agreements, buy-sell agreements, SAFEs, trust documents, IRS Form 2553/1919/413 pre-fills. Generating these *for* someone, tailored to their situation, is where UPL and tax-practice lines sit. The workable structure is well-trodden: blank templates clearly labeled as templates, the user fills them in, prominent "this is education, not legal or tax advice," and a referral to a licensed professional for the actual filing — where the referral is itself a revenue line.

Highest-risk items in the ledger: "Reasonable Compensation Study" and "QSBS Qualification Certificate." If those are wrong, your user eats an IRS penalty and comes looking for you. Don't auto-generate a number and call it defensible.

### F4. Vault data security — the risk that scales with your success

Today, a breach of your app exposes someone's XP and streak. Under this plan, a breach exposes **tax returns, credit reports, SSN-adjacent identity data, and connected bank feeds.**

You are a solo founder, you have no security team, and your most recent migration is an RLS fix. That is not a criticism — it's just the actual situation, and it means Phase 1 of the vault should be **user-generated worksheets and templates only**. No uploaded tax returns, no credit-report pulls, no Plaid bank connections until there's a real security review and a written incident plan. Bank-feed aggregation also drags GLBA-adjacent obligations along with it.

### F5. Content accuracy duty-of-care

You said in that chat that you're still learning this material. That's fine — teaching while learning is legitimate. But this content class is different from "how to study for STEM": if your SBA equity-injection number or your S-Corp threshold is stale, someone loses money. Build in source citations, a "last reviewed" date per lesson, and a review pass before publishing anything in L3A/L4. Tax figures change annually.

---

## G. Monetization

No payment infrastructure exists in the repo today (no Stripe, RevenueCat, or IAP). From the transcript, the intended model:

- Freemium app, premium at **$15–29/mo**
- Business formation packages **$300–700**
- SBA/grant prep services
- High-ticket consulting via the website

**App-store mechanics you'll hit immediately:** digital content and subscriptions consumed inside the app must go through Apple/Google IAP, at a 15–30% cut. But **real-world services** — consulting calls, done-for-you entity filings, grant prep — are explicitly *not* required to use IAP and can be paid on your website at full margin. That distinction is worth designing around from the start: keep the subscription lean, put the money in the services, route services to the web.

Recommend RevenueCat over hand-rolling `react-native-iap` — it handles receipt validation, restore, and cross-platform entitlements, which is a genuinely nasty surface to get right alone.

---

## H. Still need from you

- [ ] Adult-only app vs. gated persona (F1) — this decision blocks almost everything else: ______
- [ ] Are you willing to cut the initial scope to the Level 2 thin slice (Section E)?: ______
- [ ] Booking tool for consulting calls (Calendly / Cal.com / other): ______
- [ ] Where do consulting leads land (email / CRM / spreadsheet): ______
- [ ] Confirm domain: chilltechhub.com, or are you moving to chilltech.com?: ______
- [ ] Has anyone with a legal background looked at F2/F3 yet?: ______

---

## J2. Multi-profile revision (2026-09-10, later)

The single-persona model was replaced before it shipped. A persona is now the
**type** of a Profile you create, not the thing you switch between — so one
login can hold two jobs (two BUSINESS profiles), several startups, or two
personal spaces, each with its own name, targets, widgets and Vault.

Decisions taken:

- **Naming: "Profiles".** Not "accounts" — this app already has auth accounts
  and family child accounts (real separate logins linked by `profiles.parent_id`).
  Schema name is `persona_profiles`, since `profiles` is the one-row-per-human table.
- **XP, level, points and streak stay shared.** One human, one progression,
  spanning every profile. Nothing migrates, the leaderboard is untouched, and
  switching profiles never costs someone their streak.
- **Master = the signup profile.** Undeletable and undemotable (enforced by
  triggers, not just UI). It manages the others and gets the "All profiles"
  roll-up.
- **Per-device sign-out.** A profile can be signed out on one device so only
  what you want is live there; optional PIN to sign back in. Explicitly a
  privacy convenience, **not** a security boundary — anyone with the account
  password can sign any profile back in, and the PIN is app-checked, not
  database-enforced. Documented as such in the code.

New/changed files: `20260910140000_multi_profile_accounts.sql`,
`src/api/profileAccountsService.js`, `context/ProfileAccountsContext.js`,
`src/components/ProfileSwitcher.js`, `src/screens/AllProfilesScreen.js`.
Removed as dead: `context/PersonaContext.js`, `src/components/PerspectiveSwitcher.js`.

Vault rows are now keyed `(profile_id, lesson_key)` rather than
`(user_id, lesson_key)`. That change matters: under the old key, a founder
filling in the Entity Selection worksheet for one startup would have seen it
appear finished under the other.

## J. Build status (2026-09-10)

Phase 1 is built and running. What landed:

| Piece | File |
|---|---|
| Migration — `active_persona`, `persona_configs`, `vault_documents`, RLS, age-gate CHECK | `supabase/migrations/20260910120000_persona_system.sql` |
| Persona definitions + age-gate helpers | `src/data/personas.js` |
| `PersonaContext` (AsyncStorage + profile sync) | `context/PersonaContext.js` |
| Header Perspective Switcher pill + drawer | `src/components/PerspectiveSwitcher.js` |
| Persona/vault reads and writes | `src/api/personaService.js` |
| Onboarding: new first step "Your primary mission" + auto-config | `src/screens/MultiStepOnboarding.js` |
| Vault persistence on the Apply checklist | `src/components/TopicLessonPanel.js` |
| Level 2 curriculum, 6 lessons with Vault deliverables | `src/screens/classes/entrepreneurClass/businessArchitecture.js` |
| Persona gating of the adult track | `src/screens/Classes.js`, `src/data/classCatalog.js` |

**The age gate is enforced in four places**, deliberately: the DB CHECK constraint, `personasFor()` in the UI, `PersonaContext` resetting a disallowed mode on render, and `Classes.js` filtering the subject out of the catalog. Any one of them failing still leaves three.

**A gap found while testing and fixed:** "Continue as guest" resets straight into MainTabs, skipping onboarding and therefore the birth-date step. Guests were getting all four modes. Unknown age now means restricted — a guest sees Personal and Student only, and signing in with a confirmed date of birth is what unlocks the rest.

**Still open** — the Section F risks are unchanged. F1 (whether this belongs in the same binary as a children's app) is a decision, not a bug, and it is still yours to make. The curriculum deliberately teaches and checklists rather than generating documents, which keeps F2/F3 at arm's length for now — that changes the moment a lesson generates a filled-in agreement or a dispute letter.

**Before this works end to end:** run the migration. Until then the app degrades quietly — switching modes works locally, vault writes warn to console, nothing crashes.

## I. Sequencing

1. **Before v1 ships:** the one `alter table` in Section A. Nothing else.
2. **Ship v1. Get users.** This is the actual bottleneck and no feature in this doc fixes it.
3. **Then:** `PersonaContext` + header switcher + PERSONAL/STUDENT dashboards from existing Life Areas data. ~1 month.
4. **Then:** the Level 2 thin slice + vault (worksheets only) + one consulting CTA. ~1 month. This is the real test.
5. **Only if step 4 shows people finishing it:** monetization infra, then more levels, then the BUSINESS aggregation product.

Resolve F1 before step 3, not before step 5.

## K. Header/FAB cleanup (2026-09-12)

Prompted by a separate Gemini conversation reviewing the app's UI/UX (not
`gemini_businessrework.pdf` — a different transcript, this one just about
visual/usability design), cross-checked against the actual code rather than
applied at face value. One of its accurate findings: `TopBar.js` crammed the
crest, `ProfileSwitcher`, rank name, percent, streak, and points into one
row — and on a real device this wasn't just "busy," the rank text was
actually wrapping and visually colliding with the streak badge.

Changes landed:

- `TopBar.js`: collapsed level/streak/points into one compact stat pill
  (`LV 8 · 973 PTS`); the full rank label ("Beginner", "Grandmaster", ...)
  dropped from the header — it still shows on Profile. The level-progress
  bar moved to a thin full-width strip below the row instead of sharing
  horizontal space with everything else. `ProfileSwitcher` and the crest
  icon itself are otherwise untouched.
- The crest is now also a tap-menu (Profile / Help / Screen Tutorial /
  Settings / Search) instead of a direct-to-Profile shortcut. Those five
  relocated off `FloatingActionButton.js`'s speed dial, which was up to 10
  items — they were "go somewhere" utility shortcuts stranded on a "create
  something" control for a technical reason (the FAB renders above the tab
  navigator and can't reliably `navigation.navigate()` into a nested stack
  screen otherwise). The crest is root-level too, so it navigates just as
  reliably; the FAB is back down to its 5 actual creation actions (Note,
  Reminder, Project, Calendar, Inbox).
- `App.js` now passes `currentScreen` to `TopBar`, the same prop
  `FloatingActionButton` already received, so the relocated Help/Screen
  Tutorial actions still know which screen to attach to.

Deliberately not touched: `ProfileSwitcher.js` itself (still its own
component, not folded into the crest menu), and the per-tool bespoke visual
worlds (Workshop's blueprint grid, Idea Garden's node canvas, Training's
pixel art) — confirmed intentional design language, not drift, so out of
scope here.
