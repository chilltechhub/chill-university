# Planner parity: Today vs the old Planner (shake-up P3)

Every row of `docs/shake-up-plan-2026-10-21.md` §3.2, with the steps to check it on Today (DASHBOARD_V2 on) and what you should see. Walked 2026-10-22 on `feature/shakeup-p3`.

**How each line was checked**

- **Walked:** by hand in the web preview, as a guest (127.0.0.1:8099, mobile, light and dark), and on the founder's account with Today switched on from Make it yours, then switched back off.
- **Check:** covered by `scripts/check-planner.mjs` (pure parts and source wiring).
- **Code:** read in the code, not clicked. The component is unchanged from P1, or the case needs data the walk didn't have.
- **Later:** belongs to a later phase. The phase is named.

Turning Today on: new accounts and welcome guests get it automatically. Existing accounts use **Make it yours → Today as your planner**. Off brings back the old Home and the old Planner.

## Control row

| # | Feature | Steps | Expected | How |
|---|---|---|---|---|
| 1 | Day / Week / Month | Tap each chip in the control row | The board, the week grid, or the month. TourSpot `planner-views` sits on the chips | Walked (guest + account), Check (`check-tour-spots`) |
| 2 | Prev / next, back to today | ‹ › on Day, Week and Month. Tap the date | Moves a day, a week or a month. **"Back to today"** shows only when today is off screen. Tapping the date returns to today | Walked |
| 3 | Tap a day → Day | Tap the 28th in Month. Tap a day column in Week | Day view on that day | Walked |
| 4 | Time grid ↔ list | Toggle in the **Your day** header (also ⋯ → Show as a list) | Switches views. Same key `@cth_planner_time_mode` | Walked |
| 5 | Week grid ↔ list | Toggle in the Week header | Switches. Same key `@cth_planner_week_layout` | Walked |
| 6 | Now-line | Day view on today, time grid | A line at the current time | Code (`TimeView` draws `CurrentTimeLine` on today, embedded too) |
| 7 | Empty day | A day with nothing planned | Time grid: "Tap a time below to plan something then." List: the sleepy cat and a line on what to do | Walked (grid), Code (list) |
| 8 | Life-area filter | Full: **All areas** chip. Calm: Options → Filter by life area | The area sheet. The chip shows the count when a filter is on | Walked (chip and Calm menu entry), Code (sheet unchanged). Filtering *widgets* by area, plus "Only my path" and "Deliverables only": **Later (P6)**, they need paths and deliverables |
| 9 | One area on = default for add | Filter to one area, then + Add | The composer starts in that area | Code (`usePlanner` `defaultArea`) |
| 10 | Profile scope | ⋯ with more than one profile | "Show all profiles / this profile only". Day defaults to this profile. **Week/Month default to every profile** (the calendar's scope) | Check (scope wiring), Code (menu shows it only for 2+ profiles) |
| 11 | Guests | Keep going as a guest, + Add → Plan something | Saved on the phone, shows in Day, Week and Month. Account-only rows (Reminder, Note, From ideas, Bring stuff in) show a lock and open the sign-in sheet | Walked (added two test plans, then deleted them) |

## Adding

| # | Feature | Steps | Expected | How |
|---|---|---|---|---|
| 12 | + Add | Tap **+ Add** in the control row | The add sheet: Plan something, Reminder, Note, From ideas, then Bring stuff in. TourSpot `planner-add` is on the button. It works with every widget hidden | Walked |
| 13 | Tap an empty slot | Time grid, tap a free slot | The composer at that time | Code (`TimeView` `onAddAt` → `openAdd(time)`, unchanged) |
| 14 | Quick add | Type "P3 quick test fri 3pm" in Quick add | Preview "Tomorrow · 3:00 PM", then "Added", and it shows on Friday at 3pm | Walked. In Week/Month, + Add opens the composer on the picked day (walked: Week on the 28th → composer on the 28th). The one-line quick add is a Day widget |
| 15 | Add from ideas | + Add → From ideas | The ideas panel (account only) | Walked (row present, locked for guests). Moved out of ⋯ on Today |
| 16 | Fill with AI, Plan from a link, Capture Inbox | + Add → Bring stuff in | Each opens its screen (account only) | Walked (rows present). Screens unchanged |
| 17 | Plan time for a deliverable | Deliverable card → Plan time | — | **Later (P6)**, no deliverables yet |
| 18 | Composer fields | Open the composer | Title, suggestions, area, repeats, date, time, More options (reminder, length, notes, link) | Walked. Unchanged since P1 |
| 19 | Link to a class, game, quest or project | Composer → More options | Pickers as before | Code (unchanged) |
| 20 | Repeats | Add a daily habit | Series filled at once. Topped up once a day on focus | Check (force top-up after a repeating add), Code (daily run on focus) |
| 21 | Reminders | Composer → More options → reminder | As before | Code (unchanged) |
| 22 | Every add counts for goal steps | Add a plan | Fires `planner-item-added` with its area | Check |

## The day

| # | Feature | Steps | Expected | How |
|---|---|---|---|---|
| 23 | Rows | Your day | Tick with haptic, notes, profile label, length. A past unticked row says **"Still open"** (neutral grey), with Do now / Move to today / Drop | Walked (rows), Code (past-day badge, copy changed from "NOT DONE" this phase) |
| 24 | Item sheet | Tap a row | PlanDetailSheet: Done, Skip, Edit, Tomorrow, Pick a day, Delete (asks first, in the sheet) | Walked (deleted both test plans this way) |
| 25 | Still open | Edit layout → show **Still open** | What you were halfway through, never "overdue" | Code (wraps the Planner's backlog). Off by default |
| 26 | Deadlines | Your day on a day with one. **Due this week** widget | Due list inside Your day. The widget lists the next 7 days | Walked (Month dots and Week items on the account), Code (widget) |
| 27 | Phone events | Connected phone calendar | Inside Your day | Code (unchanged `PhoneEventsList`) |
| 28 | Check-in | Your day (signed in). Optional **Check-in** widget | The daily check-in under the Your day header | Code |
| 29 | Day progress | Your day header | "0 of 1 done". No percent | Walked |

## ⋯ menu

| # | Feature | Steps | Expected | How |
|---|---|---|---|---|
| 30 | What's next? | ⋯ → What's next? | The guide's next step (the FAB's action, here because the FAB steps aside on Today) | Walked (entry present) |
| 31 | Phone calendar | ⋯ → Phone calendar | Connect or copy out. A guest gets the sign-in sheet | Walked (entry). Sync after changes is gathered into one call | 
| 32 | .ics export | ⋯ → Add to my calendar | The next 30 days as a file | Walked (entry), Code |
| 33 | Tidy up duplicates | ⋯ → Tidy up duplicates | Same duplicate rule as before | Walked (entry), Code |
| 34 | Weekly review | ⋯ → Weekly review (signed in) | As before | Code. The Sunday card and "then vs now": **Later (P6)** |
| 35 | Edit layout | ⋯ → Edit layout. Hide Quick add, Done | The card leaves the board and waits in the tray. Saved per profile (`todayLayout:<profile>`), Home's own layout untouched | Walked (hidden, saved, restored) |
| 36 | Calm / Full | Calm button, or Options → Show everything | Switches the view. One setting (`homeView`) | Walked |

## Month, links in, the rest

| # | Feature | Steps | Expected | How |
|---|---|---|---|---|
| 37 | Month view | Month | Today filled, days with plans ringed, all-done ring, **due dots** | Walked (account: dots on Oct 1–6, 12, 19, 26) |
| 38 | Links in: `date`, `addFor`, `editInstance`, `review`, `view` | Open a link to `PlannerScreen` | Today on that day, with the composer, the edit sheet or the review open | Walked (`date` → Nov 5, `addFor` → composer in Mental), Check (all five) |
| 39 | Old Planner links | ReminderComposer, AreaPlanCalendar "+ Plan", Capture Inbox date, NotificationCenter review, goal steps | They still name `PlannerScreen`, and land on Today. A goal step like "Put one thing in the Planner" opens the composer here, in its area | Walked (redirect), Check (goal step rule) |
| 40 | Drag to reschedule | — | — | **Later (P10)** |

## P3 acceptance, beyond the rows

| Item | Result |
|---|---|
| Saved layouts migrate | Walked on the account: the old Home layout became Today's (old card names mapped, retired ones dropped, the day's cards together, Find under them). Check covers the rules |
| Calm and Full show the same items | Calm draws a subset of the same widget keys, in the board's order (Check). Same data hook |
| Week/Month show every profile for people on "all" | Check (calendar scope, `SCOPE_ALL` default) |
| Every old FAB action is reachable | What's next → ⋯. Calendar → Week. Reminder, Note, Plan from a link, Capture Inbox → + Add. New Project → the FAB on Learn and Library (it only steps aside on Today) |
| Phone sync once per change | Check (`syncPlansToPhoneSoon` only) |
| `grep -rn CalendarModal src context App.js` | Comments only (12 lines) |
| Rollback | Today off on the account brought back the old Calm Home and the FAB (walked) |

## Found and fixed during the walk

- **Old Planner links lost their day.** A screen opening `PlannerScreen` drew the old Planner for a frame while the Today setting loaded, and that Planner used up the link's params. The setting now carries its last answer to new screens, and the Planner route waits for it. Before, any new screen could also switch the route alias off for a moment.
- **Calm's week ignored ‹ ›**, and opening another day from it showed today. The week now follows the control row. Calm on another day shows that day's plan.
- **"Back to today"** showed on Week/Month even with today on screen.
- **Edit layout** logged a stray-text error, and its buttons were all called "Remove". Now they say "Hide Quick add" / "Show Quick add".
- **A card's bare "Planner →"** on Today (Study blocks, habits, "Nothing planned") went nowhere. It now opens + Add.
- **"Missed" (red) and "NOT DONE"** became a neutral **"Still open"** (North Star: never overdue).
