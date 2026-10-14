# Compound loop plan (2026-10-13)

The core loop of Deskartes: **what you learn turns into what you do, and you can see it add up.**

Rule from the user: **no new screens.** Every step is a small add-on to something that already exists.
Hiding weak features is **on hold** until the user decides.

## The loop, and where each step lives

| Step | Add-on | Lives in |
|---|---|---|
| 1. **Save** | (already there) | Vault, Inbox, link → plan |
| 2. **Distill** | **The one thing** + **Use it when** (two one-line fields) | Vault item sheet, top of "Put it to use" |
| 3. **Plan** | Plan time / To-do use the "Use it when" line as the title; the takeaway rides along as **Why** | Vault "Put it to use" buttons (existing) |
| 4. **Remind with the why** | **Why** block on the plan; phone reminder body adds "Why: …" | PlanDetailSheet, planReminderActions |
| 5. **Show your work** | Done on a Vault-linked plan → "Nice, you used it. **What happened?**" (optional) · **I used it** button on the item | PlanDetailSheet, Vault item sheet |
| 6. **Resurface** | **Remember this?** — your own takeaway, ask first, then **Show me** → I used it / Plan it / Not now. Spaced 1, 3, 7, 21, 60 days | Home's Today's Wisdom card (quote shows when nothing is due) |
| 7. **See it compound** | **Used N×** pill + takeaway on Vault cards; last 3 uses on the item; **saved vs used** stats | Vault list, Vault sheet, Weekly Review snapshot |
| 8. **Journal** | **+ Learned / + Used / + Tomorrow** line starters; a Learned line → **Keep in your Vault** (becomes a takeaway that resurfaces) | Planner's Daily Check-in (now "Check-in & Journal") |
| Weekly | **Use what you know** — unused takeaways offered as next week's priorities | Weekly Review "Next 3" |

## Data (no migration)
`captures.url_meta`: `takeaway`, `use_when`, `uses: [{ at, plan_id?, note? }]`, `review: { step, last }`.
Plans link back with `agenda_instances.link_type = 'vault'`; `completeInstance` records/removes the use. Code: `src/api/knowledgeUse.js`.

## Psychology behind it
- **When/then plans** (implementation intentions) beat good intentions for follow-through.
- **Recall before reveal** + **spaced gaps** is how memory sticks.
- **Reward using, not saving:** "Used N×" is the visible score; saving alone earns nothing new.
- **Every prompt is optional, one line, under 10 seconds.** Asked at the moment it matters (right after Done, at the review).
- **Your own words beat a stranger's quote**, so your takeaway replaces the daily quote when one is due.

## Not done yet / known limits
- To-dos (`tasks`) and Weekly Review priorities aren't linked to the Vault item, so ticking them doesn't add a use. Planner items do.
- Phone reminder text only verifiable on a device build.
- XP for a use is the existing `planner_done` XP; no separate bonus yet (needs a server action kind).

## Next phases
- **D. Standard bar**: quick add with typed dates ("tomorrow 5pm"), read Google/Apple calendar (expo-calendar), speed pass, empty states that say what to do next. Reminders + widget need a device build.
- **E. Polish the touchpoints**: save, takeaway prompt, done moment, Home card. Same buttons/inputs everywhere, contrast fix, haptics.

Already done before this: streak rest day (`profiles.streak_rest_on`), offline cache, one celebration per moment.
