# Athena — Asset & Visual Resource Manifest

> **Category**: Visual Assets & Fonts Manifest  
> **Extraction Source**: `index.html`, `public/`, `src/**/*`, `.media/`, `profile/media/`  
> **Status**: COMPLETE & VERIFIED  

---

## 1. Web Fonts

| Font Name | Source | Weights Loaded | Purpose |
|---|---|---|---|
| **Cinzel** | Google Fonts | `500, 600, 700` | Brand wordmark ("ATHENA"), executive seals, formal titles |
| **Lora** | Google Fonts | `400, 500, 600, 700` (Regular & Italic) | Document headings, letterheads, candidate names, proposal titles |
| **Plus Jakarta Sans** | Google Fonts | `300, 400, 500, 600, 700` | Primary application UI text, buttons, tables, cards, tooltips |
| **Monospace System** | System Font Stack | Regular, Semi-Bold | 4h countdown timers, ATS scores, SHA-256 hashes, code JSON |

HTML Font Link Tag:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
```

---

## 2. Iconography (Lucide React)

All UI icons in the prototype use `lucide-react` (v0.546.0+).

| Icon Component | Visual Representation | Key Usages |
|---|---|---|
| `Compass` | Compass needle | Pipeline & Command navigation icon |
| `Briefcase` | Business briefcase | Scraper & Discovery navigation icon |
| `FileText` | Document page | Pristine Document Studio, tailored CVs, certificates |
| `CheckSquare` | Checkbox | Online Forms & Sign-Off navigation icon |
| `Receipt` | Paper receipt | Receipts & Follow-ups navigation icon |
| `Workflow` | Connected nodes | n8n Workflow navigation & webhook badges |
| `User` / `UserCheck` | Person profile | Profile dossier & human sign-off gate |
| `Clock` | Analog clock | 4-hour countdown timers, posted relative times |
| `Sparkles` | Star sparkle | ATS $\ge 90\%$ critical match badge, automated generation |
| `AlertTriangle` | Warning triangle | ATS 80-89% auto-flagged review indicator |
| `ShieldCheck` | Shield with checkmark | Mandatory human authorization security badge |
| `Zap` | Lightning bolt | Dehumanizer toggle active indicator |
| `Globe` | Earth globe | International Remote scope filter |
| `Building` | Office building | Lilongwe Remote Hub scope filter |
| `MapPin` | Location pin | Lilongwe Local scope filter, physical locations |
| `Copy` / `Check` | Clipboard / Checkmark | Copy buttons across documents and LinkedIn modal |
| `Printer` | Desktop printer | Print / PDF document studio action |
| `RotateCw` | Circular arrows | Manual 4h cron trigger, scraper re-run, Gemini regenerate |
| `ExternalLink` | Arrow exiting square | LinkedIn Jobs external portal link |

---

## 3. Media & Educational Artifacts

Located in `profile/media/` and `.media/` in the project root:
- `American Institute of Chemical Engineers 3rd Place Certificate Jacob Mlusu.pdf`
- `Bachelor of Science in Chemical Engieering Jacob Mlusu.pdf`
- `Master of Sience in Chemical Engineering Jacob Mlusu.pdf`
- `Informatica_University_Certifcate_ Jacob_Mlusu.pdf`
- `Splunk Power User Certification - Jacob Mlusu.pdf`
- `Splunk User Certification - Jacob Mlusu.pdf`
- `DataCamp - Statistical Thinking in Python (Part 1 & 2)`
- `DataCamp - Case Studies in Statistical Thinking`
- `DataCamp - Machine Learning for Time Series Data`
- `DataCamp - Natural Language Processing in Python`
- `DataCamp - Image Modeling with Keras`
- `Udemy Prompt Engineering for AI Bootcamp Certification.pdf`
- `Udemy ChatGPT-Ethically Certificate of Completion.pdf`
