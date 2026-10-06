# Athena — Responsive Design & Breakpoint Specification

> **Category**: Viewport & Responsive Behavior Reference  
> **Extraction Source**: `src/App.tsx`, `src/components/**/*`  
> **Status**: COMPLETE & VERIFIED  

---

## 1. Breakpoint System

| Breakpoint | Minimum Width | Target Devices / Viewports |
|---|---|---|
| **Mobile (`default`)** | `< 640px` | Smart phones (iPhone 14/15, Pixel 7) |
| **Small Tablet (`sm`)** | `640px` | Portrait tablets, large phones |
| **Medium Tablet (`md`)** | `768px` | Landscape tablets, mini laptops |
| **Desktop (`lg`)** | `1024px` | Standard laptops, 13" MacBooks |
| **Wide Desktop (`xl`)** | `1280px` | 15"+ Laptops, desktop monitors |
| **Ultra-Wide (`2xl`)** | `1536px` | 4K displays, external workstations |

---

## 2. Structural Frame Adaptations

### A. Desktop ($\ge 1280px$)
- Full 3-column chassis:
  - **Left Sidebar**: `w-68` (`272px` fixed)
  - **Center Canvas**: `flex-1 min-w-0` (fluid scrolling)
  - **Right Sidebar**: `w-72` (`288px` fixed)
- Kanban Pipeline: 6 columns side-by-side (`grid-cols-6`).
- Mountain Chart: Full width with 4 legend items side-by-side.

### B. Tablet ($768px - 1023px$)
- Right sidebar collapses or moves below center content (`hidden xl:flex` or responsive scroll).
- Kanban Pipeline: 2-column or 3-column wrapped grid (`md:grid-cols-2 lg:grid-cols-3`).
- Document Studio: 2-column resume layout stacks vertically if necessary (`grid-cols-1 md:grid-cols-3`).
- Metric cards: 2 or 3 columns (`grid-cols-2 md:grid-cols-5`).

### C. Mobile ($< 640px$)
- Left sidebar can be accessed via drawer or stacked top navigation.
- Breadcrumb simplifies to show active module and target scope.
- Kanban Pipeline: Single column vertical stack (`grid-cols-1`).
- Modal dialogs: Expand to full viewport width with `m-2` margins and internal scrolling (`max-h-[90vh]`).
- Print document layout: Stacks contact information and experience blocks linearly.
