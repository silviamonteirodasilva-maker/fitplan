# pinch · brand reference

Last updated: May 2026
Status: locked

## Name

**pinch** (always lowercase, no caps, no exceptions)

Tagline (long): your kitchen, finally figured out.
Tagline (short): a meal planner that doesn't take itself seriously.
Tagline (full): a meal planner that doesn't take itself seriously. (it does take your protein seriously.)

## Colors (4 total)

| Token         | Hex      | Job                                                           |
|---------------|----------|---------------------------------------------------------------|
| ink           | #0A0A0A  | structure, primary text, dark surfaces, the "tech" feeling    |
| hot pink      | #FF2D87  | brand primary, fresh-today states, primary CTAs               |
| acid green    | #D4FF3D  | secondary accent, batch-cook states, success, the i-dot       |
| paper         | #F5F1EB  | default app background, warm neutral, breathing room          |

Pure white (#FFFFFF) is not in the palette. Use paper everywhere instead.

### Color rules

- ink is the structural backbone. Use it for primary text, the active nav tab, the active meal card background.
- hot pink is loud. Use it surgically inside the app: the "fresh today" tag, the active state of the primary CTA, the brand period in the wordmark. Use it maximally on marketing surfaces (splash screens, landing page, empty states).
- acid green is the second voice. Use it for "batch cook" tags, success confirmations, the dot in the app icon, secondary accents. Never use pink and green on the same UI element competing for attention; one or the other.
- paper is the canvas. Almost everything sits on paper.

## Fonts (2 total)

Both free, both on Google Fonts.

| Font              | Job                                                  |
|-------------------|------------------------------------------------------|
| Inter             | 95% of the app: headlines, buttons, navigation, body, numbers, settings, every label |
| Special Elite     | Meal names and recipe titles only. Nothing else.     |

Inter weights: 400 (regular), 500 (medium). Never bold (700), never light. Two weights only.

Special Elite is monospaced and slightly inked, like a typewriter. It only appears on the food itself: the recipe name on a meal card, the recipe title on a recipe page, the ingredient names in an ingredient list. Not on UI chrome, not on headings, not on buttons.

### Font rules

- Inter is set tight on large sizes (-0.04em letter-spacing on anything 32px+). Default letter-spacing on body text.
- Special Elite is set at default tracking. Don't compress it; it's already monospaced.
- Headings: Inter 500, sentence case, never ALL CAPS, never Title Case.
- Tiny labels (timestamps, tags like "BATCH" / "FRESH"): Inter 500, uppercase, letterspacing 0.08em–0.12em.

## Logo system

Three lockups, all in `logos/`:

- **pinch-wordmark-light.svg** — for use on paper or any light surface
- **pinch-wordmark-dark.svg** — for use on ink or pink surfaces
- **pinch-app-icon.svg** — 1024×1024, the iOS/Android app icon
- **pinch-mark.svg** — 64×64, the icon-only mark for use in app headers, favicons, social
- **favicon.svg** — 32×32, simplified for browser tabs

The wordmark always ends with an italic pink period (Fraunces Italic or Georgia Italic as fallback). That period is part of the logo and never omitted.

The app icon: black rounded square, lowercase pink "p", small acid green dot upper-right. The green dot represents "the pinch."

## Voice

Lowercase by default. Casual but not childish. Never says wellness, journey, mindful, balance, transform, glow up. Says things like "your week, sorted." "two of you, one kitchen." "eating out tonight." "tonight you're cooking, don't overthink it." Has a small symbol vocabulary: → for forward, · as separator.

## Don'ts

- No green (sage, forest, mint, olive). The only green is acid green #D4FF3D.
- No emoji decoration in product UI (acceptable in marketing copy and tooltips, sparingly).
- No drop shadows, no gradients inside the app (gradients fine on marketing splash screens).
- No bold weight on Inter. Two weights only.
- No Title Case. No ALL CAPS except for tiny meta labels under 12px.
- No Special Elite outside meal names and recipe titles. It loses its job if it's everywhere.
