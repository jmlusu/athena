# Athena — Motion & Animation Specification

> **Category**: Motion & Transitions Reference  
> **Extraction Source**: `src/index.css`, Tailwind utility classes, inline SVG transitions  
> **Status**: APPROVED & LOCKED  

---

## 1. Animation Timing & Easing Curves

```css
--transition-fast: 120ms cubic-bezier(0.2, 0, 0, 1);
--transition-normal: 200ms cubic-bezier(0.2, 0, 0, 1);
--transition-slow: 350ms cubic-bezier(0.16, 1, 0.3, 1);
```

Hardware panels do not bounce or overshoot. Motion is crisp, tactile, and fast.

---

## 2. Documented Key Animations

### A. Engine Online Ping & Pulse
- **Element**: Green status indicator dot in `LeftSidebar` & Top App Bar.
- **Trigger**: Continuous ambient state.
- **Animation**: `animate-ping` & `animate-pulse` (opacity 1.0 $\rightarrow$ 0.4 $\rightarrow$ 1.0 over 2000ms).
- **Purpose**: Signals active crawler daemon and Lilongwe Gateway connectivity.

### B. Notification Toast Entry & Exit
- **Element**: Top-right notification toast.
- **Trigger**: Cron completion or listing additions.
- **Animation**: `animate-in fade-in slide-in-from-top-2 duration-300`.
- **Purpose**: Ambient non-blocking feedback.

### C. Modal Overlay Fade & Scale
- **Element**: `OpportunityDetailModal`, `LinkedInExportModal`, `FormFillerView`.
- **Trigger**: Modal open action.
- **Animation**: `animate-in fade-in duration-200` with `backdrop-blur-xs` backdrop.
- **Purpose**: Focus attention on decision gates and export actions.

### D. Mountain Chart Telemetry Point Hover
- **Element**: SVG circle nodes on the mountain chart line.
- **Trigger**: `onMouseEnter` / `onMouseLeave`.
- **Animation**: Radius scales from `r=4` to `r=6`, stroke-width scales from `2` to `3` (`transition-all duration-150`).

### E. Skills Compatibility Bar Expand
- **Element**: Distribution bar indicators.
- **Trigger**: Component mount.
- **Animation**: Width expands from `0%` to target percentage with `duration-700 ease-out`.

### F. Tactile Button Press
- **Element**: Interactive controls with `.tactile` class.
- **Trigger**: `:active` pseudo-class.
- **Animation**: `transform: translateY(1px);` with inset shadow depression (`duration-120`).

---

## 3. Reduced Motion Compliance

When `prefers-reduced-motion: reduce` is enabled:
- All CSS animations are clamped to `0.01ms`.
- Pulse and ping animations are disabled.
- Transforms on `:active` are suppressed.
