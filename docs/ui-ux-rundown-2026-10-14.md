# Deskartes UI/UX rundown (2026-10-14)

**Goal: best-in-class visuals.** This is the full picture of how the app looks and feels today, what holds it back, and a plan to get to the top tier.

**What I looked at:** the theme and component code, plus live screenshots at **phone size (390 wide)** as a guest in **light, dark, Plain and Command**. Signed-in screens (Workshop, Idea Garden, a Planner with data, your scenic backgrounds) are judged from code and past notes. Nothing has been seen **on a real phone**.

**Settled calls this respects:** the **bespoke worlds stay** (blueprint Workshop, garden canvas, pixel Training), tiny HUD labels are a deliberate convention, and `text4` contrast gets fixed case by case.

---

## Verdict: **6/10 today, with the pieces of a 9**

The app has strong ingredients: a good **dark theme**, a distinctive **Command** style, a **pixel pet** that lives on every screen, and the **blueprint Workshop**. But right now it reads as **three apps stitched together**:

1. **Plain** (the default): clean white cards. Tidy, but **generic**.
2. **Command**: a mono, uppercase HUD. **Distinctive**, but it only reaches a few screens.
3. **Pixel art**: characters, pets and scenes from **~25 different free packs**, in different styles and scales.

The best-looking apps each have **one visual idea, applied everywhere**:

| App | Its one idea |
|---|---|
| **Duolingo** | Chunky shapes, one mascot, bouncy motion on every tap |
| **Finch** | One soft pastel creature world; the pet *is* the UI |
| **Things 3** | Calm white space, perfect type, tiny satisfying animations |
| **Headspace** | One illustration style, warm colours, round everything |
| **Structured** | A colourful timeline that's the whole screen |

**Deskartes needs to pick its one idea.** That's the biggest visual decision left (see the plan at the end).

---

## The design system today

| Piece | What exists | State |
|---|---|---|
| **Colour** | Light **"Daylight"** (steel grey + white) and dark **"Command"** (slate, not black). 3 accents (Teal, Gold, Slate). 8 life-area colours, 9 subject colours. High-contrast variant. | Dark is **great**. Light looks **flat and grey**. The app's teal doesn't match the **app icon's teal**. |
| **Type** | System font for body text. **Rajdhani** (titles) + **JetBrains Mono** (labels) in Command. **Atkinson Hyperlegible** as the easy-read option. Scale 11 → 34. | Good choices. Plain uses only the system font, so it has **no personality**. |
| **Spacing / radius** | 4-pt spacing scale. Radius 6 → 24. Plain cards 14, Command cards 6. | Solid. |
| **Shadows** | 3 levels, light and dark versions. | Barely used; most depth is borders. |
| **Icons** | Ionicons outline + emoji (1,300+ emoji strings, on a "Show emojis" toggle). | Emoji look different on iPhone, Android and web, so it's **inconsistent by nature**. |
| **Illustration** | Pixel characters (39), pets (35), backgrounds (23) from ~25 free packs. Flat-vector app icon. | **No single art direction.** |
| **Components** | Shared kit: Card, Button, ListRow, EmptyState, SectionLabel, Eyebrow, ScreenTitle. | Only **~16 files** use it. The rest hard-code styles (**~3,800 inline style objects**). |
| **Motion** | Basic Animated in 15 files. Reanimated installed but used in 3. Tab cross-fade. Reduce-motion setting. | **No shared motion language.** |
| **Haptics** | Installed. | Used in **7 places** only. |
| **Loading** | **202 spinners**, 5 skeletons. | Spinners make the app feel slower than it is. |

---

## What's already good (keep it)

- **Dark mode**: neutral slate, mint accent with dark text on it, readable cards. It's the best-looking version of the app.
- **Command style**: mono date ("WEDNESDAY, OCTOBER 14"), Rajdhani titles, sharp corners. It feels **like a product**, not a template.
- **Style picker in Settings**: live mini-previews of Plain vs Command. Lovely.
- **Make it yours**: grouped, iOS-settings-style list with icons and one-line hints. The most polished screen.
- **The + button**: big, high-contrast, movable to any corner.
- **The pixel pet walking across screens**: rare, charming, memorable.
- **The bespoke worlds**: blueprint paper with corner ticks and stamps; the Idea Garden canvas.
- **Copy**: short, with **bold** key words.

---

## What holds the visuals back (ranked)

| # | Problem | Where I saw it | Fix |
|---|---|---|---|
| 1 | **No single art direction** | Flat-vector icon, mint/gold HUD, ~25 pixel packs (RPG, cyberpunk, gothic, anime, gangsters, monsters) | Pick one direction (plan, Phase 1) |
| 2 | **Plain is the default and it's generic** | Home, Library | Give Plain a brand: a custom display font, warmer light palette, real depth |
| 3 | **The style setting barely reaches** | Command/Plain only affects ~16 files; **Training is mono HUD even in Plain** | Move every screen onto the shared kit |
| 4 | **Two primary buttons fight on Home** | Gold **Play** and teal **Start · about 5 minutes**, one above the other | **One hero button per screen**; Play becomes secondary |
| 5 | **The + button covers content** | Covers **App Nav** on the goal card and the **On the Desk** text | Add bottom padding under the + on every scroll view |
| 6 | **Light mode feels grey and flat** | Grey page, white cards, dull muted teal | Warmer paper colour, a brighter accent, soft shadows instead of hairlines |
| 7 | **Emoji as UI** | The rank egg 🐣 is the avatar, the menu button and the rank badge; 🛸 on "Create account" | Draw your own small icon set (or use the pixel art) for rank and avatar |
| 8 | **New users see empty rooms** | Library **Build** and **Knowledge** have 1 card + a dashed "more tools open here" box | Show locked tools as **dimmed preview cards** with art, not empty space |
| 9 | **Spinners everywhere** | 202 spinners | Skeleton cards for lists, dashboards and feeds |
| 10 | **No motion personality** | Taps don't respond, cards just appear | Press-scale on buttons, cards that ease in, one **signature** celebration |
| 11 | **Hidden gestures need instructions** | Library: "Double-tap or hold an area to open it · one tap filters the list" | One tap opens. Filter with a separate chip row |
| 12 | **Pixel scale is mixed** | Characters from different packs at different sizes; the "^" button sits on the character's legs | **Integer scaling** (2×, 3×) only, one base pixel size, a proper stage under the character |
| 13 | **Rainbow icon colours** | Top menu: green, purple, teal, gold, grey, teal icons | One icon tint per surface; colour only where it means something (life areas) |
| 14 | **Small polish bugs** | Placeholder clipped ("6 or more character…"); guest Planner's **Sign in** button left-aligned; the tour bubble's text clips with a scrollbar; "Create account" disabled state looks broken | Quick fixes |
| 15 | **Readability** | `text4` grey used as text (case by case); white text on bright buttons in Work Mode / Weekly Review | Fix the cases on the daily screens first |

---

## Screen by screen

| Screen | What it looks like | Strong | Fix |
|---|---|---|---|
| **Login** | Starfield on near-black, logo, rounded card, two buttons | Calm, clear, guest option is prominent | The disabled button looks broken; drop 🛸; add **one line of value** + a hero image |
| **Onboarding** | 8 one-question cards | One question per screen | Add **illustration per card**, a progress bar, and motion between cards |
| **Home** | Date line → Commander card + Play → focus + date tile → goal card → widgets | Clear "next step" goal card | **One hero**. Date shows twice (header + tile). "Commander" is a placeholder name. The + covers buttons |
| **Library** | Big title with ⌄, segmented Life / Build / Knowledge, 8 pastel area circles | Area grid is friendly | The title duplicates the segment control. Pastel icons are faint. Planner sits under "Knowledge" (odd) |
| **Planner** | Header, Daily/Weekly/Monthly chips, period arrows, 8 area chips, list or timeline | Clear controls | 3 rows of controls before any content. The timeline needs **colour blocks** like Structured |
| **Training** | Pixel character on a blank card, gift bubbles, 3 stat tiles, brown **ENTER TRAINING** | The pet/character is the heart of the app | Make it a **scene**: a ground, a background, light. It looks unfinished on the blank card |
| **Top menu** | Bottom sheet, 6 rows | Big targets | One icon colour |
| **Make it yours / Settings** | Grouped lists, segmented controls, style previews | **Best screens in the app** | Settings is ~170 rows; split into pages |
| **Workshop** | Blueprint paper, corner ticks, stamps, mono labels | **Unique** | Dense; capital "stamps" are hard to scan. Polish the seam where it meets regular screens |
| **Idea Garden** | Canvas of idea nodes and vines (web view) | Unique | Make sure it feels native (scroll, zoom, fonts match) |
| **Work Mode** | Big 56px mono clock, calm layout | Focused | Add a **progress ring** + ambient colour; white-on-colour contrast |
| **Celebrations** | Level-up card, reward toast with coin, face-down prize cards | One celebration per moment (calm) | Make **one** of them a signature moment worth sharing |

---

## Plan: getting to best-in-class visuals

### Phase 1 · Pick the one idea (**your decision**)

| Option | Feel | Like | Fit |
|---|---|---|---|
| **A. Cozy pixel world** | The whole app is a pixel-art place; UI frames, icons and scenes all pixel | Stardew Valley, Habitica | Very distinctive, but niche; text-heavy screens fight pixel style |
| **B. Premium clean + one charming character layer** (recommended) | Calm, modern UI (Things-level type and spacing); pixel art only for your character, pet and scenes, as the **reward layer** | Things 3 + Finch | Fits a **daily staple** for everyone; pixel art feels special because it's rare |
| **C. Command deck everywhere** | HUD look on every screen | Linear (dark), game HUDs | Strong identity, but can feel cold for wellness and learning |

**Recommendation: B.** The bespoke worlds (Workshop, Garden, Training) stay as **"rooms"** with their own look; the base UI between them gets premium and consistent.

### Phase 2 · Finish the system
- **Every screen on the shared kit** (16 files → all). This alone makes Plain/Command and the accents work everywhere.
- **A brand type pairing for Plain**: keep the system font for body text, add one **display font** for titles and numbers.
- **Warmer light mode**: paper-white background, soft shadows instead of hairlines, a brighter accent.
- **Match the app icon and the in-app teal**: pick one brand teal.
- **One hero button per screen** as a rule.

### Phase 3 · Art cohesion
- Choose **1–2 compatible pixel families** (same pixel size, palette and outline style); retire the rest or re-palette them.
- **Integer scaling only**; a standard "stage" (ground, shadow, light) wherever a character stands.
- Replace emoji UI (rank, avatar) with **your own icons** in the chosen style.
- Worth a look for a 13+ audience: the **Gangster / Wiseguy / Made Man** character set.

### Phase 4 · Motion and feel
- **Reanimated** for press-scale on every button, cards easing in, and smooth sheet and tab transitions.
- **Skeletons** instead of spinners on Home, Library, Planner and the Vault.
- **Haptics** on done, save, level-up and toggles (light, consistent).
- **One signature celebration** (for example, the pet reacting when you finish a goal).

### Phase 5 · Layout polish
- Safe space under the **+** on every screen.
- **Locked tools as preview cards** (dimmed art + "opens after your next goal") instead of empty rooms.
- **Empty states with illustration** in the chosen style.
- One header pattern (title, back, actions) across stack screens.

### Phase 6 · Storefront visuals
- App icon, splash and **App Store screenshots** in the final style. They're the first visuals anyone sees.

---

## Quick wins (an afternoon each)
1. Bottom padding under the **+** (it covers buttons today).
2. **Play** → secondary style on Home.
3. Drop the duplicate date tile on Home.
4. Centre the guest **Sign in** button; fix the clipped placeholder and the tour-bubble clip.
5. One icon colour in the top menu.
6. Training's character on a real **ground + background** by default.
