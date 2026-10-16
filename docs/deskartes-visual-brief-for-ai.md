# Deskartes: visual and UI/UX brief for analysis

> **For the AI reading this:** this is a plain-language description of how a not-yet-launched phone app **looks and feels**. The founder wants **best-in-class visuals**. Use it to critique the design, compare it to top apps, and recommend a visual direction and the order of work. You can't see the app, so every screen is described in words below. If screenshots are attached, trust them over this text.

---

## Context

| | |
|---|---|
| **What it is** | A phone app that combines planning, learning and self-improvement: save what you learn → turn it into a plan → do it → see it add up. Also has courses, short games, life-area tracking, and game-style rewards (XP, levels, a pet). |
| **Stage** | Built, **not launched**, **0 users**. Seen only in a web build at phone size; **never on a real phone**. |
| **Team** | One founder. |
| **Audience** | Consumers **13 and up**, everyday people, not just power users. The founder wants a **daily staple**, not a niche nerd tool. |
| **Values** | Calm and honest: no manipulative design, minimal notifications. |
| **Platform** | iOS + Android (React Native). Phone first. |

---

## How the app is laid out

- **3 bottom tabs:** **Library** (all tools) · **Home** (dashboard) · **Training** (games + your character).
- **Top bar:** a small square badge on the left (shows your rank as an emoji, and opens a menu: Profile, Help, Tutorial, Make it yours, Settings, Search), a level/points pill, a notification bell.
- **A floating round + button** (bottom right by default, movable to any corner) with 7 shortcuts.
- **Most tools open as full screens** from the Library, with a back arrow.
- **Guidance:** a character guide ("Sage") shows tip bubbles on first visits to each screen.

## The visual system today

| Piece | Description |
|---|---|
| **Modes** | **Light** ("Daylight": cool grey page, white cards) and **Dark** ("Command": neutral slate, not pure black). |
| **Styles** | Two looks you can pick, independent of light/dark: **Plain** (the default: system font, sentence case, rounded soft cards) and **Command** (a "mission control" look: monospace uppercase labels, a squared-off display font for titles, sharper corners, thin borders). |
| **Accent colours** | Teal (default), Gold, Slate. In dark mode, teal is a bright **mint** with dark text on it. In light mode, it's a **muted dark teal** with white text. |
| **Other colours** | 8 life-area colours (red, teal, purple, green, amber, gold, violet, blue) and 9 subject colours. Gold is used for rank, points and the "Play" button. |
| **Type** | System font for body text. Display font: **Rajdhani** (squared, techy). Labels: **JetBrains Mono**. Easy-read option: **Atkinson Hyperlegible**. Sizes 11–34. |
| **Shape** | Plain cards have 14px corners; Command cards 6px. Pill-shaped chips and segmented controls. |
| **Depth** | Mostly thin borders; soft shadows exist but are rarely used. |
| **Icons** | Thin outline icons (Ionicons) plus lots of **emoji** (there's a "show emojis" switch). Emoji look different on iPhone, Android and web. |
| **Illustration** | **Pixel art** for your character (39 options), pet (35) and scene backgrounds (23), taken from **about 25 different free art packs**: fantasy RPG, cyberpunk, gothic, anime school, monsters, street animals, gangsters. They vary in pixel size, palette and outline style. |
| **App icon** | Flat vector: a **teal pencil forming a "D"** with a pink eraser, on cream. A different teal from the in-app teal, and a different style (flat vector) from the in-app art (pixel). |
| **Motion** | Light: tab cross-fade, a few pop-ups and toasts. Most taps have no animation. There's a reduce-motion setting. |
| **Haptics** | Available but used in very few places. |
| **Loading** | Mostly spinning wheels; almost no skeleton placeholders. |
| **Consistency** | A shared component kit (cards, buttons, list rows) exists, but **only a handful of screens use it**. Most screens are styled one-off, so buttons, inputs and headers vary, and the Plain/Command setting doesn't reach most screens. |

## Special visual "worlds" (intentional, staying)

Some tools have their own deliberate look, and the founder wants to **keep them**:
- **Workshop (projects):** looks like a **blueprint / drafting table**: pale blue graph paper, navy ink, corner tick marks, rubber-stamp status labels (IDEA, IN PROGRESS, DONE), mono labels.
- **Idea Garden:** a **canvas of idea "plants"** connected by vines.
- **Training:** a **pixel-art game area** with your character and pet.

---

## Screen by screen (what each looks like)

| Screen | Description | Works | Doesn't |
|---|---|---|---|
| **Sign-up** | Near-black starfield, the logo, a big rounded dark card: email, password, terms checkbox, a muted teal **Create account** button with a 🛸 emoji, then **Try it first, no account needed**. | Calm, guest option is clear | Disabled button looks broken; no visual showing what the app is |
| **Onboarding** | 8 cards, one question each (what you came for, account type, how to start, features, name, focus areas, look). | One question per screen | Text-only cards, no illustration or motion between them |
| **Home** | Date line → **profile card** (avatar, "LV 1 · Starter", big pale-gold **Play** button) → "today's focus" field next to a **date tile** → **goal card** (green left edge, 3 steps, big teal **Start · about 5 minutes** button) → more cards (desk, today's plans, habits…). | The goal card makes the next step obvious | **Two big buttons compete** (Play vs Start); the date shows twice; the **+ button covers buttons and text**; "Commander" is a placeholder name |
| **Library** | Huge title with a ⌄, a segmented control **Life / Build / Knowledge**, then a 4×2 grid of **pastel circles** for the 8 life areas, a "Today" list, and "check-in due" chips. | Friendly area grid | The title repeats the segment control; pastel icons are faint; a hint explains a hidden gesture ("double-tap or hold to open"); new users see tabs with just 1 card |
| **Planner** | Title + Add + ⋯ menu; Daily/Weekly/Monthly chips; date arrows; a row of 8 area chips; then a list or an hour-by-hour timeline. | Clear controls | 3 rows of controls before any content; the timeline is plain |
| **Training** | Small caps "TRAINING CENTER" in mono, a pixel character standing on a **blank white card** with gift bubbles floating, 3 stat tiles (points, streak, tier), a brown/gold uppercase **ENTER TRAINING** button. | The character is the app's heart | Feels unfinished on a blank card; uses the Command fonts even when Plain is chosen |
| **Menu** | Bottom sheet, 6 rows, each icon a different colour. | Big tap targets | Rainbow icons |
| **Settings / Make it yours** | iPhone-settings-style grouped lists, toggles, segmented controls, **mini previews** of Plain vs Command. | **The most polished screens** | Settings is one very long page |
| **Focus timer** | Big monospace clock, Pause/Finish buttons. | Calm and focused | White text on bright colour buttons (low contrast) |
| **Celebrations** | Level-up pop-up card, small "+5 XP" / coin toasts, face-down prize cards to flip after a game round. | Calm (one celebration at a time) | No signature, memorable moment |

**Dark mode looks clearly better than light mode.** Light reads grey and flat. **Command looks more like a real product than Plain**, but Plain is the default.

---

## Main visual problems

1. **No single art direction.** The app reads as three styles stitched together: generic clean cards (Plain), a sci-fi HUD (Command), and mixed retro pixel art, plus a flat-vector icon.
2. **The default look (Plain) is generic.**
3. **Inconsistent components**: most screens style themselves, so the look varies screen to screen.
4. **No clear hierarchy on Home**: two primary buttons.
5. **The + button covers content.**
6. **Light mode is flat**: grey, thin borders, muted accent.
7. **Emoji used as UI** (the rank/avatar badge is an emoji).
8. **Empty-feeling screens for new users** (tools unlock gradually, so tabs start nearly empty).
9. **No motion or tactile feedback**: spinners, little animation, few haptics.
10. **Mixed pixel-art scale and style**, and some characters (gangster/mafia types) may not fit a 13+ wellness/learning app.
11. **Readability**: some light-grey text and white-on-bright buttons are below contrast guidelines.

## Benchmarks the founder admires

| App | Its one visual idea |
|---|---|
| **Duolingo** | Chunky shapes, one mascot, bouncy feedback on every tap |
| **Finch** | Soft pastel creature world; the pet is the UI |
| **Things 3** | Calm white space, perfect type, tiny satisfying animations |
| **Headspace** | One warm illustration style, round shapes |
| **Structured** | A colourful timeline that fills the screen |

## Directions being considered

| Option | Description | Trade-off |
|---|---|---|
| **A. Cozy pixel world** | The whole app is pixel art: UI frames, icons, scenes | Very distinctive; can feel niche; text-heavy screens fight the style |
| **B. Premium clean + pixel reward layer** *(current recommendation)* | Calm, modern, Things-level base UI; pixel art only for the character, pet and scenes, as the "reward" layer; the special worlds stay as distinct "rooms" | Broad appeal; pixel art feels special because it's rare; needs a strong base design to not look generic |
| **C. Command everywhere** | The HUD look on every screen | Strong identity; can feel cold for wellness and learning |

## Already decided (please don't re-suggest)

- **Keep the special worlds** (blueprint Workshop, Idea Garden canvas, pixel Training). Polish the seams, don't unify them.
- **Tiny uppercase "HUD" labels** in Command are a deliberate convention.
- **Low-contrast grey text** gets fixed case by case, not by changing the whole palette.
- **Calm by default**: no aggressive notifications or manipulative reward loops.
- **Phone first**; web is only for testing.

---

## Questions to analyze

1. Which direction (**A, B or C**), or a different one, gives the best visuals **for a daily, mass-market app**?
2. How should the **pixel art** fit: one consistent family, a re-palette, or commissioned art? Which characters should go?
3. What should the **light mode** look like to feel premium, not grey?
4. What's the **signature visual moment** (like Duolingo's owl or Finch's pet) this app should own?
5. How should **Home** be laid out so there's one clear thing to do, with progress and character still visible?
6. Which **motion and haptic** moments matter most for feel?
7. How should a new user's **nearly empty screens** look while tools are still locked?
8. How should the **app icon and store screenshots** match the final in-app style?
9. What's the **order of work** for a solo founder: what gives the biggest visual jump for the least effort?
