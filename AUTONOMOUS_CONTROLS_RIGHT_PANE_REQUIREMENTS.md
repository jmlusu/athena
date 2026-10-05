# Athena: Autonomous Controls Right Pane Requirements Specification

> **Document Type:** Feature & Technical Requirements Specification  
> **Target Component:** `RightSidebar` (`src/components/layout/RightSidebar.tsx`)  
> **System Role:** System-Wide Autonomous Policy Deck, Trigger Engine & Human Gatekeeper  
> **Status:** APPROVED & LOCKED  
> **Version:** 2.4.0  

---

## 1. Executive Summary & Purpose

The **Autonomous Controls Right Pane** (implemented as `RightSidebar.tsx`) is the dedicated control deck that governs Athena's autonomous decision-making engine. Operating as a persistent 288px vertical tactical rail on the right side of the desktop viewport, it provides real-time visibility and granular controls over:

1. **Autonomous Policy Thresholds:** Triggering automated document generation and priority review routing.
2. **AI Voice Governance (Dehumanizer Engine):** Regulating the linguistic tone of tailored resumes and proposals.
3. **Mandatory Human-in-the-Loop Gatekeeper:** Enforcing explicit human authorization before external submission dispatch.
4. **Ingress Telemetry:** Displaying active sync status across multi-platform sourcing feeds.
5. **Workflow Orchestration Linkage:** Verifying external n8n webhook health and payload destination.

---

## 2. Layout, Geometry & Visual Tokens

### 2.1. Structural Dimensions & Placement
* **Container Role:** Fixed right-side tactical drawer / aside navigation rail.
* **Width:** Exact `w-72` (`288px`, fixed, non-shrinking `shrink-0`).
* **Height:** `min-h-screen` viewport height, with internal fluid vertical scrolling (`overflow-y-auto`).
* **Placement:** Positioned on the far-right edge of the tripartite application chassis (`LeftSidebar` | `Main Canvas` | `RightSidebar`).
* **Selection:** UI text marked with `select-none` to prevent accidental text highlight during toggle interaction.

### 2.2. Color Tokens & Surface Depth

| Element / Layer | Token / Class | Exact HEX / Value | Purpose |
|---|---|---|---|
| **Chassis Surface** | `bg-[#1E2024]` | `#1E2024` | Main panel background |
| **Card Surface (Sunken)** | `bg-[#141619]` | `#141619` | Inset rule widgets, pending cards, ingress rows |
| **Borders & Seams** | `border-[#2D3139]` | `#2D3139` | Panel left boundary, card borders, section dividers |
| **Primary Accent** | `text-[#F97316]` | `#F97316` | Sliders icon, ATS $\ge 90$ sparkles, active toggles |
| **Status Badge Orange** | `text-[#FB923C]` | `#FB923C` | AUTO-PILOT badge text |
| **Status Badge BG** | `bg-orange-950/80` | `rgba(67, 20, 7, 0.8)` | AUTO-PILOT badge container |
| **Alert Warning Amber** | `text-amber-400` | `#FBBF24` | ATS 80-89 auto-flag icon |
| **Human Gate Red** | `text-[#DC2626]` | `#DC2626` | Sign-off gate icon, authorize button background |
| **Human Gate Hover** | `hover:bg-[#B91C1C]`| `#B91C1C` | Authorize button hover state |
| **Pending Badge Red** | `bg-red-950 text-red-400` | `#450A0A` / `#F87171` | Pending authorization queue counter |
| **Success Emerald** | `text-emerald-400` | `#34D399` | Generated document counter, synced feeds, pulse dots |
| **Text Primary** | `text-white` | `#FFFFFF` | Section titles, card headings, role titles |
| **Text Secondary / Muted** | `text-[#94A3B8]` | `#94A3B8` | Explanatory labels, company names, URLs |
| **Text Subdued** | `text-[#64748B]` | `#64748B` | Footer version, telemetry notes |

---

## 3. Detailed Functional Requirements

```text
+-----------------------------------------------------------+
| [Sliders] AUTONOMOUS CONTROLS                [AUTO-PILOT] |
+-----------------------------------------------------------+
| SCORING & DOCUMENT TRIGGERS                               |
| +-------------------------------------------------------+ |
| | [Sparkles] ATS >= 90 Auto-Generate             [ON/OFF] | |
| | Auto-creates tailored resume + cover letter for jobs, | |
| | and executive summary + proposal for consultancies.   | |
| | [Check] N Documents Generated                         | |
| +-------------------------------------------------------+ |
| +-------------------------------------------------------+ |
| | [Alert] ATS 80-89 Auto-Flag                   [LOCKED] | |
| | Auto-flags opportunities with 80-89 ATS match into    | |
| | high-priority review queue.                           | |
| +-------------------------------------------------------+ |
| +-------------------------------------------------------+ |
| | [Zap] Dehumanize AI Voice                      [ON/OFF] | |
| | Purges AI telltales ensuring organic human tone.      | |
| +-------------------------------------------------------+ |
+-----------------------------------------------------------+
| [UserCheck] HUMAN SIGN-OFF GATE                 [N Waiting] |
| Applicant must authorize and sign before submission.      |
| +-------------------------------------------------------+ |
| | Role Title                                        94% | |
| | Hiring Organization                                   | |
| | [ Sign-Off & Authorize -> ]                           | |
| +-------------------------------------------------------+ |
+-----------------------------------------------------------+
| AGGREGATOR INGRESS                             [Pulse Dot]|
| LinkedIn Malawi & Global                         [SYNCED] |
| Upwork Enterprise                                [SYNCED] |
| ReliefWeb / UN Malawi                            [SYNCED] |
| Devex Southern Africa                            [SYNCED] |
+-----------------------------------------------------------+
| [Workflow] n8n Pipeline Hook                       [Dot]  |
| https://n8n.athena-ops.internal/webhook/...               |
+-----------------------------------------------------------+
| [ShieldCheck] Human Protected                 ATHENA v2.4 |
+-----------------------------------------------------------+
```

### 3.1. Header & System Status
* **FR-RTP-001 (Deck Identity):** The header MUST render the `Sliders` icon (`w-4 h-4 text-[#F97316]`) alongside the title `"AUTONOMOUS CONTROLS"` in bold uppercase, 12px (`text-xs text-white uppercase tracking-wider`).
* **FR-RTP-002 (Operational Mode Badge):** The header MUST display an `"AUTO-PILOT"` mode badge in monospace 10px font (`text-[10px] font-mono text-[#FB923C] bg-orange-950/80 px-2 py-0.5 rounded border border-orange-800/60`).

---

### 3.2. Autonomous ATS Rules & Document Triggers

#### A. Rule 1: ATS $\ge 90$ Auto-Generate
* **FR-RTP-010 (Trigger Presentation):** Must display the `Sparkles` icon (`text-[#F97316]`) with title `"ATS ≥ 90 Auto-Generate"`.
* **FR-RTP-011 (Interactive Toggle):** Must render an interactive hardware toggle switch bound to:
  * `settings.autoCreateResumeCoverLetter`
  * `settings.autoCreateProposalExecSummary`
* **FR-RTP-012 (Functional Behavior):**
  * When **enabled (`true`)**: When any newly discovered or rescored opportunity achieves ATS $\ge 90$, the backend autonomous engine immediately generates tailored documents:
    * For `job`: Tailored 1-Col or 2-Col Resume + Tailored Cover Letter.
    * For `consultancy`: Tailored Executive Summary + 4-Section Technical/Financial Proposal.
  * When **disabled (`false`)**: System computes scores and routes opportunities without automated document synthesis.
* **FR-RTP-013 (Document Counter Telemetry):** Must display a live dynamic count of all generated documents across the current pipeline:
  * Display: `"{N} Documents Generated"` with `CheckCircle2` icon in emerald (`text-emerald-400 font-mono text-[10px]`).
  * Calculation: Count of opportunities where `autoCreatedDocs.hasResume || hasCoverLetter || hasProposal || hasExecutiveSummary`.

#### B. Rule 2: ATS 80-89 Auto-Flag
* **FR-RTP-020 (Trigger Presentation):** Must display the `AlertTriangle` icon (`text-amber-400`) with title `"ATS 80-89 Auto-Flag"`.
* **FR-RTP-021 (Policy Locking):** This toggle is an inviolable architectural safety standard. The switch MUST be rendered in the active state (`checked={true}`) and set to **read-only (`readOnly`)**.
* **FR-RTP-022 (Functional Behavior):** Opportunities scoring in the range $[80, 89]$ are automatically marked with `isFlagged = true` and routed directly into the high-priority candidate review queue (`status: "evaluated"`).

#### C. Rule 3: Dehumanizer Voice Engine
* **FR-RTP-030 (Trigger Presentation):** Must display the `Zap` icon (`text-orange-400`) with title `"Dehumanize AI Voice"`.
* **FR-RTP-031 (Interactive Toggle):** Must render an interactive toggle switch bound to `settings.dehumanizeEnabled`.
* **FR-RTP-032 (Functional Behavior):**
  * When **enabled (`true`)**: All tailored resumes, cover letters, proposals, and screening answers are synthesized without robotic AI tropes (*"delve"*, *"spearhead"*, *"testament to"*, *"in today's fast-paced world"*), replacing them with direct, evidence-based operational prose.
  * When **disabled (`false`)**: Documents are generated using standard corporate prose.

---

### 3.3. Pending Human Authorization Queue (Human Sign-Off Gate)

* **FR-RTP-040 (Governance Standard):** The platform MUST NEVER autonomously dispatch an application to an external portal without interactive human power-of-attorney authorization.
* **FR-RTP-041 (Queue Header & Counter):**
  * Displays the `UserCheck` icon (`text-[#DC2626]`) with title `"Human Sign-Off Gate"`.
  * Displays a red badge indicating the count of pending items: `"{N} Waiting"` (`bg-red-950 text-red-400 border border-red-800 font-mono text-[10px]`).
* **FR-RTP-042 (Queue Filtering):** The queue MUST dynamically filter and display all opportunities where `status === "awaiting_signoff"`.
* **FR-RTP-043 (Empty State):** When zero opportunities are awaiting signature, the container MUST render:
  * `"No applications waiting for signature."` (`p-3 bg-[#141619] rounded-lg border border-[#2D3139] text-center text-xs text-[#94A3B8]`).
* **FR-RTP-044 (Pending Card Anatomy):** For each opportunity awaiting signature, render a dedicated card:
  1. **Job/Consultancy Title:** 12px bold white text (`text-xs text-white font-semibold line-clamp-1`).
  2. **ATS Compatibility Pill:** Integer percentage score in orange monospace (`text-[9px] font-mono text-[#F97316] font-bold`).
  3. **Hiring Organization:** 10.5px muted gray text (`text-[10.5px] text-[#94A3B8] line-clamp-1`).
  4. **Authorization Button:** Full-width red button labeled `"Sign-Off & Authorize"` with `ArrowRight` icon (`bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[11px] rounded font-medium`).
* **FR-RTP-045 (Authorization Trigger Action):** Clicking `"Sign-Off & Authorize"` MUST invoke `onOpenSignOff(opp)`, opening the `FormFillerView` modal and focusing on the required legal signature input and authorization checkbox.
* **FR-RTP-046 (Scroll Behavior):** The queue list MUST support smooth internal vertical scrolling with a maximum height limit (`max-h-56 overflow-y-auto pr-1`).

---

### 3.4. Live Aggregator Ingress Streams Status

* **FR-RTP-050 (Header & Radio Pulse):** Must render title `"Aggregator Ingress"` alongside the `Radio` icon animating with a live emerald pulse (`text-emerald-400 animate-pulse`).
* **FR-RTP-051 (Monitored Stream Nodes):** The stream status list MUST monitor and display four active ingestion feeds:
  1. `LinkedIn Malawi & Global`
  2. `Upwork Enterprise`
  3. `ReliefWeb / UN Malawi`
  4. `Devex Southern Africa`
* **FR-RTP-052 (Stream Telemetry Pill):** Each feed row MUST render the feed name in white text and a green status pill reading `"SYNCED"` (`text-emerald-400 font-mono text-[10px]`).

---

### 3.5. n8n Pipeline Hook Integration

* **FR-RTP-060 (Container Styling):** Renders inside an inset card (`p-3 bg-[#141619] rounded-lg border border-[#2D3139]`).
* **FR-RTP-061 (Hook Identity):** Displays `Workflow` icon (`text-[#F97316]`) with title `"n8n Pipeline Hook"` and a solid emerald status dot (`w-2 h-2 rounded-full bg-emerald-400`).
* **FR-RTP-062 (Webhook Endpoint Display):** Displays the active webhook destination URL in truncated monospace text (`text-[10px] text-[#94A3B8] font-mono truncate`), bound to `settings.n8nWebhookUrl`.

---

### 3.6. Security & Version Footer

* **FR-RTP-070 (Placement):** Pinned to the bottom of the pane (`p-3 border-t border-[#2D3139] bg-[#141619] flex items-center justify-between`).
* **FR-RTP-071 (Compliance Badge):** Displays `ShieldCheck` icon (`text-emerald-500`) with text `"Human Protected"` (`text-[10px] text-[#64748B]`).
* **FR-RTP-072 (Release Version):** Displays `"ATHENA v2.4"` in monospace font.

---

## 4. Technical Architecture & Props Interface

### 4.1. TypeScript Interface Contract

```typescript
export interface RightSidebarProps {
  /** Global autonomous settings object */
  settings: AutomationSettings;

  /** State updater callback for modifying automation settings */
  onUpdateSettings: (newSettings: Partial<AutomationSettings>) => void;

  /** Master collection of all opportunities in the pipeline */
  opportunities: Opportunity[];

  /** Callback to launch the FormFiller human sign-off modal */
  onOpenSignOff: (opp: Opportunity) => void;

  /** Callback to view complete opportunity details */
  onOpenDetails: (opp: Opportunity) => void;
}
```

### 4.2. `AutomationSettings` State Contract

```typescript
export interface AutomationSettings {
  /** Autonomous document generation score threshold (default: 90) */
  autoCreateThreshold: number;

  /** Auto-flagging minimum threshold (default: 80) */
  flagThresholdMin: number;

  /** Auto-flagging maximum threshold (default: 89) */
  flagThresholdMax: number;

  /** Job discovery schedule in hours (default: 4) */
  jobScheduleHours: number;

  /** Consultancy discovery schedule in hours (default: 4) */
  consultancyScheduleHours: number;

  /** Auto-create resume and cover letter for jobs */
  autoCreateResumeCoverLetter: boolean;

  /** Auto-create proposal and executive summary for consultancies */
  autoCreateProposalExecSummary: boolean;

  /** Dehumanizer AI voice filter toggle */
  dehumanizeEnabled: boolean;

  /** External n8n webhook URL */
  n8nWebhookUrl: string;

  /** External n8n integration active flag */
  n8nActive: boolean;

  /** Audio notification alerts toggle */
  soundAlerts: boolean;
}
```

---

## 5. Interaction & State Transitions

| Action / Trigger | Source Element | Immediate State Mutation | Resulting System Behavior |
|---|---|---|---|
| **Toggle ATS $\ge 90$ Switch** | Rule 1 Checkbox Input | `onUpdateSettings({ autoCreateResumeCoverLetter: checked, autoCreateProposalExecSummary: checked })` | Enables/disables automated synthesis of tailored docs when ATS $\ge 90$ is reached. |
| **Toggle Dehumanizer Switch** | Rule 3 Checkbox Input | `onUpdateSettings({ dehumanizeEnabled: checked })` | Re-synthesizes or flags tailored prose to purge/restore robotic AI buzzwords. |
| **Click "Sign-Off & Authorize"** | Card Action Button in Sign-Off Queue | `onOpenSignOff(opp)` | Launches `FormFillerView` modal with pre-populated field manifest and signature gate. |
| **New Opportunity Enters Pipeline** | Scraper / 4h Cron Daemon | `opportunities` prop updates | Re-evaluates `autoCreatedCount` and `pendingAuthorizations.length` instantly. |

---

## 6. Responsive & Viewport Adaptations

* **Desktop Viewports ($\ge 1280px$ / `xl`):** The RightSidebar remains permanently visible as a persistent 288px column, anchored to the right viewport border.
* **Tablet & Mobile Viewports ($< 1280px$):**
  * Collapses from the standard horizontal flow (`hidden xl:flex`).
  * Can be toggled into an overlay drawer / slide-in sheet via a top-bar trigger button (`Sliders` icon).
  * Maintains identical internal widget padding and interaction contracts when rendered within an overlay drawer.

---

## 7. Accessibility & Performance Requirements

* **Keyboard Navigation:** All toggle switches MUST be wrapped in standard semantic `<input type="checkbox">` elements to support native keyboard focus (`Tab`) and toggle activation (`Space` / `Enter`).
* **Visible Focus Indicators:** Toggle switches and action buttons MUST display an amber focus outline when navigated via keyboard (`peer-focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]`).
* **Screen Reader Semantics:**
  * Toggle labels MUST describe their exact functional effect (*e.g.*, `aria-label="Toggle ATS 90 Auto-Generation"`).
  * Pending authorization badge MUST announce number of items waiting (*e.g.*, `aria-label="3 applications waiting for signature"`).
* **Render Performance:** The pane MUST render in $< 16\text{ms}$ (60 FPS) without causing reflow in the central fluid canvas.
* **Reduced Motion:** When `@media (prefers-reduced-motion: reduce)` is detected, the `animate-pulse` on the `Radio` icon MUST be disabled.

---

## 8. Verification & Acceptance Checklist

- [ ] **Component Location:** Exists at `/src/components/layout/RightSidebar.tsx`.
- [ ] **Dimensions:** Fixed width `w-72` (288px) with `border-l border-[#2D3139]`.
- [ ] **Header:** "AUTONOMOUS CONTROLS" title with `Sliders` icon and "AUTO-PILOT" badge.
- [ ] **Rule 1 Toggle:** Toggles both `autoCreateResumeCoverLetter` and `autoCreateProposalExecSummary`.
- [ ] **Rule 1 Counter:** Shows live `{N} Documents Generated` matching pipeline state.
- [ ] **Rule 2 Lock:** ATS 80-89 switch is locked in checked/active state.
- [ ] **Rule 3 Toggle:** Toggles `dehumanizeEnabled` setting cleanly.
- [ ] **Human Sign-Off Queue:** Accurately filters `status === "awaiting_signoff"`.
- [ ] **Human Sign-Off Action:** Clicking "Sign-Off & Authorize" launches sign-off modal with target opportunity.
- [ ] **Ingress Feeds:** Displays LinkedIn, Upwork, ReliefWeb, and Devex with `SYNCED` badges.
- [ ] **n8n Webhook Status:** Displays `n8nWebhookUrl` with green indicator dot.
- [ ] **Footer:** Displays "Human Protected" with `ShieldCheck` icon and "ATHENA v2.4".
