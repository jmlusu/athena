# Athena Profile Import — Jacob Mlusu

Markdown source documents for the Athena user profile (scoring + matching).

| Document | Purpose |
|----------|---------|
| [profile.md](profile.md) | Identity, summary, skills, languages, preferences |
| [resume.md](resume.md) | Full professional resume |
| [publications.md](publications.md) | Peer-reviewed research publications |
| [certifications.md](certifications.md) | Certification inventory |
| [certifications-education.md](certifications-education.md) | Combined certs + degrees + awards |
| [education.md](education.md) | Degrees and academic trajectory |
| [awards.md](awards.md) | Awards and recognition |
| [ats-keywords.md](ats-keywords.md) | ATS keyword bank and target roles |
| [media/](media/README.md) | **17 certificate/diploma files from `.media` → markdown** |

## Media → markdown (`profile/media/`)

Converted from `C:\Users\jmlus\athena\.media\` (16 PDFs + 1 JPG):

- **9× DataCamp** training certificates (Python, Stats I/II, Case Studies, NLP, Keras, Time Series, Unsupervised)
- **2× Udemy** (ChatGPT Ethically; Prompt Engineering for AI Bootcamp)
- **2× Splunk** (User; Power User)
- **1× Informatica** (PowerCenter Data Integration 9.x: Developer Specialist)
- **2× Degrees** (M.S. Howard University; B.S. Chemical Engineering)
- **1× AIChE** 3rd Place certificate
- **1× NFCU** Mission Data Certificate of Exceptional Support (JPG)

Index: [media/README.md](media/README.md)

**Profile API:** `POST /api/v1/athena/profiles`  
**Re-score jobs after profile save:** `POST /api/v1/athena/process`  
**UI:** http://localhost:1111/settings
