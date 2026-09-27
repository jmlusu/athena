# Athena — Visual Reference & Screenshot Catalog

> **Category**: QA Visual Index  
> **Audience**: OpenCode Frontend & QA Teams  
> **Status**: COMPLETE & VERIFIED  

---

## 1. Visual Reference Screen Catalog

```text
VISUAL_QA/screenshots/
│
├── 01-pipeline-command-desktop.png        # Full desktop view of Pipeline & Command
├── 02-mountain-momentum-chart.png         # Abstract mountain dynamics SVG & tooltip
├── 03-kanban-stages.png                   # 6-stage Kanban board with card status badges
├── 04-scraper-discovery.png               # Scraper discovery view with 4 scope selector pills
├── 05-document-studio-2col.png            # Document studio 2-column pristine tailored resume
├── 06-document-studio-proposal.png        # Consultancy proposal & executive summary view
├── 07-form-filler-signoff-gate.png        # Online form manifest & human sign-off gate
├── 08-receipts-certificate.png            # Official SHA-256 submission certificate
├── 09-linkedin-export-easy-apply.png      # LinkedIn Easy Apply export modal
├── 10-linkedin-export-experience.png      # LinkedIn profile experience section mapping
├── 11-n8n-workflow-nodes.png              # 5-node visual n8n topology and webhook tester
└── 12-applicant-profile-dossier.png       # Candidate dossier, rates & dynamic ATS keywords
```

---

## 2. Screenshot Capture Checklist & Instructions

For OpenCode QA engineers running visual comparison testing against the AI Studio preview:

1. **Resolution**: Capture desktop screenshots at `1440 x 900` or `1920 x 1080` resolution.
2. **State Setup**:
   - `01-pipeline-command-desktop.png`: Scope set to `All`, category set to `All`.
   - `05-document-studio-2col.png`: Active tab `Pristine Tailored Resume`, layout `2 Columns`, Dehumanizer `Active`.
   - `06-document-studio-proposal.png`: Opportunity set to `Consultancy: National Digital Transformation`, tab `Consultancy Proposal & Executive Summary`.
   - `07-form-filler-signoff-gate.png`: Click "Sign-Off & Authorize" on any $\ge 90\%$ role.
   - `09-linkedin-export-easy-apply.png`: Click "Export to LinkedIn" on any opportunity card.
