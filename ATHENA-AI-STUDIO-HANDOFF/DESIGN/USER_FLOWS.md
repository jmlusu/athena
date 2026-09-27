# Athena — User Flow Specification

> **Category**: UX Flow & Behavioral Reference  
> **Extraction Source**: `src/App.tsx`, `src/components/**/*`  
> **Status**: APPROVED & LOCKED  

---

## Flow 1: Automated 4-Hour Discovery → Evaluation → Document Auto-Generation

```text
[Cron Timer Fires / User clicks "Execute 4h Cycle Now"]
                      ↓
  [Athena Scraper aggregates Lilongwe & Global Feeds]
                      ↓
  [Gemini ATS Semantic Scoring Evaluator (0 - 100%)]
                      ↓
        ┌─────────────┴─────────────┐
        ▼                           ▼
[ATS Score ≥ 90%]           [ATS Score 80-89%]
        ↓                           ↓
Auto-Generate Pristine      Auto-Flag for Priority
Resume + Cover Letter/      Candidate Review in
Consultancy Proposal        Kanban & Sidebar Queue
        ↓                           ↓
Stage: "Tailored / Ready"   Stage: "Evaluated"
```

1. **Trigger**: 4-hour countdown reaches 0 or user clicks "Execute 4h Cycle Now".
2. **Execution**: System crawls configured feeds across LinkedIn, Upwork, ReliefWeb, and Corporate portals.
3. **Scoring**: Each listing receives an ATS score based on applicant skills and regional context.
4. **Auto-Pilot Branch**: If ATS $\ge 90\%$, system automatically generates a tailored resume and letter/proposal with the Dehumanizer active.
5. **Feedback**: Top toast alert: *"4-Hour JOB cron cycle triggered automated discovery."*

---

## Flow 2: Document Inspection, Column Layout Switch & Dehumanization

```text
[User opens "Pristine Document Studio" or clicks "Inspect Documents"]
                                ↓
        [Selects Opportunity from Dropdown or Pipeline]
                                ↓
     ┌──────────────────────────┼──────────────────────────┐
     ▼                          ▼                          ▼
[Toggle 1-Col vs 2-Col]   [Toggle Dehumanizer]    [Click Regenerate]
     ↓                          ↓                          ↓
Updates Visual Paper       Purges robotic AI      Calls Gemini 3.8
Layout instantly           filler in real time    to rewrite live
                                ↓
                 [Click "Print / PDF" or "Copy"]
                                ↓
                 Clean Vector Printout / Markdown
```

---

## Flow 3: Mandatory Human Sign-Off & Application Submission

```text
[User clicks "Sign-Off & Authorize" on Opportunity / Sidebar]
                              ↓
          [Opens FormFillerView / Sign-Off Modal]
                              ↓
  [Reviews Auto-Filled Candidate Fields & Screening Answers]
                              ↓
      [User must Check "I formally authorize Athena..."]
                              ↓
       [User types Legal Signature Name: "Chifuniro Phiri"]
                              ↓
         [Clicks "Authorize & Submit Application"]
                              ↓
    [Backend generates SHA-256 Hash & Receipt ID]
                              ↓
[Transition to ReceiptsView with Official Certificate & 7-Day Follow-Up]
```

---

## Flow 4: Export to LinkedIn (Easy Apply & Profile Experience)

```text
[User clicks "Export to LinkedIn" in Job Modal or Receipt Certificate]
                                ↓
                   [Opens LinkedInExportModal]
                                ↓
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
[Tab 1: Easy Apply]    [Tab 2: Experience]   [Tab 3: JSON / Markdown]
         ↓                      ↓                      ↓
Copy Headline, Pitch,  Copy Experience Entry  Download `.json` or
Skills & Full Note     Fields & Description   `.md` draft file
```
