# Athena — Route Mapping Specification

> **Category**: Route Mapping & Architecture  
> **Audience**: OpenCode Frontend Architecture Team  
> **Status**: COMPLETE & VERIFIED  

---

## 1. Prototype vs Production Route Mapping

| AI Studio Module (`NavView`) | Prototype Route | Production Conceptual Route | Screen Title | Key Functional Purpose |
|---|---|---|---|---|
| `pipeline` | `/` or `/pipeline` | `/pipeline` or `/dashboard` | Pipeline & Command | Main command center, mountain dynamics graph, metric cards, 6-stage Kanban board. |
| `scraper` | `/scraper` | `/discovery` or `/scraper` | Scraper & Discovery | Multi-scope aggregator, platform filters, sourced opportunities table. |
| `documents` | `/documents` | `/documents` or `/documents/:id` | Pristine Document Studio | 1-col vs 2-col resume, cover letter, consultancy proposal, Dehumanizer toggle, PDF print. |
| `form_filler` | `/forms` | `/apply/:id` or `/forms` | Online Forms & Sign-Off | Online candidate manifest, screening text, mandatory human power-of-attorney sign-off gate. |
| `receipts` | `/receipts` | `/receipts` or `/receipts/:id` | Receipts & Follow-ups | Verified application certificates, SHA-256 tokens, 7-day follow-up outreach email draft, LinkedIn export. |
| `n8n` | `/n8n` | `/settings/integrations/n8n` | n8n Workflow Nodes | 5-node visual topology, inbound webhook tester (`POST /api/webhooks/n8n`), response terminal. |
| `profile` | `/profile` | `/profile` or `/settings/profile` | Applicant Skills & Profile | Candidate identification, rates, dynamic ATS keyword manager, master CV/portfolio uploads. |

---

## 2. Deep Linking Expectations

- Deep linking to a specific opportunity's document workspace: `/documents?id=[opportunityId]` or `/documents/[opportunityId]`.
- Deep linking to a specific submission receipt certificate: `/receipts?id=[receiptId]` or `/receipts/[receiptId]`.
- Directing to sign-off modal from external notifications or email alerts: `/apply/[opportunityId]`.
