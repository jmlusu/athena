# Athena — Interaction & Micro-Interaction Specification

> **Category**: Interaction Reference  
> **Extraction Source**: `src/components/**/*`  
> **Status**: COMPLETE & VERIFIED  

---

## 1. Interaction Matrix

| UI Element | Trigger | State / Condition | Observable UI Response |
|---|---|---|---|
| **Left Nav Item** | Click | Inactive $\rightarrow$ Active | Background turns `#F97316` (Brand Orange), text turns `#FFFFFF`, active view renders in center canvas. |
| **Scope Pill (Left Sidebar)** | Click | Scope change | Active scope gains `bg-[#2A2E37] text-white border-l-2 border-[#F97316]`; main pipeline filters instantly. |
| **Category Toggle** | Click | All / Jobs / Consultancies | Category tab highlights in dark slate, orange, or red; pipeline filters items. |
| **4h Cron Button** | Click | "Execute 4h Cycle Now" | Timer resets to `04:00:00`, top amber notification toast appears for 5s. |
| **Kanban Card** | Hover | Mouse over card | Border darkens to `#CBD5E1`, shadow elevates to `shadow-xs`. |
| **Kanban Card Title** | Click | Click title | Opens `OpportunityDetailModal` with full TOR and ATS dial. |
| **Column Switcher** | Click | 1-Col vs 2-Col | Re-renders Document Studio canvas between 3-column asymmetric layout and single-column executive layout. |
| **Dehumanizer Toggle** | Click | On / Off | Toggles orange active background, adds/removes robotic AI phrases from live text. |
| **Copy Button** | Click | Clipboard copy | Icon changes from `Copy` to `Check`, text changes to "Copied!" for 2.5s. |
| **Print / PDF Button** | Click | Print trigger | Triggers browser `window.print()` using `@media print` clean paper layout. |
| **Human Sign-Off Checkbox**| Click | Authorization check | Unlocks "Authorize & Submit" button; if unchecked, displays red validation error alert. |
| **Typed Signature Input** | Input | Typing name | Updates digital power-of-attorney legal signer in real time. |
| **Export to LinkedIn Button**| Click | Export trigger | Opens `LinkedInExportModal` displaying Easy Apply and Experience tabs. |
| **Download JSON / Markdown**| Click | File download | Prompts browser download of `linkedin-draft-[company]-[id].json` or `.md`. |
| **Mountain Chart Point** | Hover | Mouse over circle point | Circle expands from `r=4` to `r=6`, top-right floating telemetry tooltip displays exact stream numbers and ATS index. |
| **Skills Bar** | Load / Render | Initial view | Bar width expands smoothly via `transition-all duration-700`. |
