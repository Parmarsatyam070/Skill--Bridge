# SkillBridge — Design System v2 (Verified Intelligence Direction)

This replaces the old split Campus-light / Console-dark system with **one
premium, dark-first visual language** across the entire product — marketing
site and logged-in app alike. It's built by studying what six very different
premium products (a hedge fund terminal, two trading platforms, a security
dashboard, a mental-health app, and a crypto protocol site) all do the same
way, then translating that language into what SkillBridge actually is: a
platform that turns unverified claims ("I know React") into verified,
measurable proof.

---

## 0. What we took from the references, and why

Six references, one shared instinct: **serious products don't decorate, they
prove.** Every one of them puts a real number, a real status, or a real
credential on screen within the first two seconds — not a stock photo of
people smiling at a laptop.

| Reference | What it's doing | What SkillBridge borrows |
|---|---|---|
| **Blackopal** (dark hedge-fund terminal) | Huge circular typographic lockup as the hero's entire personality; real AUA/origination figures bottom-left, not fake stats | The confidence to make ONE typographic moment the whole hero — no stock photography, no illustration filler |
| **Liquid Brokers** | A glossy, abstract 3D form as the sole hero visual, with two floating glass cards reporting real metrics ("96%", "Unparalleled Market Access") | The floating verified-metric card pattern — this becomes our "Match Card" |
| **Olympus** | Real photography + floating "glass" ticker cards with live-looking data (XAUUSD, EURUSD) laid directly over the image | Confirms the floating-data-card language works over photography too, not just abstract backgrounds — useful for a future "real student" hero option |
| **Sentry** | A badge row up top ("SOC 2 TYPE II CERTIFIED", "STATUS: MONITORING") before the headline even loads | Trust badges belong ABOVE the fold, stated as fact, not tucked in a footer |
| **Mental health app** | Warm glowing orb as the single emotional focal point; every screen is 90% negative space around one glowing thing | Restraint — one glowing focal object per screen, not five competing gradients |
| **Voxel X** | Iridescent glass cubes + a live-updating list card (token prices, % change, sparkline) sitting directly on the hero | The "live list card" pattern — this becomes our "Verified Activity" card (recent matches, recent skill gains) |

None of these are finance products by accident of what we're copying — we're
copying the **posture**: dark canvas, one bold typographic or geometric
hero moment, real numbers in glass cards, credibility stated up top. That
posture fits SkillBridge better than a friendly pastel ed-tech look, because
the entire premise of the product is "don't trust the resume, trust the
verified score."

---

## 1. Visual Theme & Atmosphere

**Void canvas, one glowing focal point, real data everywhere else.**

The whole product sits on a near-black canvas. Every screen has exactly one
"hero moment" — a typographic lockup, a glowing abstract form, or a radar
chart — and everything else is quiet: small caps labels, thin borders, glass
panels. Nothing competes with the one thing you're meant to look at.

Density is allowed — this is still a dashboard product once you're logged
in — but density comes from real verified numbers (match %, scores, streak
counts), never from decorative clutter.

---

## 2. Color

### Core canvas
| Token | Hex | Use |
|---|---|---|
| `void` | `#08090C` | The base canvas everywhere — marketing and app alike |
| `panel` | `#111318` | Cards, nav bar, modals |
| `panel-raised` | `#1A1D24` | Hover states, nested panels, code blocks |
| `border` | `#2A2E38` | Hairlines, card edges — always thin, always subtle |
| `text-primary` | `#F4F5F7` | Headlines, primary content |
| `text-muted` | `#8B90A0` | Secondary text, labels, timestamps |

### Accent — the one gradient we allow ourselves
| Token | Value | Use |
|---|---|---|
| `bridge-gradient` | `linear-gradient(135deg, #2F8C82 0%, #5B7FE0 100%)` | Primary CTAs, the hero focal object, active nav state — teal-to-blue, our own identity, not a generic purple-pink AI gradient |
| `bridge-teal` | `#2F8C82` | Solid version of the gradient's start — links, icons, verified checkmarks |
| `signal-amber` | `#E8A23C` | Pending / needs-attention states (daily practice reminder, gaps) |
| `signal-green` | `#4CC38A` | Verified / matched / passed |
| `signal-red` | `#E5637C` | Gap / failed — used sparingly, always with a text label |

**The rule, same as before, stated harder this time:** one glowing gradient
object per screen. If the hero has the gradient, nothing else on that
screen gets a second gradient treatment — everything else is flat `panel`
with a thin `border`.

---

## 3. Typography

| Role | Typeface | Notes |
|---|---|---|
| Hero display | **Fraunces**, 600–700, very large (64–120px on marketing hero) | Push size hard on the marketing hero specifically — per Blackopal/Olympus, the headline IS the design, not a small line above a photo |
| UI / body | **Inter**, 400/500/600 | Unchanged — still the right choice for dense in-app UI |
| Verified data | **IBM Plex Mono**, 500 | Unchanged — match %, scores, timestamps, streak counts |
| Small-caps labels | Inter 500, `letter-spacing: 0.08em`, uppercase, `text-muted` | This is the "ASSETS UNDER ADMINISTRATION" / "TRUSTED BY SECURITY TEAMS AT" treatment — every stat, badge, or section needs one of these tiny eyebrow labels above it |

---

## 4. The Hero Visual — "The Bridge Object"

Every reference has exactly one abstract or typographic 3D-feeling focal
object. SkillBridge's version: **an abstract geometric bridge/connector
form** — two angular platforms (one representing academia, one industry)
joined by a single glowing beam of light where they meet, rendered in the
`bridge-gradient` with soft bloom, on the void canvas. It should feel like
Liquid Brokers' glossy blob or Voxel X's iridescent cubes — dimensional,
softly lit, slightly translucent — but its FORM specifically encodes
"two things becoming one connected thing," so it's never decoration, it's
the thesis of the product rendered as an object.

Use it once per major surface (marketing hero, login screen background,
empty-state illustrations) — never repeat it as a small icon or pattern
fill, or it stops being a moment and becomes wallpaper.

---

## 5. Floating Verified-Data Cards (the reusable component)

This is the single most important component in the new system — every
reference uses some version of it. Ours comes in two variants:

**Match Card** (from Liquid Brokers' stat cards) — a small glass panel,
`panel` background at 80% opacity with backdrop blur, thin `border`,
showing one verified metric big and bold in IBM Plex Mono, a small-caps
label above it, and a thin progress bar or sparkline below:
```
TRADING PAIRS  →  becomes  →  MATCH SCORE
96%                          87%
[progress bar]                [progress bar]
```

**Verified Activity List Card** (from Voxel X's token list) — a stacked
list of recent verified events, each row showing an icon, a label, a
value, and a tiny trend indicator:
```
Uniswap    $12.5   12%  [sparkline]   →   React 18      82%   +6%  [sparkline]
Bitmart    $13.7   14%  [sparkline]   →   System Design 55%   -4%  [sparkline]
```

These cards float on top of the hero object on marketing pages (exactly
like the references) and become real, functional dashboard widgets once
logged in — the Skill Radar's per-category breakdown and the Report Card's
recent-attempts list are literally this same card component, just wired to
real data instead of floating decoratively.

---

## 6. Trust Badges (above the fold, always)

Per Sentry's "SOC 2 TYPE II CERTIFIED · STATUS: MONITORING" — SkillBridge's
marketing hero gets its own credibility row directly under the nav, before
the headline:

```
[● VERIFIED SCORING ENGINE]   [AICTE-ALIGNED CURRICULUM DATA]   [ZERO SELF-REPORTED SCORES]
```

Small pill shapes, 1px border, tiny status dot where relevant (green =
live/active, matching Sentry's monitoring dot), small-caps label text.
This is a statement of fact, not a marketing flourish — it should feel like
reading a systems-status page, not an ad.

---

## 7. Buttons & Navigation

- **Primary CTA:** solid `bridge-gradient` fill, fully rounded (pill),
  white text, no shadow — the gradient itself provides enough presence
  (matches Liquid Brokers' white pill and Sentry's blue gradient button)
- **Secondary CTA:** 1px `border`, transparent fill, `text-primary` —
  used for "Explore Markets"-equivalent actions (Explore Domains, View
  Report Card)
- **Nav bar:** always dark `panel`, logo left, thin-weight nav links
  center, actions right — a small live indicator dot (green) next to
  "SkillBridge" when a student's streak is active, echoing Sentry's status
  dot in spirit
- Nav items use plain Inter 500, no pill backgrounds on inactive items —
  only the active/current section gets a subtle `panel-raised` pill,
  keeping the bar quiet until you look for the active state

---

## 8. Layout & Motion

- Marketing hero: full-bleed void canvas, generous top/bottom padding
  (120px+), the Bridge Object positioned right-of-center or full-width
  behind the headline (per Blackopal/Sentry), floating Match Cards
  overlapping its lower third (per Liquid Brokers/Olympus)
- In-app dashboards: same void/panel tokens, same card component, but
  density goes up — this is where the "Console" density from the old
  system carries forward unchanged, just re-skinned onto the new palette
- Motion: the Bridge Object gets one slow, continuous ambient
  animation (gentle rotation or breathing glow — never distracting) on
  the marketing hero, per the mental-health app reference's glowing orb.
  Everywhere else, motion stays restrained: 150–200ms transitions, one
  deliberate "draw-in" animation when a Match Card's data first appears
  (a value counting up, or the sparkline drawing left-to-right)

---

## 9. What this replaces

- The old light "Campus" theme (`#FBFAF7` paper background) is retired.
  The marketing site, login/signup, and public portfolio pages all move
  to the void/panel dark system described here.
- The old "Console" dark theme's actual token values (`#12141C` etc.)
  can be swapped for this system's `void`/`panel` values — the underlying
  layout structure (sidebar, dense cards, ConsoleLayout) doesn't change,
  only the specific colors and the addition of the floating-card visual
  language on data-heavy screens (Skill Radar, Report Card, Dashboard).
- The "Bridge Line" signature element from the old system evolves into
  the **Bridge Object** (hero-level, 3D, once per surface) plus the
  **Match Card** (component-level, everywhere a real match/score appears).
  Same idea, more premium execution.

---

## 10. What to avoid

- No stock-photo "students smiling at laptops" imagery — every reference
  here proves credibility through data and typography, not lifestyle
  photography
- No more than one gradient object visible on screen at a time
- No decorative 3D shapes that don't mean anything — the Bridge Object's
  form must always read as "two things connecting," never a generic
  crystal/orb borrowed wholesale from a reference for its own sake
- No badge/pill without a real, true claim behind it — "VERIFIED SCORING
  ENGINE" only appears once the matching engine genuinely is what's
  described in earlier audits (real LLM wiring, real OAuth, etc.) —
  don't let the design system get ahead of what the product actually does
