# Athena — Design System & Visual Token Specification

> **Category**: Visual & Styling Source of Truth  
> **Extraction Source**: `src/index.css`, `frontend/src/index.css`, `index.html`, inline Tailwind tokens  
> **Status**: APPROVED & LOCKED  

---

## 1. Color Palette

Athena uses an industrial tactile aesthetic for its frame (dark matte chassis with warm amber and red LED indicators) combined with a pristine, high-contrast, editorial paper workspace for document reviews and pipeline navigation.

### A. Primary Brand & Accent Colors

| Token Name | HEX | RGB | Usage / Semantics |
|---|---|---|---|
| **Athena Brand Orange** | `#F97316` | `rgb(249, 115, 22)` | Primary action buttons, active navigation items, high ATS indicators, brand badge |
| **Athena Orange Hover** | `#EA580C` | `rgb(234, 88, 12)` | Button hover state, critical match pill background |
| **Amber LED Accent** | `#FFA928` | `rgb(255, 169, 40)` | Hardware LED indicator, glow highlights, 4h countdown timer text |
| **Human Sign-Off Red** | `#DC2626` | `rgb(220, 38, 38)` | Mandatory human authorization gate, consultancy badge, submit button |
| **Sign-Off Red Hover** | `#B91C1C` | `rgb(185, 28, 28)` | Sign-off button hover state |
| **LinkedIn Blue** | `#0A66C2` | `rgb(10, 102, 194)` | LinkedIn export button, LinkedIn Easy Apply badges and modals |
| **LinkedIn Dark Blue** | `#004182` | `rgb(0, 65, 130)` | LinkedIn modal headers, dark accents |
| **Success Emerald** | `#10B981` | `rgb(16, 185, 129)` | Verified receipts, engine online pulse, $\ge 90\%$ ATS circular gauge |
| **Dark Emerald** | `#059669` | `rgb(5, 150, 105)` | Submitted badges, active connection indicators |

### B. Frame & Dark Chassis (Sidebars & Tactical Decks)

| Token Name | HEX | Usage |
|---|---|---|
| **Chassis Base** | `#141619` | Sunken widgets, 4-hour countdown container, code blocks, dark inputs |
| **Sidebar Frame** | `#1E2024` | Far-left navigation sidebar, far-right autonomous controls sidebar |
| **Chassis Surface Raised** | `#24272F` | n8n workflow canvas nodes, elevated tactile panels |
| **Chassis Surface Active** | `#2A2E37` | Hovered sidebar item, active scope filter button |
| **Chassis Border** | `#2D3139` | Dividers between sidebar sections, widget outlines |
| **Chassis Border Subtle** | `#3E4452` | Code block borders, elevated card outlines |
| **Text Dark Chassis Primary** | `#FFFFFF` | Sidebar headings, active titles |
| **Text Dark Chassis Muted** | `#94A3B8` | Subtitles, scopes, timestamps, unit labels |
| **Text Dark Chassis Low** | `#64748B` | Version badges, subtle telemetry |

### C. Canvas & Pristine Workspace (Center Body & Modals)

| Token Name | HEX | Usage |
|---|---|---|
| **Canvas Background** | `#F4F5F7` | Overall main fluid background |
| **Surface White** | `#FFFFFF` | Main cards, tables, document studio paper, modal containers |
| **Surface Muted / Inset** | `#F8F9FA` | Search inputs, table hover states, card sub-headers |
| **Surface Dark Inset** | `#18181B` | Primary action buttons, metric values, n8n canvas |
| **Border Slate Standard** | `#E2E8F0` | Card borders, table dividers, tab outlines |
| **Border Slate Medium** | `#CBD5E1` | Document studio borders, input outlines |
| **Border Slate Subtle** | `#F1F5F9` | Card inner row separators |
| **Text Primary (Ink)** | `#18181B` | Headings, document title, applicant name, key numbers |
| **Text Body** | `#334155` | Paragraphs, descriptions, resume bullets, screening responses |
| **Text Secondary / Muted** | `#64748B` | Metadata, locations, dates, table headers |
| **Text Placeholder** | `#94A3B8` | Search input placeholder, disabled icons |

### D. Semantic Status & Alert Tints

| State | Background Tint | Border Tint | Text Ink |
|---|---|---|---|
| **Critical Match ($\ge 90\%$)** | `#FFFBF7` | `#F97316` (30% opacity) | `#EA580C` |
| **Flagged Review ($80-89\%$)** | `#FFFBEB` | `#FDE68A` | `#B45309` |
| **Human Sign-Off Required** | `#FFF5F5` | `#FECACA` (or `2px #DC2626`) | `#991B1B` |
| **Submitted / Verified** | `#F0FDF4` | `#BBF7D0` | `#166534` |
| **Consultancy Mandate** | `#FEF2F2` | `#FCA5A5` | `#991B1B` |
| **Job Position** | `#EFF6FF` | `#BFDBFE` | `#1E40AF` |
| **LinkedIn Integration** | `#F0F7FD` | `#B8D7F2` | `#0A66C2` |

---

## 2. Typography System

Athena loads three Google Fonts via `<link>` in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
```

### Font Families

1. **Brand Display (`font-brand`)**:  
   `'Cinzel', serif`  
   *Usage*: "ATHENA" wordmark, brand logos, executive signature seals.
2. **Editorial Serif (`font-serif-heading`)**:  
   `'Lora', Georgia, serif`  
   *Usage*: Document headers, modal headings, candidate full name in letterheads, section major titles.
3. **Primary UI (`font-sans`)**:  
   `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`  
   *Usage*: All buttons, navigation items, card content, table rows, form inputs.
4. **Instrument & Code (`font-mono`)**:  
   `'Cascadia Code', 'SF Mono', 'Fira Code', ui-monospace, monospace`  
   *Usage*: 4-hour countdown timers, ATS scores, numeric readouts, SHA-256 hashes, JSON exports, timestamps.

### Type Scale Hierarchy

| Element | Class / Token | Font Family | Size | Weight | Line Height | Tracking |
|---|---|---|---|---|---|---|
| **Document Candidate Name** | `text-2xl sm:text-3xl font-serif-heading` | Lora | 24px–30px | Bold (700) | Tight (1.15) | `-0.025em` |
| **View / Modal Heading** | `text-lg font-bold font-serif-heading` | Lora | 18px | Bold (700) | Snug (1.3) | Normal |
| **Card / Job Title** | `text-sm font-bold text-[#18181B]` | Plus Jakarta | 14px | Bold (700) | Snug (1.35) | Normal |
| **Primary Body Text** | `text-xs text-[#334155]` | Plus Jakarta | 12px | Regular (400) | Relaxed (1.6) | Normal |
| **Small UI / Secondary** | `text-[11px] text-[#64748B]` | Plus Jakarta | 11px | Medium (500) | Normal (1.4) | Normal |
| **Micro Badges / Mono Tags** | `text-[10px] font-mono uppercase` | Monospace | 10px | Semi-Bold (600) | None (1.0) | `0.05em` |
| **Numeric Readouts / Timers**| `text-2xl font-mono font-bold` | Monospace | 24px | Bold (700) | None (1.0) | `-0.02em` |

---

## 3. Spacing & Spatial Layout

Athena enforces an **8-point base grid** with 4px sub-increments:

- **Sidebar Width (Left)**: `17rem` (`272px` / `w-68`)
- **Sidebar Width (Right)**: `18rem` (`288px` / `w-72`)
- **Center Canvas**: Fluid flex `flex-1 min-w-0`
- **Main View Padding**: `p-6` (`24px`) with `space-y-4` (`16px` vertical rhythm)
- **Card Padding**: `p-3.5` to `p-5` (`14px` to `20px`)
- **Input Height**: `36px` to `40px` (`py-1.5 px-3`)
- **Button Sizing**:
  - `sm`: `px-2.5 py-1 text-[11px]`
  - `md`: `px-3.5 py-2 text-xs`
  - `lg`: `px-5 py-2.5 text-xs font-bold`

---

## 4. Radii & Surface Shapes

Athena uses hardware-tight corner rounding (no oversized consumer bubbles):

| Token | Class | Radius Value | Usage |
|---|---|---|---|
| **Pill / Indicator** | `rounded-full` | `9999px` | Circular gauges, active dots, status counters |
| **Badge / Tag** | `rounded-md` | `6px` | Platform tags, skill badges, scope filters |
| **Button** | `rounded-lg` | `8px` | Actions, sign-off triggers, export buttons |
| **Standard Card** | `rounded-xl` | `12px` | Pipeline columns, metric cards, charts |
| **Modal Window** | `rounded-2xl` | `16px` | Opportunity detail, LinkedIn export modal |

---

## 5. Shadows, Elevation & Depth

```css
/* Standard Subtle Shadow */
.shadow-2xs {
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.04);
}
.shadow-xs {
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08);
}
.shadow-md {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
}

/* Tactile Hardware Skeuomorphic Primitives */
.raised {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.06),
    inset 0 -1px 0 rgb(0 0 0 / 0.35),
    0 1px 2px rgb(0 0 0 / 0.45),
    0 4px 12px rgb(0 0 0 / 0.35);
}

.sunken {
  background: #12141A;
  box-shadow:
    inset 0 2px 4px rgb(0 0 0 / 0.55),
    inset 0 -1px 0 rgb(255 255 255 / 0.04);
}

.glow-amber {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.07),
    inset 0 -1px 0 rgb(0 0 0 / 0.4),
    0 0 0 1px rgb(255 169 40 / 0.3),
    0 0 12px rgb(255 169 40 / 0.35),
    0 2px 4px rgb(0 0 0 / 0.45);
}
```

---

## 6. Print Stylesheet Contract (Pristine Resumes & Proposals)

When a user prints or exports to PDF (`window.print()`):
```css
@media print {
  body {
    background: #FFFFFF !important;
    color: #000000 !important;
  }
  .no-print, aside, header, nav, button {
    display: none !important;
  }
  .print-only {
    display: block !important;
  }
  .resume-paper, .proposal-paper {
    box-shadow: none !important;
    border: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
  }
}
```
