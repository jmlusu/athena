# ATHENA: Autonomous Job & Consultancy Searching & Applying Platform
## Comprehensive Architecture, Design, Branding & Functional Specification

---

### 1. Executive Summary & Mission
**Athena** is a white-collar, upscale autonomous job and consultancy discovery, evaluation, document tailoring, and application submission platform. Designed specifically for senior technical leaders, systems architects, and advisory consultants targeting opportunities in **Lilongwe (Malawi)**, **Lilongwe-based remote roles**, and **global international remote positions**, Athena combines rigorous multi-platform scrapers with advanced semantic Large Language Model (LLM) matching.

Athena adheres strictly to a human-in-the-loop governance model: while automated crawlers run every 4 hours to aggregate opportunities, evaluate ATS compatibility, and auto-generate tailored pristine resumes, cover letters, and consultancy proposals for scores $\ge 90$, **no application is ever submitted without explicit digital power-of-attorney sign-off from the human applicant.**

---

### 2. Brand Identity & Visual Design System

Athena follows an upscale, pristine white-collar aesthetic inspired by institutional advisory boards and elite engineering standards.

#### A. Brand Guidelines & Typography
* **Company Name / Platform:** ATHENA Autonomous Intelligence Systems™
* **Tagline:** *ASPIRE. ACT. ACHIEVE.*
* **Typography:**
  * **Display & Headings:** *Cinzel* / *Arial Bold* (Geometric authority, high legibility).
  * **Body Copy:** *Plus Jakarta Sans* / *Lora* (Refined modern editorial standards).
* **Tone:** Professional, evidence-led, uncompromisingly rigorous, completely devoid of generic AI fluff or conversational cliches.

#### B. Color Palette Tokens
| Token Name | Hex Code | Primary Usage |
| :--- | :--- | :--- |
| **Navy** | `#070A40` | Dominant brand surface, primary headlines, slide rails, deep containers |
| **Red** | `#E63946` | Critical accents, human sign-off gates, CTA highlights, consultancy badges |
| **Cyan** | `#00BFFF` | Shield base, accent links, active status indicators |
| **Off-White / Light Gray** | `#F4F5F7` / `#F9FAFB` | Pristine paper document backgrounds, canvas backing |
| **Dark Charcoal / Black** | `#18181B` | Primary text, navigation sidebars, high-contrast UI borders |
| **Soft Orange / Amber** | `#F97316` / `#D97706` | ATS $\ge 90$ auto-ready triggers, 80–89 priority review flags |

#### C. Layout Architecture & UI Elements
* **Theme:** Light-mode UI featuring an off-white/light gray background set against dark charcoal sidebars.
* **Navigation Sidebars:**
  * **Far-Left Sidebar:** Houses targeted feed scope selectors (Lilongwe Local, Lilongwe Remote, Global Remote), category filters (Jobs vs. Consultancies), system module routing, and **4-Hour Cron Crawler Countdowns**.
  * **Far-Right Sidebar:** Houses autonomous rules and thresholds (ATS $\ge 90$ auto-create, 80–89 flags, Dehumanizer toggle), live aggregator ingress telemetry, and the **Pending Human Sign-Off Gate Queue**.
* **Visualizations:**
  * **Layered Mountain Area Chart:** Stylized, abstract mountain-like textures with warm orange/black gradients visualizing opportunity momentum over time.
  * **Circular Gauge Charts:** Radial progress dials displaying precise ATS compatibility scores.
  * **Compatibility Bar Charts & Throughput Line Graphs:** Funnel conversion metrics with explicit data point markers.

---

### 3. Core Functional Capabilities

#### 1. Multi-Scope & Platform Aggregation
* **Lilongwe Local (MW):** Crawls Capital Hill, Area 10/43 institutions, banks, NGOs, and government tender portals.
* **Lilongwe Remote Hub:** Malawi-based remote engineering and advisory positions.
* **International Remote:** Global remote opportunities (US, EU, Multilateral agencies) matching applicant expertise.
* **Platforms Integrated:** LinkedIn, Upwork Enterprise, ReliefWeb, Devex, and corporate career portals.

#### 2. Semantic ATS Scoring Engine
* Compares incoming job descriptions and terms of reference (ToRs) against the applicant's core competencies, skills database, and historical project experience.
* **Scoring Tiers:**
  * **$\ge 90$ (Critical Match / Auto-Ready):** Automatically triggers document creation and preps for review.
  * **80–89 (Flagged Review):** Automatically highlights into priority review queue for manual tuning.
  * **$<80$ (Standard):** Stored in archive with gap analysis.

#### 3. Pristine Document Studio
* **Resumes:** Upscale, white-collar formatting with instant switching between **1-Column Classic** and **2-Column Modern** layouts.
* **Cover Letters & Proposals:** Generates executive summaries and 4-part technical/financial proposals for consultancies scoring $\ge 90$.
* **Dehumanizer Engine:** Purges artificial intelligence tropes (*"delve"*, *"spearhead"*, *"testament to"*), substituting them with organic, executive-level human prose.
* **Export & Print:** High-contrast CSS formatting optimized for PDF export and direct printing.

#### 4. Online Form Auto-Filler & Mandatory Sign-Off Gate
* Automatically extracts and prefills standard online form fields (Name, Email, Malawi Phone, Work Authorization, Hourly/Monthly Rates, Screening Prompt answers).
* **Mandatory Human Authorization:** Athena operates strictly under applicant supervision. No form is submitted without checking the legal power-of-attorney box and typing the authorized legal signature.

#### 5. Application Receipts & Follow-Up Ledger
* Generates cryptographic confirmation receipts (e.g., `ATH-RCPT-882194`) with SHA-256 confirmation hashes upon successful dispatch.
* Automatically schedules a 7-day follow-up reminder and generates tailored follow-up email drafts.

#### 6. 4-Hour Cron Crawlers & n8n Integration
* Background scheduler runs automated discovery cycles every 4 hours.
* **n8n Webhook Endpoint (`/api/webhooks/n8n`):** Enables external n8n workflows to trigger scrapes, evaluate ATS scores, and orchestrate pipeline events.

---

### 4. Technical Architecture & Data Flow

* **Frontend:** React SPA built on Vite, TypeScript, and Tailwind CSS, utilizing modular components and custom CSS variables.
* **Backend:** Express.js server providing a Backend-For-Frontend (BFF) proxy pattern for secure AI interactions.
* **AI Engine:** `@google/genai` SDK using server-side Gemini API execution (`process.env.GEMINI_API_KEY`), ensuring zero API key exposure to the client.
* **State Management:** Local React state backed by persistent mock repositories and webhook event handlers.

---
*Specification compiled for Athena Autonomous Systems™ — Version 2.4.0 (2026).*
