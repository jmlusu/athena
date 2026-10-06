# Athena — Known Prototype Limitations & Decision Log

> **Category**: Engineering Technical Debt & OpenCode Decision Log  
> **Audience**: OpenCode Technical Leads  
> **Status**: COMPLETE & VERIFIED  

---

## 1. Prototype Limitations vs. Production Decisions

| Feature / Domain | AI Studio Prototype Status | OpenCode Production Architecture Requirement |
|---|---|---|
| **Database Persistence** | `PROTOTYPE_ONLY` (In-memory state and localStorage) | Persist all opportunities, applications, documents, receipts, and settings in production database (e.g. PostgreSQL / Cloud SQL). |
| **4-Hour Cron Scheduler** | `PROTOTYPE_ONLY` (Client-side `setInterval` countdown in `App.tsx`) | Use production background worker (e.g., Celery / Redis Queue / Cloud Scheduler) and sync countdown state via WebSocket / polling API. |
| **Live Web Scraping** | `PROTOTYPE_ONLY` (Simulated live discovery + Gemini query synthesis) | Connect to real Playwright / Scrapy / API scrapers for LinkedIn, Upwork, ReliefWeb, and Devex. |
| **Online Form Dispatch** | `PROTOTYPE_ONLY` (API mock returning generated receipt ID & SHA-256 hash) | Implement actual headless browser automation (Playwright/Puppeteer) or portal API submitter once human authorization is received. |
| **File Storage** | `PROTOTYPE_ONLY` (Local memory file list) | Store uploaded background documents (master CVs, case studies, portfolios) in production object storage (e.g. S3 / Cloud Storage). |
| **Authentication & Users** | `PROTOTYPE_ONLY` (Single candidate session for Chifuniro Phiri) | Support multi-tenant candidate accounts or user profile authentication via OAuth / JWT. |

---

## 2. Intentional Design Features (DO NOT ALTER)

1. **Mandatory Human Sign-Off Gate**:
   - *Status*: `INTENTIONAL_DESIGN`
   - *Rule*: Athena must **never** autonomously submit applications to external employers without explicit human checkbox confirmation and typed legal signature.
2. **Dehumanizer Engine**:
   - *Status*: `INTENTIONAL_DESIGN`
   - *Rule*: Generated prose must avoid robotic AI tropes (*"delve"*, *"spearheaded an ecosystem"*, *"testament to"*, *"in today's fast-paced world"*).
3. **Pristine Document Typography**:
   - *Status*: `INTENTIONAL_DESIGN`
   - *Rule*: Document Studio must render high-contrast black-on-white editorial paper styling with printable vector layouts.
4. **3-Scope Geographical Hierarchy**:
   - *Status*: `INTENTIONAL_DESIGN`
   - *Rule*: Must explicitly categorize listings into `Lilongwe Local (MW)`, `Lilongwe Remote Hub`, and `International Remote`.
