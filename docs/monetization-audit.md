# Monetization and marketing plan: audit against the code

Checked 2026-09-22 against `main` (after PR #15) and the live Supabase project.
✅ = in place · 🔧 = fixed in this pass · ⛔ = blocked on you · 💬 = your decision · ⏳ = not built / not started.

## Product and monetization

| Plan item | Status |
|---|---|
| Plus + RevenueCat + paywall with price, renewal, restore, legal links | ✅ `PlusScreen`: store price, trial wording, auto-renew and cancel text, Restore, Manage/cancel, Terms and Privacy |
| Yearly shown first on the paywall | ✅ |
| Free core stays free (capture, first goal, drills, projects, planner, Fill with AI) | ✅ Only 4 catalog features are `paid`: organization, insights, ai-import, custom-paths. Business courses keep the first lesson of each level free |
| Plus promise frozen at 3–5 bullets, mapped to real features | ✅ The paywall's 5 perks match the 4 paid features plus the business courses exactly |
| Earn gates stay separate from paid | ✅ 9 `locked` (earn) and 4 `paid` gates. No feature is both |
| No Plus doors until the store is live (`plus_on_sale`) | ✅ No row in `app_config`, which means off. Help's Plus questions are hidden too |
| Paywall `from` copy for the main entry points | 🔧 Added `ai-import`, plus per-feature headlines ("Deep Insights is part of Plus.") from the unlock sheet |
| Fill with AI kept free and shown next to AI Import | 🔧 The Import banner told free users they were "using the shared AI", but the server refuses that without Plus. The banner is now honest, and there's an in-place card with **Fill with AI (free)**, **See Plus** (only when on sale) and **Use my own key** |
| Server's "AI Import is part of Plus" message reaches the user | 🔧 `functions.invoke` swallowed it into "non-2xx status code". The message is now read from the response body |
| Nothing regulated inside the subscription (dispute letters, entity filing) | ✅ `ownershipCurriculum.js` deliberately doesn't generate dispute letters. No "we file for you" copy |
| Webhook → `profiles.plan` in production | ⛔ The SQL is applied (the `plan_period` column exists, `plus_events` is locked down). **`revenuecat-sync` and `parse-import` are not deployed** (404), so AI Import fails for everyone and purchases wouldn't reach accounts |
| Turn `plus_on_sale` on only when purchase works on a device | ⛔ Needs store products, RevenueCat keys, a dev build and the functions above |
| Pricing | 💬 Built as **$2.99/mo, $24.99/yr, 7-day trial**. The plan suggests testing $6–12/mo and $40–80/yr. Prices live in App Store Connect and Play Console, so no code change either way |
| Post-first-goal soft Plus card | 💬 Not built. It would compete with the one-next-action Home, and there's nothing to buy until Plus is on sale. The Compass already lists Plus on the last stage |
| What not to monetize (consent, deletion, export, privacy, streaks) | ✅ All free. No pay-to-keep-streak |

## Support and trust

| Plan item | Status |
|---|---|
| Support email + FAQ (billing, kids, delete account) | 🔧 Help FAQ adds: what's free vs Plus, cancel/restore (both only once Plus is on sale), why some courses are hidden (age and unlocks), delete account/export data, and the support email. Settings → **Contact support** (mailto help@chilltechhub.com, the address the Terms use) |
| Privacy policy and Terms links | ✅ Onboarding, Login, Settings, Plus |

## Metrics

| Plan item | Status |
|---|---|
| Activation (first goal finished) | 🔧 `docs/metrics.sql` query 1, from `user_objectives` |
| D1 / D7 | 🔧 `docs/metrics.sql` query 2, from `activity_log` (a lower bound: only point-earning days) |
| Purchases, trials, refunds | ✅ RevenueCat dashboard. `docs/metrics.sql` queries 3–4 once the webhook is live |
| Paywall views → purchase start → success, by `from`; Fill with AI uses | 💬 Nothing records these. It would need a small first-party event table (and a line in the privacy policy) |

## Marketing (outside the codebase)

| Plan item | Status |
|---|---|
| One positioning line on the site and the store | ⏳ |
| 4–6 screenshots + a 15s preview in Plain light mode | ⏳ Home (Compass first), a drill, the Workshop, Capture |
| Age rating 12+, category | ✅ Decided (12+). Set it in the store listings |
| One acquisition channel for 4 weeks | ⏳ The plan recommends students/parents first |
| Store listing draft (subtitle, description, captions) | ⏳ The plan's option (B) |
