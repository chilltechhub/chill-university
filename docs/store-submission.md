# Store submission checklist (Deskartes v1)

Everything to do before the first App Store and Google Play submission, in
order. From `docs/audit-plan-2026-09-30.md`, Phase 3. v1 is consumer, ages
13+: under-13 signup closes by design.

Status marks: **[you]** is a dashboard/console step only you can do;
**[me]** is something I can build.

---

## 1. Run the pending SQL [you]

In the Supabase SQL editor, each file once (the CLI's migration history
doesn't match the live database, so `supabase db push` isn't safe):

1. `supabase/migrations/20260930120000_require_mfa_in_database.sql`: two-step
   sign-in enforced by the database.
2. `supabase/migrations/20260930130000_pet_coins_every_3_minutes.sql`: pet
   coins one every 3 minutes, 50 per 24 hours.
3. `supabase/migrations/20260930140000_rest_day_and_real_actions.sql`: the
   streak rest day, and XP for real-life actions.

## 2. Deploy the two missing Edge Functions [you]

Both still return 404 (checked 2026-09-30). Until they're deployed, a purchase
can't turn Plus on and AI Import fails for everyone.

```bash
supabase functions deploy revenuecat-sync --no-verify-jwt --project-ref bjwxkuhkfffslarzzznw
```

```bash
supabase functions deploy parse-import --project-ref bjwxkuhkfffslarzzznw
```

```bash
supabase secrets set REVENUECAT_SECRET_KEY=sk_... REVENUECAT_WEBHOOK_AUTH=<long random string> --project-ref bjwxkuhkfffslarzzznw
```

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref bjwxkuhkfffslarzzznw
```

- `revenuecat-sync` is `--no-verify-jwt` on purpose: RevenueCat's servers have
  no Supabase login. It checks the app's login itself.
- `parse-import` keeps the default JWT check. It calls `claude-sonnet-5`, a
  current model (checked 2026-09-30).
- Check: `curl -X OPTIONS https://bjwxkuhkfffslarzzznw.supabase.co/functions/v1/revenuecat-sync`
  should stop answering 404.

## 3. Set up Plus in the stores and RevenueCat [you]

What the code expects (`src/api/purchases.js`):

| Thing | Value |
| --- | --- |
| RevenueCat entitlement id | `plus` |
| Offering | one with id `plus`, or the current offering |
| Packages | RevenueCat's **Monthly** and **Annual** package types |
| Prices (decided 2026-09-21) | $2.99 / month, $24.99 / year, 7-day free trial on the yearly plan |
| App user id | the Supabase user id (the app logs in with it) |

1. **App Store Connect:** one subscription group, two auto-renewable
   subscriptions (monthly, yearly), and an introductory offer of a 7-day free
   trial on yearly.
2. **Play Console:** one subscription with monthly and yearly base plans, plus
   a 7-day free-trial offer on yearly.
3. **RevenueCat:** add both apps, attach the products to entitlement `plus`,
   and build the offering from the Monthly + Annual packages.
4. **RevenueCat webhook:** URL
   `https://bjwxkuhkfffslarzzznw.supabase.co/functions/v1/revenuecat-sync`,
   Authorization header = the same string as `REVENUECAT_WEBHOOK_AUTH`.
5. **`.env`:** fill `EXPO_PUBLIC_REVENUECAT_IOS_KEY` and
   `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` with RevenueCat's *public* SDK keys
   (never the `sk_` one).
6. **Turn the locks on** when you're ready to sell: `app_config` row
   `plus_on_sale` = enabled. While it's off, nothing is locked.

## 4. Decide before the first upload [you]

- **iPad.** `app.json` has `"supportsTablet": true`, so Apple will want iPad
  screenshots and will review the iPad layout. Apple doesn't let you drop iPad
  support after release. If the app isn't meant to look right on iPad yet, set
  it to `false` before the first submission.
- **Version and build:** `app.json` version `1.0.0`. EAS auto-increments the
  build number (`eas.json`, `autoIncrement`).

## 5. Make a new build [you, with me]

Needed because native modules were added since the last build:
`expo-sharing` (Export My Data shares a file) and `expo-share-intent` (share
into the app; iOS asks for a share-extension bundle id and an app group).

```bash
eas build --profile production --platform all
```

## 6. Phone QA before submitting [you, with me]

Things the web preview can't show:

- [ ] Export My Data opens a share sheet with a `.json` **file**.
- [ ] Tapping "Daily Drills open" opens Training's drills, "Streak at risk"
      opens Home, and a life-area reminder opens that area.
- [ ] The time picker inside the calendar and reminder sheets opens and closes
      cleanly, Android especially (a popup inside a popup).
- [ ] The pet finds a coin every ~3 minutes on any screen, the "Your pet found a
      coin" toast shows off Training, and nothing is earned in the background.
- [ ] Two-step sign-in (after the SQL): password, then code, then Home loads
      with your data. Password only → can't read anything.
- [ ] Sandbox purchase, restore, and the delete-account notice while Plus is on.
- [ ] Share a link into the app from Safari / Chrome.
- [ ] iOS: the tab bar clears the home indicator.

## 7. App Store Connect forms [you]

**Privacy policy URL:** `https://chilltechhub.com/privacy-policy` (live).
**[you] Fix the policy for v1 first:** it says Deskartes is "designed for
use by students in grades K-12 and above, including children under 13" and
describes parental consent for under-13s. v1 closes under-13 signup, and
Google compares the policy with your Play target audience (13+). Reword
that section to "Deskartes is for people 13 and older", keeping the
parent/guardian deletion line.
**Terms:** `https://chilltechhub.com/terms` (live, linked on the paywall).

**App Privacy ("nutrition label").** Answer for what the app really collects.
Everything is linked to the user, and **none of it is used for tracking**:

| Apple category | What it is here | Purposes |
| --- | --- | --- |
| Contact Info → Email Address | sign-in | App Functionality |
| Contact Info → Name | display name | App Functionality |
| Identifiers → User ID | account id | App Functionality |
| User Content → Other User Content | notes, projects, planner, captures, community posts | App Functionality |
| Usage Data → Product Interaction | progress, drills, activity log | App Functionality, Analytics (`docs/metrics.sql`) |
| Purchases → Purchase History | Plus, through RevenueCat | App Functionality |
| Other Data | date of birth (age gate) | App Functionality |
| Health & Fitness → Fitness | **only if** you count Life Area exercise/sleep logs as fitness data (they're typed by the person). Safer to declare it | App Functionality |
| Diagnostics → Crash Data | **only once Sentry is added** (plan 1.2) | App Functionality |

**Age rating:** answer Apple's questionnaire honestly. Notes for it:
- User-generated content: **yes**. Community posts, with report, block and an
  admin moderation queue.
- The random prize cards after a round can't be bought with money, so they
  aren't paid loot boxes.
- Links open in the phone's browser; there's no in-app web browser.
- The audience is 13+.

**Export compliance:** already answered in `app.json`
(`ITSAppUsesNonExemptEncryption: false`).

**Privacy manifest:** after the first upload, watch for an email from Apple
mentioning ITMS-91053. Expo and the installed modules ship their own
manifests. If Apple names an API, it goes in `app.json` → `ios.privacyManifests`.
There is no `ios/` folder to edit.

**App Review notes** (paste and fill in):

> Deskartes is a learning, planning and self-improvement app for ages 13+.
>
> Demo account: `<email>` / `<password>`. It's an adult account with
> onboarding complete and two-step sign-in off.
>
> You can also tap "Continue as guest" on the sign-in screen to look around
> without an account (nothing is saved).
>
> Accounts for people under 13 are not offered: entering an under-13 birth
> date during signup closes the account, by design.
>
> Plus (auto-renewable subscription, $2.99/month or $24.99/year with a 7-day
> trial on yearly) is tied to the account rather than the device: it works on
> every device you sign in on, including our web app, and unlocks
> server-side features (AI Import, organizations). That's why buying asks
> you to sign in. Restore Purchases is on the paywall. To test, use the demo
> account with a sandbox Apple ID.
>
> Community posts can be reported and authors blocked from the post's menu;
> reported posts are hidden from the reporter and go to a moderation queue.
>
> Account deletion: Settings → Danger Zone → Delete Account.

## 8. Google Play Console forms [you]

- **Target audience and content:** select **13–15, 16–17 and 18+ only**. Any
  under-13 age puts the app under Google's Families policy.
- **Data safety:** the same data types as the Apple table above. Data is
  encrypted in transit; people can ask for deletion.
- **Account deletion:** Google wants a **web page** where people can request
  deletion without the app, as well as the in-app path. **Built:**
  `delete-account.html` is in `Downloads\chilltechhubsite` (the folder that
  matches the live site). **[you]** Upload it the way you deploy the rest,
  then put `https://chilltechhub.com/delete-account` in the form.
- **App access:** the same demo account as Apple.
- **Content rating (IARC):** the same answers as Apple (user content, no paid
  random items).

## 9. Screenshots [you]

iPhone 6.9" is required. iPad 13" is also required unless iPad support is
turned off (section 4). Suggested set, all on a seeded account:

1. Home with today's plan and the pet
2. A Training game mid-round
3. The Planner day view
4. A Life Area with its actions
5. The Compass / first goal
6. A class lesson
7. Idea Garden or the Vault
8. The Plus paywall (only if Plus is on sale at launch)

## 10. Copy rules (store listing, ads, website)

**Never say:**
- "local-first", "your data stays on your device", "no cloud" (it all syncs
  to the server)
- "COPPA-compliant", "parent-approved", "for kids" (under-13 is closed in v1)
- "no data collection" (see the privacy label). "We don't track you across
  apps" or "no ads, no data selling" are true and fine.
- "earn rewards for screen time". The pet's coins reward being in the app,
  but say what it is ("your pet finds coins while you learn"), not a
  screen-time pitch.

**Don't add to the app config:** `NSUserTrackingUsageDescription` (the app
doesn't track), or camera, photo library or location permission strings (the
app uses none, and an unused permission string draws questions in review).
