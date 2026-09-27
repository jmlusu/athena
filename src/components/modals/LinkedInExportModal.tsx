import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  ExternalLink,
  Briefcase,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Code,
  Layers,
  MapPin,
  Building,
  Calendar,
  Zap,
} from "lucide-react";
import { Opportunity, ApplicationReceipt } from "../../types";

interface LinkedInExportModalProps {
  opportunity: Opportunity | null;
  receipt?: ApplicationReceipt | null;
  onClose: () => void;
}

export const LinkedInExportModal: React.FC<LinkedInExportModalProps> = ({
  opportunity,
  receipt,
  onClose,
}) => {
  if (!opportunity) return null;

  const [activeTab, setActiveTab] = useState<"easy-apply" | "experience-entry" | "raw-json">("easy-apply");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Structured Draft Data derivation
  const isConsultancy = opportunity.category === "consultancy";
  const employmentType = isConsultancy ? "Contract / Freelance" : "Full-time";
  
  const locationType = opportunity.scope === "lilongwe-remote" || opportunity.scope === "international-remote"
    ? "Remote"
    : opportunity.location.toLowerCase().includes("hybrid")
    ? "Hybrid"
    : "On-site";

  const headline = `${opportunity.title} | Expert in ${opportunity.requirements.slice(0, 3).join(", ")}`;
  
  const pitch =
    opportunity.dehumanizedPitch ||
    opportunity.tailoredResume?.summary ||
    `Seasoned professional with direct experience delivering high-impact initiatives in ${opportunity.location}. Proven track record in ${opportunity.requirements.slice(0, 3).join(", ")}.`;

  const skillsList = opportunity.requirements || [];
  const skillsComma = skillsList.join(", ");
  const skillsHashtags = skillsList.map((s) => `#${s.replace(/[^a-zA-Z0-9]/g, "")}`).join(" ");

  // Easy Apply Cover Note
  const easyApplyCoverNote = `Dear Hiring Team at ${opportunity.company},

I am applying for the ${opportunity.title} position${receipt ? ` (Submission Reference: ${receipt.receiptId})` : ""}.

Key Qualifications:
• Direct expertise in: ${opportunity.requirements.slice(0, 4).join(", ")}
• Operating context: ${opportunity.location} (${locationType})
• Expected compensation: ${opportunity.salaryOrBudget}
• Availability: Immediate / Standard 2-week transition

${pitch}

I look forward to discussing how my experience aligns with your milestones.

Best regards,
${receipt?.applicantName || "Chifuniro Phiri"}
${receipt ? `[Verified via Athena Application Pipeline - Hash: ${receipt.confirmationHash.slice(0, 16)}]` : ""}`;

  // Experience Entry Description (for LinkedIn Profile Experience Section)
  const experienceBullets = opportunity.tailoredResume?.experience?.[0]?.bullets?.length
    ? opportunity.tailoredResume.experience[0].bullets
    : [
        `Spearheaded core deliverables for ${opportunity.title}, aligning technical objectives with organizational priorities.`,
        `Executed milestone deliverables with 100% compliance across ${opportunity.requirements.slice(0, 3).join(", ")}.`,
        `Collaborated with cross-functional stakeholders in ${opportunity.location} and international partners.`,
      ];

  const experienceDescription = `Role: ${opportunity.title}
Organization: ${opportunity.company}
Engagement Scope: ${opportunity.category === "consultancy" ? "Consultancy Mandate" : "Key Strategic Role"}

Key Deliverables & Responsibilities:
${experienceBullets.map((b) => `• ${b}`).join("\n")}

Core Technologies & Domain Competencies:
${skillsList.map((s) => `• ${s}`).join("\n")}

${receipt ? `Athena Verification Receipt: ${receipt.receiptId} | SHA256: ${receipt.confirmationHash.slice(0, 16)}` : ""}`;

  // Complete Export JSON Payload
  const exportPayload = {
    exportVersion: "1.0",
    generatedAt: new Date().toISOString(),
    opportunity: {
      id: opportunity.id,
      title: opportunity.title,
      company: opportunity.company,
      location: opportunity.location,
      category: opportunity.category,
      scope: opportunity.scope,
      salaryOrBudget: opportunity.salaryOrBudget,
      platform: opportunity.platform,
    },
    linkedInEasyApply: {
      headline,
      pitch,
      coverNote: easyApplyCoverNote,
      skills: skillsList,
      screeningAnswers: {
        yearsExperience: "9+",
        workAuthorization: "Authorized for Lilongwe, Malawi and International Remote contracts",
        desiredCompensation: opportunity.salaryOrBudget,
        availability: "Immediate / 2 Weeks",
      },
    },
    linkedInProfileExperience: {
      title: opportunity.title,
      companyName: opportunity.company,
      employmentType,
      location: opportunity.location,
      locationType,
      currentlyWorking: receipt?.status === "SUBMITTED" || opportunity.status === "submitted",
      startDate: new Date().toISOString().slice(0, 7), // YYYY-MM
      description: experienceDescription,
      skills: skillsList.slice(0, 5),
    },
    verificationReceipt: receipt || null,
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    const safeCompany = opportunity.company.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    downloadAnchor.setAttribute("download", `linkedin-draft-${safeCompany}-${opportunity.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadMarkdown = () => {
    const mdContent = `# LinkedIn Application & Profile Draft
**Target Role**: ${opportunity.title}
**Company/Client**: ${opportunity.company}
**Generated**: ${new Date().toLocaleDateString()}
${receipt ? `**Submission Receipt**: ${receipt.receiptId}` : ""}

---

## 1. LinkedIn Easy Apply Package

### Headline
\`\`\`
${headline}
\`\`\`

### Summary / Pitch
${pitch}

### Skills & Tags
${skillsHashtags}

### Easy Apply Cover Note
\`\`\`
${easyApplyCoverNote}
\`\`\`

---

## 2. LinkedIn Experience Entry (Profile)

- **Title**: ${opportunity.title}
- **Company**: ${opportunity.company}
- **Employment Type**: ${employmentType}
- **Location**: ${opportunity.location} (${locationType})

### Description:
${experienceDescription}
`;
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    const safeCompany = opportunity.company.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    downloadAnchor.setAttribute("download", `linkedin-draft-${safeCompany}-${opportunity.id}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-[#CBD5E1] rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-gradient-to-r from-[#004182]/5 via-white to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center shadow-md font-bold text-lg">
              in
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#18181B] font-serif-heading">
                  Export to LinkedIn Draft
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F4F9] text-[#0A66C2] font-semibold border border-[#0A66C2]/20">
                  Ready for Paste & Apply
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                {opportunity.title} • {opportunity.company}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#18181B] p-1.5 rounded-lg hover:bg-[#F4F5F7] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-[#E2E8F0] bg-[#F8FAFC] gap-2 pt-2">
          <button
            onClick={() => setActiveTab("easy-apply")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "easy-apply"
                ? "bg-white text-[#0A66C2] border-[#0A66C2] shadow-2xs"
                : "text-[#64748B] hover:text-[#18181B] border-transparent"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>LinkedIn Easy Apply Draft</span>
          </button>

          <button
            onClick={() => setActiveTab("experience-entry")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "experience-entry"
                ? "bg-white text-[#0A66C2] border-[#0A66C2] shadow-2xs"
                : "text-[#64748B] hover:text-[#18181B] border-transparent"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Profile Experience Entry</span>
          </button>

          <button
            onClick={() => setActiveTab("raw-json")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "raw-json"
                ? "bg-white text-[#0A66C2] border-[#0A66C2] shadow-2xs"
                : "text-[#64748B] hover:text-[#18181B] border-transparent"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>JSON / Developer Export</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-[#FAFAFA]">
          {/* TAB 1: EASY APPLY */}
          {activeTab === "easy-apply" && (
            <div className="space-y-4">
              {/* Context Alert */}
              <div className="bg-[#EBF3FB] border border-[#B8D7F2] p-3.5 rounded-xl flex items-start justify-between gap-3 text-xs text-[#004182]">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#0A66C2] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Tailored for LinkedIn 1-Click & Easy Apply Workflows</span>
                    <p className="text-[11px] text-[#285A88] mt-0.5">
                      Use the individual copy buttons below to paste structured fields directly into LinkedIn modal forms or recruiter outreach.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(easyApplyCoverNote, "all-easy-apply")}
                  className="px-3 py-1 bg-[#0A66C2] hover:bg-[#004182] text-white text-[11px] font-semibold rounded-lg shrink-0 flex items-center gap-1 shadow-xs transition-colors"
                >
                  {copiedKey === "all-easy-apply" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied All!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Note</span>
                    </>
                  )}
                </button>
              </div>

              {/* Headline Field */}
              <div className="bg-white border border-[#E2E8F0] p-3.5 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-[#64748B]">
                    Recommended LinkedIn Headline
                  </span>
                  <button
                    onClick={() => handleCopy(headline, "headline")}
                    className="text-xs font-semibold text-[#0A66C2] hover:underline flex items-center gap-1"
                  >
                    {copiedKey === "headline" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "headline" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-xs font-semibold text-[#18181B]">{headline}</p>
              </div>

              {/* Pitch / Summary Field */}
              <div className="bg-white border border-[#E2E8F0] p-3.5 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-[#64748B]">
                    Dehumanized Candidate Pitch (Cover Note Text)
                  </span>
                  <button
                    onClick={() => handleCopy(pitch, "pitch")}
                    className="text-xs font-semibold text-[#0A66C2] hover:underline flex items-center gap-1"
                  >
                    {copiedKey === "pitch" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "pitch" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-xs text-[#334155] leading-relaxed italic bg-[#F8FAFC] p-2.5 rounded-lg border border-[#F1F5F9]">
                  "{pitch}"
                </p>
              </div>

              {/* Key Skills & Hashtags */}
              <div className="bg-white border border-[#E2E8F0] p-3.5 rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-[#64748B]">
                    Extracted ATS Skills & LinkedIn Tags
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCopy(skillsComma, "skills-comma")}
                      className="text-xs font-semibold text-[#0A66C2] hover:underline flex items-center gap-1"
                    >
                      {copiedKey === "skills-comma" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Comma List</span>
                    </button>
                    <button
                      onClick={() => handleCopy(skillsHashtags, "skills-hash")}
                      className="text-xs font-semibold text-[#0A66C2] hover:underline flex items-center gap-1"
                    >
                      {copiedKey === "skills-hash" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Hashtags</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {skillsList.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Full Easy Apply Text Preview */}
              <div className="bg-white border border-[#E2E8F0] p-3.5 rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-[#64748B]">
                    Full Formatted Easy Apply / Message Draft
                  </span>
                  <button
                    onClick={() => handleCopy(easyApplyCoverNote, "cover-note")}
                    className="text-xs font-semibold text-[#0A66C2] hover:underline flex items-center gap-1"
                  >
                    {copiedKey === "cover-note" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "cover-note" ? "Copied" : "Copy Draft"}</span>
                  </button>
                </div>

                <pre className="text-xs text-[#334155] whitespace-pre-wrap font-sans bg-[#F8FAFC] p-3 rounded-lg border border-[#F1F5F9] leading-relaxed">
                  {easyApplyCoverNote}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: EXPERIENCE ENTRY */}
          {activeTab === "experience-entry" && (
            <div className="space-y-4">
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-3.5 rounded-xl flex items-start justify-between gap-3 text-xs text-emerald-900">
                <div className="flex items-start gap-2.5">
                  <Briefcase className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Add to LinkedIn Profile "Experience" Section</span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Direct form mapping to add this mandate or role into your official LinkedIn profile experience history.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(experienceDescription, "exp-desc")}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold rounded-lg shrink-0 flex items-center gap-1 shadow-xs transition-colors"
                >
                  {copiedKey === "exp-desc" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied Description!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Description</span>
                    </>
                  )}
                </button>
              </div>

              {/* Form mapping grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Title</span>
                  <div className="font-semibold text-[#18181B] flex items-center justify-between">
                    <span>{opportunity.title}</span>
                    <button
                      onClick={() => handleCopy(opportunity.title, "title-fld")}
                      className="text-[#0A66C2] hover:underline text-[11px]"
                    >
                      {copiedKey === "title-fld" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Company Name</span>
                  <div className="font-semibold text-[#18181B] flex items-center justify-between">
                    <span>{opportunity.company}</span>
                    <button
                      onClick={() => handleCopy(opportunity.company, "company-fld")}
                      className="text-[#0A66C2] hover:underline text-[11px]"
                    >
                      {copiedKey === "company-fld" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Employment Type</span>
                  <div className="font-semibold text-[#18181B]">{employmentType}</div>
                </div>

                <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Location & Workplace Type</span>
                  <div className="font-semibold text-[#18181B]">{opportunity.location} ({locationType})</div>
                </div>
              </div>

              {/* Description Box */}
              <div className="bg-white border border-[#E2E8F0] p-3.5 rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-[#64748B]">
                    Formatted Experience Description Box
                  </span>
                  <button
                    onClick={() => handleCopy(experienceDescription, "exp-full")}
                    className="text-xs font-semibold text-[#0A66C2] hover:underline flex items-center gap-1"
                  >
                    {copiedKey === "exp-full" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === "exp-full" ? "Copied" : "Copy Description"}</span>
                  </button>
                </div>

                <pre className="text-xs text-[#334155] whitespace-pre-wrap font-sans bg-[#F8FAFC] p-3.5 rounded-lg border border-[#F1F5F9] leading-relaxed">
                  {experienceDescription}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: RAW JSON */}
          {activeTab === "raw-json" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748B]">
                  Standardized JSON export containing verified hashes, screening responses, and ATS keywords.
                </span>
                <button
                  onClick={() => handleCopy(JSON.stringify(exportPayload, null, 2), "raw-json-copy")}
                  className="px-3 py-1.5 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === "raw-json-copy" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied JSON!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Raw JSON</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#18181B] text-emerald-400 p-4 rounded-xl font-mono text-[11px] max-h-96 overflow-y-auto border border-[#3E4452]">
                <pre>{JSON.stringify(exportPayload, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-white border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#334155] text-xs font-semibold rounded-xl border border-[#CBD5E1] flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Save as Markdown (.md)</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#334155] text-xs font-semibold rounded-xl border border-[#CBD5E1] flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Code className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Save as JSON (.json)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://www.linkedin.com/jobs/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-[#F0F7FD] hover:bg-[#E1EFFB] text-[#0A66C2] text-xs font-semibold rounded-xl border border-[#B8D7F2] flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open LinkedIn Jobs</span>
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
