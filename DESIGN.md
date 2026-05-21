---
name: Sound Splittr
description: AI audio stem splitter for DJs — dark, technical, transparent
colors:
  bg-deep: "#0f172a"
  bg-subtle: "rgba(255, 255, 255, 0.03)"
  bg-hover: "rgba(255, 255, 255, 0.06)"
  text-primary: "#e2e8f0"
  text-muted: "#a0aec0"
  border: "#4a5568"
  accent: "#6c63ff"
  accent-hover: "#7c73ff"
  success: "#48bb78"
  warning: "#ecc94b"
  error: "#fc8181"
typography:
  display:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
    textTransform: "uppercase"
  mono:
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace"
    fontSize: "0.85rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "6px"
  base: "8px"
  lg: "10px"
  xl: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "20px"
  xl: "24px"
  xxl: "32px"
  xxxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "{rounded.base}"
    padding: "10px 24px"
    size: "font-size: 0.85rem; font-weight: 600; font-family: {typography.label.fontFamily}; letter-spacing: {typography.label.letterSpacing}; text-transform: uppercase"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "rgba(255, 255, 255, 0.05)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    size: "font-size: 0.8rem; font-weight: 600; font-family: {typography.label.fontFamily}; letter-spacing: {typography.label.letterSpacing}"
    border: "1px solid {colors.border}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    border: "1px solid rgba(108, 99, 255, 0.3)"
    size: "font-size: 0.75rem; font-weight: 600; font-family: {typography.label.fontFamily}; letter-spacing: {typography.label.letterSpacing}"
  button-destructive:
    backgroundColor: "rgba(252, 129, 129, 0.08)"
    textColor: "{colors.error}"
    rounded: "{rounded.base}"
    padding: "10px 20px"
    border: "1px solid rgba(252, 129, 129, 0.3)"
    size: "font-size: 0.85rem; font-weight: 600; font-family: {typography.label.fontFamily}; letter-spacing: {typography.label.letterSpacing}"
  card-surface:
    backgroundColor: "{colors.bg-subtle}"
    rounded: "{rounded.base}"
    padding: "16px"
    border: "1px solid {colors.border}"
  card-upload:
    backgroundColor: "{colors.bg-subtle}"
    rounded: "{rounded.xl}"
    border: "2px dashed {colors.border}"
    padding: "48px 32px"
  input-field:
    backgroundColor: "rgba(0, 0, 0, 0.3)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.base}"
    padding: "10px 12px"
    border: "1px solid {colors.border}"
    size: "font-size: 0.9rem"
  badge-status:
    backgroundColor: "rgba(108, 99, 255, 0.15)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    size: "font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em"
---

# Design System: Sound Splittr

## 1. Overview

**Creative North Star: "The Control Room"**

Sound Splittr is a DJ's audio control room — the interface of a well-built piece of studio hardware. Dark by default because that's where musicians live, technical in its language, transparent about what it's doing. Every element should feel like a knob, a meter, or a fader on a professional mixing console: purposeful, tactile, honest.

The system rejects corporate SaaS aesthetics — no gradient blobs, no "trust the process" copy, no stock-photo warmth. Instead it draws from the visual language of audio interfaces: Ableton's functional clarity, terminal tools' transparency, the satisfaction of seeing a waveform respond to your touch. There's warmth through the purple accent and subtle hover states, never through decorative fluff.

**Key Characteristics:**

- Dark canvas, purple accent — the surface is deep slate, the accent fires sparingly on interactive elements
- Mono for data, sans-serif for prose — monospace labels carry technical information; Inter carries the interface
- Tonal layering over shadows — depth comes from subtle background shifts, not drop shadows
- Inline settings, not hidden toggles — transparency is a principle, not a feature flag
- Micro-interactions that respond — hover brightens, active scales down, transitions ease out

## 2. Colors

A drenched dark canvas with one saturated accent. The purple fires on interactive elements and progress indicators; everything else lives in the slate family.

### Primary

- **Electric Violet** (#6c63ff): The only saturated color on the surface. Used on primary buttons, the upload zone accent, active navigation states, the progress ring, and the play button. Its rarity is the point — when it appears, it means "this is interactive."

### Secondary

- **Vivid Violet** (#7c73ff): Hover state for the accent. Brightness +15% on hover, scale(0.97) on active press. Never used at rest.

### Neutral

- **Deep Slate** (#0f172a): Main page background. The canvas everything sits on.
- **Surface Tint** (rgba(255, 255, 255, 0.03)): Cards, panels, stem player backgrounds. A whisper of white on the slate — enough to separate surfaces without breaking the dark immersion.
- **Hover Surface** (rgba(255, 255, 255, 0.06)): Hover states on interactive surfaces. Doubles the subtle tint.
- **Primary Text** (#e2e8f0): Body text, headings, labels. Warm slate, never pure white.
- **Muted Text** (#a0aec0): Secondary text, placeholders, timestamps. Cool slate, slightly desaturated.
- **Border** (#4a5568): Dividers, input borders, card outlines. The structural gray that holds the layout together.

### Semantic

- **Success** (#48bb78): Completed states, active solo toggles, green ring on completion.
- **Warning** (#ecc94b): Queued jobs, warning banners. Used sparingly — a DJ glancing at the interface should spot it instantly.
- **Error** (#fc8181): Failed jobs, error messages, delete buttons. Paired with subtle background tints, never solid fills.

### Named Rules

**The Accent Is Rare Rule.** The purple accent (#6c63ff) appears on no more than 10% of any given screen. Its scarcity makes it meaningful — when you see it, something is interactive or active. Backgrounds, cards, and structural elements stay in the slate family.

**The No-Pure-White Rule.** Never use #fff for text or backgrounds. Tint everything toward the slate family. Pure white on a dark canvas is harsh and breaks the immersion of the control room.

## 3. Typography

**Display Font:** Inter (with -apple-system, BlinkMacSystemFont fallback)
**Body Font:** Inter (with Segoe UI, Roboto fallback)
**Label/Mono Font:** SF Mono / Fira Code / Cascadia Code (monospace stack)

**Character:** Inter carries the interface with clean, confident sans-serif geometry. Mono carries the technical data — file names, timestamps, settings labels — creating a visual distinction between UI prose and machine data. The contrast between the two families is the system's typographic rhythm.

### Hierarchy

- **Display** (800, 2.5rem, 1.1): Hero title on the home page only. Tight letter-spacing (-0.02em) gives it a confident, compact presence.
- **Headline** (700, 1.5rem, 1.3): Page titles (Jobs, Settings). Bold but not heavy.
- **Title** (700, 1.25rem, 1.3): Section headers, stem list titles. Slightly smaller than page titles.
- **Body** (400, 1rem, 1.6): Descriptions, instructions, help text. Comfortable reading line length at 65–75ch.
- **Label** (600, 0.75rem, 1.0, uppercase, +0.05em): Mono font. Used for status badges, form labels, queue indicators, and technical metadata. The uppercase + letter-spacing gives it a label-maker quality.
- **Mono** (500, 0.85rem, 1.4): Technical data in prose context — file names in job cards, model names, format strings.

### Named Rules

**The Mono-For-Machine Rule.** Monospace font is reserved for data that comes from the system: file names, timestamps, model names, bitrates, GPU status. Human-written prose always uses Inter. This distinction lets users scan the interface for machine data instantly.

## 4. Elevation

**Flat by default, tonal layering for depth.** This system has no drop shadows. Surfaces are distinguished by their background tint — the subtle difference between `rgba(255, 255, 255, 0.03)` for a card and `rgba(255, 255, 255, 0.06)` for hover. Depth is conveyed through border treatment (solid 1px borders for cards, dashed 2px for upload zones) and background color shifts, not elevation.

### Tonal Vocabulary

- **Surface** (rgba(255, 255, 255, 0.03)): Default card background. The resting state of every container.
- **Surface Hover** (rgba(255, 255, 255, 0.06)): Hover state on interactive surfaces. Doubles the subtle tint.
- **Accent Tint** (rgba(108, 99, 255, 0.08)): Drag-over state on upload zone. Accent-tinged hover, signaling "this element responds to your action."

### Named Rules

**The No-Shadow Rule.** Never use box-shadow for elevation. If an element needs to feel "above" the background, use a background tint or a border. Shadows feel decorative on a dark canvas; tonal layering feels structural.

## 5. Components

### Upload Zone

- **Shape:** 12px rounded corners, generous padding (48px vertical, 32px horizontal)
- **Border:** 2px dashed border in border color (#4a5568) — the dashed line signals "this is an action area, not a container"
- **Background:** Surface tint at rest; accent-tinged tint on drag-over
- **Icon:** 72px circular container with accent background tint, centered
- **States:** Drag-over scales the icon slightly, shifts border to accent color, fills background with rgba(108, 99, 255, 0.08)

### Buttons

- **Primary:** Accent background, white text, 8px radius, 10px 24px padding, mono label font, uppercase. Hover: brightness +15%. Active: scale(0.97) press-down feel.
- **Secondary:** Subtle white background (rgba(255, 255, 255, 0.05)), text border, 6px radius. For less-emphasis actions like "Refresh."
- **Ghost:** Transparent background, accent text, accent border at 30% opacity. For tertiary actions like "Test Connection."
- **Destructive:** Error background tint, error text, error border at 30% opacity. For delete actions.

### Cards (Stem Player, Job Card, Settings Panel)

- **Shape:** 8px radius for standard cards, 12px for larger containers
- **Background:** Surface tint (rgba(255, 255, 255, 0.03))
- **Border:** 1px solid border in border color
- **Hover:** Border shifts to rgba(108, 99, 255, 0.4) — a subtle purple glow, not a background change
- **Internal Padding:** 16px standard, 24px for settings panels

### Status Badges

- **Shape:** 4px radius, compact padding (2px 8px)
- **Colors:** Background tint at 15% opacity, text at full semantic color
  - Queued: yellow tint (rgba(236, 201, 75, 0.15))
  - Processing: purple tint (rgba(108, 99, 255, 0.15))
  - Completed: green tint (rgba(72, 187, 120, 0.15))
  - Failed: red tint (rgba(252, 129, 129, 0.15))
- **Font:** Mono, 0.7rem, uppercase, +0.05em letter-spacing

### Progress Ring

- **Size:** 120px diameter
- **Track:** Border color (#4a5568), 6px stroke
- **Progress:** Accent color, 6px stroke, rounded linecap, transitions with 0.4s ease
- **Text:** Centered percentage, ring color, 1.25rem, 700 weight

### Input Fields

- **Shape:** 8px radius, 10px 12px padding
- **Background:** Dark overlay (rgba(0, 0, 0, 0.3)) — darker than card surfaces
- **Border:** 1px solid border color
- **Focus:** Border shifts to accent color (#6c63ff), no glow or shadow
- **Placeholder:** Muted text (#718096)

### Range Sliders (Volume, Seek)

- **Track:** 4px height, border color background, 2px radius
- **Thumb:** 14px circle, accent color, no border
- **Transition:** None on the track; the thumb position updates in real-time

### Navigation Bar

- **Style:** Sticky top, 56px height, 24px horizontal padding
- **Background:** Deep slate at 95% opacity with 8px backdrop blur
- **Border:** 1px bottom border in border color
- **Brand:** Accent color, 1.15rem, 700 weight
- **Nav Links:** Muted at rest, white + accent tint on active, 6px radius hover background
- **Active State:** Accent background at 20% opacity, white text

### Named Rules

**The Dashed-Border Rule.** Dashed borders are reserved exclusively for action zones (upload areas). Solid borders are for containers. If you see a solid border on an upload zone or a dashed border on a card, you've broken the visual language.

## 6. Do's and Don'ts

### Do:
- **Do** use the purple accent sparingly — on interactive elements and progress indicators only. Its rarity gives it meaning.
- **Do** reserve monospace font for machine data: file names, timestamps, model names, bitrates, GPU status.
- **Do** use tonal layering (background tints) for depth, not drop shadows.
- **Do** keep borders at 1px for containers and 2px dashed for action zones. These are distinct visual languages.
- **Do** use `filter: brightness(1.15)` for hover states on accent-colored elements. It's fast (GPU-accelerated) and feels responsive.
- **Do** use `transform: scale(0.97)` for active/press states. A subtle press-down feel reinforces interactivity.
- **Do** use `ease-out` transitions (0.15s–0.4s range). No bounce, no elastic.
- **Do** keep focus indicators visible — shift border color to accent, no glow needed.
- **Do** use semantic colors (success green, warning yellow, error red) with background tints at 15% opacity for status indicators.

### Don't:
- **Don't** use box-shadow for elevation. This system is flat by default; shadows feel decorative on a dark canvas.
- **Don't** use #fff for text or backgrounds. Always tint toward the slate family.
- **Don't** use solid fills for semantic colors. Background tints at 15% opacity are the standard; solid fills feel aggressive.
- **Don't** use more than one saturated color on screen. The purple accent is the only one — everything else is slate or semantic tint.
- **Don't** put settings behind "Advanced" toggles. Settings are visible inline; transparency is a principle.
- **Don't** use gradient backgrounds on cards or buttons. Solid colors only. Gradients feel decorative, not functional.
- **Don't** use glassmorphism (backdrop-filter blur) except on the navigation bar. The nav's blur is functional — it keeps text readable as content scrolls behind. Everywhere else, it's decoration.
- **Don't** use side-stripe borders (border-left/right > 1px as colored accent) on cards or list items. The jobs page uses a 3px left stripe for status indicators — that's the one exception, and it's intentional.
- **Don't** use identical card grids. Vary padding, gap, and card sizes based on content density. A stem player card has different proportions than a job list card.
