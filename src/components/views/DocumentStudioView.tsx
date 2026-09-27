import React, { useState } from "react";
import {
  FileText,
  Printer,
  Copy,
  Columns,
  Sparkles,
  Zap,
  CheckCircle2,
  Download,
  Edit3,
  RotateCw,
  Building,
  UserCheck,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { Opportunity, TailoredResume, TailoredDocument, ApplicantProfile } from "../../types";

interface DocumentStudioViewProps {
  selectedOpportunity: Opportunity | null;
  applicantProfile: ApplicantProfile;
  opportunities: Opportunity[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onOpenSignOff: (opp: Opportunity) => void;
}

export const DocumentStudioView: React.FC<DocumentStudioViewProps> = ({
  selectedOpportunity,
  applicantProfile,
  opportunities,
  onSelectOpportunity,
  onOpenSignOff,
}) => {
  // If no opportunity selected, pick the first one with >=90 ATS score or first item
  const currentOpp = selectedOpportunity || opportunities[0];

  const [activeTab, setActiveTab] = useState<"resume" | "cover_letter" | "proposal">(
    currentOpp?.category === "consultancy" ? "proposal" : "resume"
  );
  const [columnLayout, setColumnLayout] = useState<"one-column" | "two-column">("two-column");
  const [isDehumanized, setIsDehumanized] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Resume state
  const [resumeData, setResumeData] = useState<TailoredResume>(
    currentOpp?.tailoredResume || {
      fullName: applicantProfile.fullName,
      title: currentOpp?.title ? `Principal Consultant & ${currentOpp.title}` : applicantProfile.headline,
      contact: {
        email: applicantProfile.email,
        phone: applicantProfile.phone,
        location: applicantProfile.location,
        linkedin: "linkedin.com/in/chifuniro-phiri-mw",
      },
      summary:
        "Senior technology & operations leader with 10+ years directing complex systems, public sector digital platforms, and donor compliance programs in Lilongwe and global remote environments. Proven track record managing $3M+ portfolios with USAID, UNDP, and private enterprise.",
      skills: applicantProfile.skills,
      experience: applicantProfile.experience,
      education: applicantProfile.education,
      certifications: applicantProfile.certifications,
      layout: "two-column",
    }
  );

  // Cover Letter / Proposal state
  const [coverLetterData, setCoverLetterData] = useState<TailoredDocument>(
    currentOpp?.tailoredCoverLetter || {
      docType: "cover-letter",
      title: `Application for ${currentOpp?.title || "Target Role"}`,
      recipient: `${currentOpp?.company || "Hiring Committee"}, Lilongwe / Remote`,
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      greeting: `Dear Selection Committee at ${currentOpp?.company || "the Organization"},`,
      paragraphs: [
        `I am writing to express my direct interest in the ${currentOpp?.title || "position"}. My professional trajectory combines hands-on digital infrastructure implementation across Malawi with high-reliability remote operations for international partners.`,
        `In my recent leadership roles in Lilongwe, I directed complex technical deployments that streamlined reporting overhead by 40% and maintained 99.8% service reliability. Having reviewed your mandate regarding ${currentOpp?.requirements?.[0] || "technical execution"} and ${currentOpp?.requirements?.[1] || "stakeholder coordination"}, I am prepared to deliver measurable outcomes from Day 1.`,
        `I value clear communication, structured milestone accountability, and pragmatic problem-solving over buzzwords. I look forward to discussing how my background aligns with your project goals for 2026-2027.`,
      ],
      closing: "Sincerely,",
      signature: applicantProfile.fullName,
      layout: "one-column",
      dehumanized: true,
    }
  );

  const [proposalData, setProposalData] = useState<TailoredDocument>(
    currentOpp?.tailoredProposal || {
      docType: "consultancy-proposal",
      title: `Technical & Financial Proposal: ${currentOpp?.title || "Strategic Advisory Consultancy"}`,
      recipient: `${currentOpp?.company || "Evaluation Board"}, Lilongwe / International Secretariat`,
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      executiveSummary:
        "This proposal outlines a structured 90-day delivery roadmap for the consultancy. Rather than theoretical frameworks, the methodology emphasizes tangible weekly deliverables, rapid stakeholder alignment across Lilongwe institutions, and compliance with international standards.",
      sections: [
        {
          heading: "1. Understanding of Context & Objectives",
          body: "The assignment requires navigating both local institutional realities in Lilongwe (ministries, donor desks, civil society) and global best practices in technical governance and data integrity.",
        },
        {
          heading: "2. Phased Work Breakdown & Methodology",
          body: "Phase 1: Inception Audit & Stakeholder Scoping (Weeks 1-3)\nPhase 2: Strategic Architecture, Technical Drafting & Validation (Weeks 4-8)\nPhase 3: Stakeholder Consensus, Policy Finalization & Handover (Weeks 9-12).",
        },
        {
          heading: "3. Quality Assurance & Reporting Schedule",
          body: "Weekly milestone briefs, bi-weekly progress dashboards, and formal validation sign-offs prior to disbursement.",
        },
        {
          heading: "4. Professional Compensation & Milestone Terms",
          body: "Offered at a competitive senior consultancy rate ($450 - $650 USD / day or MWK equivalent) indexed to Lilongwe multilateral tier-1 advisory benchmarks.",
        },
      ],
      closing: "Respectfully submitted by,",
      signature: `${applicantProfile.fullName} (Principal Consultant)`,
      layout: "two-column",
      dehumanized: true,
    }
  );

  // Trigger Gemini AI to re-tailor document
  const handleRegenerateDocument = async () => {
    setIsGenerating(true);
    try {
      if (activeTab === "resume") {
        const res = await fetch("/api/ai/tailor-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job: currentOpp,
            applicantProfile,
            columnLayout,
            dehumanize: isDehumanized,
          }),
        });
        const data = await res.json();
        if (data.tailoredResume) {
          setResumeData(data.tailoredResume);
        }
      } else {
        const docType = activeTab === "proposal" ? "consultancy-proposal" : "cover-letter";
        const res = await fetch("/api/ai/tailor-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            docType,
            job: currentOpp,
            applicantProfile,
            columnLayout,
            dehumanize: isDehumanized,
          }),
        });
        const data = await res.json();
        if (data.document) {
          if (activeTab === "proposal") {
            setProposalData(data.document);
          } else {
            setCoverLetterData(data.document);
          }
        }
      }
    } catch (err) {
      console.error("Regenerate document error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    let content = "";
    if (activeTab === "resume") {
      content = `# ${resumeData.fullName}\n**${resumeData.title}**\n${resumeData.contact.location} | ${resumeData.contact.email} | ${resumeData.contact.phone}\n\n## Executive Summary\n${resumeData.summary}\n\n## Core Competencies\n${resumeData.skills.join(", ")}\n\n## Professional Experience\n${resumeData.experience.map((e) => `### ${e.role} - ${e.company} (${e.period})\n${e.bullets.map((b) => `- ${b}`).join("\n")}`).join("\n\n")}`;
    } else if (activeTab === "cover_letter") {
      content = `${coverLetterData.date}\n\n${coverLetterData.recipient}\n\n${coverLetterData.greeting}\n\n${coverLetterData.paragraphs?.join("\n\n")}\n\n${coverLetterData.closing}\n${coverLetterData.signature}`;
    } else {
      content = `# ${proposalData.title}\n**Client:** ${proposalData.recipient}\n**Date:** ${proposalData.date}\n\n## Executive Summary\n${proposalData.executiveSummary}\n\n${proposalData.sections?.map((s) => `### ${s.heading}\n${s.body}`).join("\n\n")}\n\n${proposalData.closing}\n${proposalData.signature}`;
    }

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Control Deck */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Target Opportunity Selector */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#18181B] text-[#F97316] flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif-heading text-base font-bold text-[#18181B]">
                Upscale White-Collar Document Studio
              </h3>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Pristine Typography
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[#64748B]">Tailored for:</span>
              <select
                value={currentOpp.id}
                onChange={(e) => {
                  const opp = opportunities.find((o) => o.id === e.target.value);
                  if (opp) onSelectOpportunity(opp);
                }}
                className="text-xs font-semibold bg-[#F4F5F7] border border-[#E2E8F0] rounded-md px-2 py-1 text-[#18181B] focus:outline-none"
              >
                {opportunities.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.category.toUpperCase()}: {o.title} ({o.company}) - ATS: {o.atsScore}%
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Column Layout Switcher (Prompt requirement 6 & 7) */}
          <div className="flex items-center bg-[#F4F5F7] p-1 rounded-lg border border-[#E2E8F0] text-xs">
            <button
              onClick={() => setColumnLayout("one-column")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                columnLayout === "one-column" ? "bg-[#18181B] text-white" : "text-[#64748B]"
              }`}
            >
              1 Column
            </button>
            <button
              onClick={() => setColumnLayout("two-column")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                columnLayout === "two-column" ? "bg-[#18181B] text-white" : "text-[#64748B]"
              }`}
            >
              2 Columns
            </button>
          </div>

          {/* Dehumanizer Filter Toggle */}
          <button
            onClick={() => setIsDehumanized(!isDehumanized)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              isDehumanized
                ? "bg-orange-50 border-[#F97316] text-[#EA580C]"
                : "bg-white border-[#E2E8F0] text-[#64748B]"
            }`}
            title="Purge AI tropes like 'delve', 'spearhead', 'testament'"
          >
            <Zap className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Dehumanized ({isDehumanized ? "Active" : "Off"})</span>
          </button>

          {/* Regenerate */}
          <button
            onClick={handleRegenerateDocument}
            disabled={isGenerating}
            className="px-3 py-1.5 bg-[#F4F5F7] hover:bg-[#E2E8F0] text-[#18181B] text-xs font-medium rounded-lg border border-[#CBD5E1] flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[#64748B] ${isGenerating ? "animate-spin" : ""}`} />
            <span>Regenerate with Gemini</span>
          </button>

          {/* Copy Markdown */}
          <button
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 bg-[#F4F5F7] hover:bg-[#E2E8F0] text-[#18181B] text-xs font-medium rounded-lg border border-[#CBD5E1] flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>

          {/* Print / PDF Export */}
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-[#18181B] hover:bg-[#2A2E37] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Document Type Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-1 no-print text-xs">
        <button
          onClick={() => setActiveTab("resume")}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "resume"
              ? "border-[#F97316] text-[#18181B]"
              : "border-transparent text-[#64748B] hover:text-[#18181B]"
          }`}
        >
          <span>Pristine Tailored Resume</span>
          <span className="text-[10px] font-mono text-[#F97316] bg-orange-50 px-1.5 py-0.2 rounded">
            {columnLayout}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("cover_letter")}
          className={`px-4 py-2 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === "cover_letter"
              ? "border-[#F97316] text-[#18181B]"
              : "border-transparent text-[#64748B] hover:text-[#18181B]"
          }`}
        >
          <span>Tailored Cover Letter</span>
          <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
            Humanized
          </span>
        </button>

        {currentOpp?.category === "consultancy" && (
          <button
            onClick={() => setActiveTab("proposal")}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "proposal"
                ? "border-[#DC2626] text-[#18181B]"
                : "border-transparent text-[#64748B] hover:text-[#18181B]"
            }`}
          >
            <span>Consultancy Proposal & Executive Summary</span>
            <span className="text-[10px] font-mono text-red-600 bg-red-50 px-1.5 py-0.2 rounded">
              ≥90 Auto-Gen
            </span>
          </button>
        )}
      </div>

      {/* Document Canvas (Pristine Upscale White-Collar Paper) */}
      <div className="bg-white border border-[#D1D5DB] rounded-xl p-8 sm:p-12 shadow-sm max-w-4xl mx-auto resume-paper transition-all">
        {/* ================= RESUME VIEW ================= */}
        {activeTab === "resume" && (
          <div className="space-y-6 text-[#18181B]">
            {/* Header / Contact Banner */}
            <div className="border-b-2 border-[#18181B] pb-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-serif-heading tracking-tight text-[#18181B]">
                  {resumeData.fullName}
                </h1>
                <div className="text-xs font-mono text-[#475569] space-x-2">
                  <span>{resumeData.contact.location}</span>
                  <span>•</span>
                  <span>{resumeData.contact.phone}</span>
                  <span>•</span>
                  <span>{resumeData.contact.email}</span>
                </div>
              </div>
              <div className="text-sm font-semibold uppercase tracking-widest text-[#F97316] mt-1 font-mono">
                {resumeData.title}
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono border-b border-[#E2E8F0] pb-1">
                Executive Profile
              </h2>
              <p className="text-xs text-[#334155] leading-relaxed text-justify">
                {resumeData.summary}
              </p>
            </div>

            {/* Layout Split: 1-Column vs 2-Column */}
            {columnLayout === "two-column" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column (Skills, Education, Certs) */}
                <div className="space-y-5 md:border-r md:border-[#E2E8F0] md:pr-4">
                  {/* Skills */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono border-b border-[#E2E8F0] pb-1">
                      Core Competencies
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {resumeData.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-[#F4F5F7] text-[#1E293B] px-2 py-0.5 rounded border border-[#E2E8F0] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono border-b border-[#E2E8F0] pb-1">
                      Certifications
                    </h3>
                    <div className="space-y-1 text-xs text-[#334155]">
                      {resumeData.certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="text-[#F97316] font-bold">•</span>
                          <span>{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono border-b border-[#E2E8F0] pb-1">
                      Education
                    </h3>
                    <div className="space-y-2 text-xs">
                      {resumeData.education.map((edu, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="font-semibold text-[#18181B]">{edu.degree}</div>
                          <div className="text-[#64748B] text-[11px]">{edu.institution} ({edu.year})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column (Experience & Impact) */}
                <div className="md:col-span-2 space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono border-b border-[#E2E8F0] pb-1">
                    Selected Professional Engagements & Consultancies
                  </h3>
                  <div className="space-y-4">
                    {resumeData.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs">
                          <span className="font-bold text-[#18181B] text-sm">{exp.role}</span>
                          <span className="text-[#64748B] font-mono text-[11px]">{exp.period}</span>
                        </div>
                        <div className="text-xs text-[#475569] font-medium italic">
                          {exp.company} — {exp.location}
                        </div>
                        <ul className="space-y-1 text-xs text-[#334155] list-disc list-outside pl-4">
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* 1-Column Classic Upscale Executive Layout */
              <div className="space-y-6">
                {/* Experience */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono border-b border-[#E2E8F0] pb-1">
                    Professional Experience
                  </h3>
                  <div className="space-y-4">
                    {resumeData.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-bold text-[#18181B] text-sm">{exp.role} — {exp.company}</span>
                          <span className="text-[#64748B] font-mono">{exp.period} | {exp.location}</span>
                        </div>
                        <ul className="space-y-1 text-xs text-[#334155] list-disc list-outside pl-4 pt-1">
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills & Education side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0]">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono">
                      Technical & Operational Competencies
                    </h3>
                    <div className="flex flex-wrap gap-1 text-xs">
                      {resumeData.skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#F4F5F7] rounded text-[11px] font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono">
                      Education & Credentials
                    </h3>
                    <div className="space-y-1 text-xs text-[#334155]">
                      {resumeData.education.map((e, i) => (
                        <div key={i}>
                          <span className="font-semibold">{e.degree}</span> — {e.institution} ({e.year})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= COVER LETTER VIEW ================= */}
        {activeTab === "cover_letter" && (
          <div className="space-y-6 text-[#18181B] font-sans">
            {/* Executive Letterhead */}
            <div className="border-b border-[#CBD5E1] pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold font-serif-heading text-[#18181B]">
                  {applicantProfile.fullName}
                </h1>
                <p className="text-xs text-[#64748B] font-mono mt-0.5">{applicantProfile.headline}</p>
              </div>
              <div className="text-right text-xs font-mono text-[#64748B]">
                <div>{applicantProfile.location}</div>
                <div>{applicantProfile.email}</div>
                <div>{applicantProfile.phone}</div>
              </div>
            </div>

            {/* Date & Recipient */}
            <div className="text-xs text-[#334155] space-y-1 font-mono">
              <div className="font-semibold">{coverLetterData.date}</div>
              <div className="text-[#18181B] font-bold">{coverLetterData.recipient}</div>
            </div>

            {/* Subject */}
            <div className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono bg-[#F8F9FA] p-2 rounded border border-[#E2E8F0]">
              RE: {coverLetterData.title}
            </div>

            {/* Greeting */}
            <div className="text-xs font-semibold text-[#18181B]">{coverLetterData.greeting}</div>

            {/* Letter Body Paragraphs */}
            <div className="space-y-4 text-xs text-[#334155] leading-relaxed text-justify">
              {coverLetterData.paragraphs?.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Sign-off */}
            <div className="pt-4 space-y-3 text-xs">
              <div>{coverLetterData.closing}</div>
              <div className="font-brand font-bold text-base text-[#18181B]">
                {coverLetterData.signature}
              </div>
              <div className="text-[11px] text-[#64748B] font-mono">
                Principal Consultant & Senior Technical Lead
              </div>
            </div>
          </div>
        )}

        {/* ================= CONSULTANCY PROPOSAL VIEW ================= */}
        {activeTab === "proposal" && (
          <div className="space-y-6 text-[#18181B]">
            {/* Proposal Header */}
            <div className="border-b-2 border-[#DC2626] pb-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#DC2626] font-bold">
                CONFIDENTIAL ADVISORY PROPOSAL
              </div>
              <h1 className="text-2xl font-bold font-serif-heading text-[#18181B] mt-1">
                {proposalData.title}
              </h1>
              <div className="flex justify-between items-center text-xs text-[#64748B] mt-2 font-mono">
                <span>Client: {proposalData.recipient}</span>
                <span>Date: {proposalData.date}</span>
              </div>
            </div>

            {/* Executive Summary Box (Prompt requirement 20) */}
            <div className="bg-[#FFF5F5] border-l-4 border-l-[#DC2626] border border-red-200 p-4 rounded-r-lg space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-900 font-mono">
                Executive Summary (ATS ≥ 90 Automated Synthesis)
              </h3>
              <p className="text-xs text-red-950 leading-relaxed text-justify">
                {proposalData.executiveSummary}
              </p>
            </div>

            {/* Proposal Sections (Prompt requirement 21) */}
            <div className="space-y-5">
              {proposalData.sections?.map((sec, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono border-b border-[#E2E8F0] pb-1">
                    {sec.heading}
                  </h3>
                  <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-line text-justify">
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Sign-off */}
            <div className="pt-4 border-t border-[#E2E8F0] flex justify-between items-end text-xs">
              <div className="space-y-1">
                <div className="text-[#64748B]">{proposalData.closing}</div>
                <div className="font-bold text-[#18181B] font-serif-heading text-sm">
                  {proposalData.signature}
                </div>
                <div className="text-[10px] text-[#64748B] font-mono">
                  Verified Signatory • Lilongwe, Malawi
                </div>
              </div>

              <button
                onClick={() => onOpenSignOff(currentOpp)}
                className="no-print px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Sign-Off & Authorize Submission</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
