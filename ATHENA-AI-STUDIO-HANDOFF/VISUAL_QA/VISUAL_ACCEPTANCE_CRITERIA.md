# Athena — Visual Acceptance Criteria & Quality Gates

> **Category**: QA / Visual Testing Gate  
> **Audience**: OpenCode QA & Frontend Engineers  
> **Status**: APPROVED & LOCKED  

---

## 1. Visual Parity Criteria

The OpenCode implementation will be considered visually and experientially complete only when all criteria below pass verification:

### A. Frame & Color Fidelity
- [ ] Left sidebar background is exact dark matte `#1E2024` with `#2D3139` section dividers.
- [ ] Active navigation item has brand orange background (`#F97316`) with white text and sharp border radius (`rounded-lg`).
- [ ] Top application bar has sticky blur (`bg-white/90 backdrop-blur-md`) with dynamic breadcrumbs.
- [ ] Brand icon in top left has radial gradient `from-[#F97316] to-[#EA580C]` with bold serif "A".
- [ ] Engine online status dot pulses green (`bg-emerald-400 animate-ping / animate-pulse`).

### B. Typography & Hierarchy
- [ ] `Cinzel` serif is rendered for the brand wordmark "ATHENA".
- [ ] `Lora` serif is rendered for document candidate names, view titles, and modal headers.
- [ ] `Plus Jakarta Sans` is rendered for cards, table rows, button labels, and body text.
- [ ] Monospace font is rendered for 4-hour countdown timers, ATS scores, and SHA-256 hashes.

### C. Mountain Dynamics & Visualizations
- [ ] Mountain chart renders 3 distinct polygon paths with gradients:
  - Global Remote: Orange gradient (`#F97316`)
  - Lilongwe Local/Hub: Charcoal gradient (`#1E2024`)
  - Consultancies: Red dashed line & gradient (`#DC2626`)
- [ ] Interactive hover on mountain chart data points expands the circle node and displays a top-right floating telemetry tooltip with exact stream numbers.
- [ ] Circular ATS gauges render smooth SVG stroke circles with correct threshold color mapping ($\ge 90\%$ emerald, $80-89\%$ amber, $<80\%$ slate).

### D. Document Studio & Print Vector Output
- [ ] 1-Column vs 2-Column layout switcher switches layout instantly.
- [ ] Dehumanizer toggle highlights in orange and changes text tone.
- [ ] Document paper surface uses clean white `#FFFFFF` with `#D1D5DB` borders.
- [ ] `window.print()` / Print action triggers clean vector output without sidebar or button chrome.

### E. Mandatory Human Sign-Off Gate
- [ ] Sign-off modal displays red border (`border-2 border-[#DC2626]`).
- [ ] "Authorize & Submit" button is disabled until the authorization checkbox is checked and legal signature is entered.
- [ ] Successful submission creates a verified receipt with SHA-256 hash and switches to Receipts view.

### F. LinkedIn Export Modal
- [ ] Modal displays Easy Apply tab, Experience tab, and JSON tab.
- [ ] Copy buttons change icon and show "Copied!" feedback for 2.5s.
- [ ] Markdown (`.md`) and JSON (`.json`) download buttons generate and download valid draft files.
