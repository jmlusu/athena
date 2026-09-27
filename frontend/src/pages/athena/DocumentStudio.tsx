import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Printer,
  Copy,
  Columns,
  Sparkles,
  Zap,
  CheckCircle2,
  RotateCw,
  Download,
  Edit3,
  Building,
  UserCheck,
  ShieldCheck,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  Opportunity,
  TailoredResume,
  TailoredDocument,
  ApplicantProfile,
  PipelineStatus,
} from "../../lib/athena/types";
import type { TailoredResume as AITailoredResume, TailoredDocument as AITailoredDocument } from "../../lib/athena/aiTypes";
import {
  aiHealth,
  tailorResumeAI,
  tailorDocumentAI,
  dehumanizeText,
} from "../../lib/athena/api";
import { cn } from "../../lib/athena/utils";
import { Button, AccentButton, OutlineButton, GhostButton, PrimaryButton } from "@/components/athena/ui/Button";
import { Badge, StatusPill } from "@/components/athena/ui/Badge";

interface DocumentStudioProps {
  selectedOpportunity?: Opportunity | null;
  applicantProfile?: ApplicantProfile;
  opportunities?: Opportunity[];
  onSelectOpportunity?: (opp: Opportunity) => void;
  onOpenSignOff?: (opp: Opportunity) => void;
}

export const DocumentStudio: React.FC<DocumentStudioProps> = ({
  selectedOpportunity: selectedOpportunityProp,
  applicantProfile: applicantProfileProp,
  opportunities: opportunitiesProp = [],
  onSelectOpportunity,
  onOpenSignOff,
}) => {
  const { jobId } = useParams<{ jobId?: string }>();
  const navigate = useNavigate();

  // State for selected opportunity (from prop, param, or first available)
  const [currentOpp, setCurrentOpp] = useState<Opportunity | null>(selectedOpportunityProp || null);
  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfile | null>(applicantProfileProp || null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(opportunitiesProp);

  // UI state
  const [activeTab, setActiveTab] = useState<"resume" | "cover_letter" | "proposal">(
    currentOpp?.category === "consultancy" ? "proposal" : "resume"
  );
  const [columnLayout, setColumnLayout] = useState<"one-column" | "two-column">("two-column");
  const [isDehumanized, setIsDehumanized] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiStatus, setAiStatus] = useState<"checking" | "available" | "unavailable">("checking");

  // Resume state
  const [resumeData, setResumeData] = useState<TailoredResume>(
    currentOpp?.tailoredResume || {
      fullName: applicantProfile?.fullName || "Chifuniro Phiri",
      title: currentOpp?.title ? `Principal Consultant & ${currentOpp.title}` : "Senior Technology & Operations Specialist",
      contact: {
        email: applicantProfile?.email || "chifuniro.phiri@consult-mw.com",
        phone: "+265 99 412 8890",
        location: "Area 10, Lilongwe, Malawi",
        linkedin: "linkedin.com/in/chifuniro-phiri-mw",
      },
      summary:
        "Senior technology & operations leader with 10+ years directing complex systems, public sector digital platforms, and donor compliance programs in Lilongwe and global remote environments. Proven track record managing $3M+ portfolios with USAID, UNDP, and private enterprise.",
      skills: applicantProfile?.skills?.map((s: any) => s.name || s) || [],
      experience: applicantProfile?.experience || [],
      education: applicantProfile?.education || [],
      certifications: applicantProfile?.certifications || [],
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
      signature: applicantProfile?.fullName || "Chifuniro Phiri",
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
      signature: `${applicantProfile?.fullName || "Chifuniro Phiri"} (Principal Consultant)`,
      layout: "two-column",
      dehumanized: true,
    }
  );

  // Update state when props change
  useEffect(() => {
    if (selectedOpportunityProp) {
      setCurrentOpp(selectedOpportunityProp);
    }
  }, [selectedOpportunityProp]);

  useEffect(() => {
    if (applicantProfileProp) {
      setApplicantProfile(applicantProfileProp);
    }
  }, [applicantProfileProp]);

  useEffect(() => {
    if (opportunitiesProp.length > 0) {
      setOpportunities(opportunitiesProp);
    }
  }, [opportunitiesProp]);

  // Load opportunity from jobId param if not already set
  useEffect(() => {
    if (jobId && !currentOpp) {
      const opp = opportunities.find((o) => o.id === jobId);
      if (opp) {
        setCurrentOpp(opp);
      }
    }
  }, [jobId, opportunities, currentOpp]);

  // Check AI provider health
  useEffect(() => {
    const checkAI = async () => {
      try {
        const health = await aiHealth();
        setAiStatus(health.has_api_key ? "available" : "unavailable");
      } catch {
        setAiStatus("unavailable");
      }
    };
    checkAI();
  }, []);

  // Trigger Gemini AI to re-tailor document
  const handleRegenerateDocument = async () => {
    if (!currentOpp || !applicantProfile) return;

    setIsGenerating(true);
    try {
      const jobRecord: Record<string, unknown> = currentOpp as unknown as Record<string, unknown>;
      const profileRecord: Record<string, unknown> = {
        fullName: applicantProfile.fullName,
        email: applicantProfile.email,
        phone: applicantProfile.phone,
        location: applicantProfile.location,
        headline: applicantProfile.headline,
        summary: applicantProfile.summary,
        skills: applicantProfile.skills,
        experience: applicantProfile.experience,
        education: applicantProfile.education,
        certifications: applicantProfile.certifications,
        hourlyRateUsd: applicantProfile.hourlyRateUsd,
        expectedMonthlyMwk: applicantProfile.expectedMonthlyMwk,
        legalAuthorizedSigner: applicantProfile.legalAuthorizedSigner,
      };

      if (activeTab === "resume") {
        const res = await tailorResumeAI({
          job: jobRecord,
          applicant_profile: profileRecord,
          column_layout: columnLayout,
          dehumanize: isDehumanized,
        });
        if (res.tailored_resume) {
          setResumeData(res.tailored_resume as unknown as TailoredResume);
        }
      } else {
        const doc_type = activeTab === "proposal" ? "consultancy-proposal" : "cover-letter";
        const res = await tailorDocumentAI({
          doc_type,
          job: jobRecord,
          applicant_profile: profileRecord,
          column_layout: columnLayout,
          dehumanize: isDehumanized,
        });
        if (res.document) {
          const doc = res.document as unknown as TailoredDocument;
          if (activeTab === "proposal") {
            setProposalData(doc);
          } else {
            setCoverLetterData(doc);
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
      content = `# ${resumeData.fullName}\n**${resumeData.title}**\n${resumeData.contact.location} | ${resumeData.contact.email} | ${resumeData.contact.phone}\n\n## Executive Summary\n${resumeData.summary}\n\n## Core Competencies\n${resumeData.skills.join(", ")}\n\n## Professional Experience\n${resumeData.experience
        .map(
          (e) =>
            `### ${e.role} - ${e.company} (${e.period})\n${e.bullets.map((b) => `- ${b}`).join("\n")}`
        )
        .join("\n\n")}`;
    } else if (activeTab === "cover_letter") {
      content = `${coverLetterData.date}\n\n${coverLetterData.recipient}\n\n${coverLetterData.greeting}\n\n${coverLetterData.paragraphs?.join("\n\n")}\n\n${coverLetterData.closing}\n${coverLetterData.signature}`;
    } else {
      content = `# ${proposalData.title}\n**Client:** ${proposalData.recipient}\n**Date:** ${proposalData.date}\n\n## Executive Summary\n${proposalData.executiveSummary}\n\n${proposalData.sections
        ?.map((s) => `### ${s.heading}\n${s.body}`)
        .join("\n\n")}\n\n${proposalData.closing}\n${proposalData.signature}`;
    }

    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!currentOpp) {
    return (
      <div className="bg-surface-white border border-slate rounded-xl p-12 text-center space-y-4">
        <FileText className="w-12 h-12 text-brand-orange mx-auto" />
        <h3 className="font-heading text-lg font-bold text-ink">No Opportunity Selected</h3>
        <p className="text-body max-w-md mx-auto">
          Select an opportunity from the pipeline or scraper view to generate tailored documents.
        </p>
        <Button variant="accent" onClick={() => navigate("/jobs")}>
          Browse Opportunities
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control Deck */}
      <div className="bg-surface-white border border-slate p-4 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        {/* Target Opportunity Selector */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-ink">
                Pristine Document Studio
              </h3>
              <Badge variant="submitted" size="micro">
                Pristine Typography
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-text-secondary">Tailored for:</span>
              <select
                value={currentOpp.id}
                onChange={(e) => {
                  const opp = opportunities.find((o) => o.id === e.target.value);
                  if (opp) {
                    setCurrentOpp(opp);
                    onSelectOpportunity?.(opp);
                  }
                }}
                data-testid="job-selector"
                className="text-xs font-semibold bg-surface-muted border border-slate rounded-md px-2 py-1 text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange"
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
          {/* Column Layout Switcher */}
          <div className="flex items-center bg-surface-muted p-1 rounded-lg border border-slate text-xs" data-testid="layout-toggle" data-layout={columnLayout}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setColumnLayout("one-column")}
              className={cn(columnLayout === "one-column" && "bg-brand-orange text-white")}
            >
              1 Column
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setColumnLayout("two-column")}
              className={cn(columnLayout === "two-column" && "bg-brand-orange text-white")}
            >
              2 Columns
            </Button>
          </div>

          {/* Dehumanizer Filter Toggle */}
          <Button
            variant={isDehumanized ? "accent" : "ghost"}
            size="sm"
            onClick={() => setIsDehumanized(!isDehumanized)}
            data-testid="dehumanize-toggle"
            title="Purge AI tropes like 'delve', 'spearhead', 'testament'"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Dehumanized ({isDehumanized ? "Active" : "Off"})</span>
          </Button>

          {/* Regenerate */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateDocument}
            disabled={isGenerating || aiStatus === "unavailable"}
            data-testid="regenerate-btn"
            title={aiStatus === "available" ? "Regenerate with Gemini AI" : "AI provider not configured"}
          >
            <RotateCw className={`w-3.5 h-3.5 text-text-secondary ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Generating..." : "Regenerate with AI"}</span>
          </Button>

          {/* Copy Markdown */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyMarkdown}
            data-testid="copy-markdown-btn"
          >
            <Copy className="w-3.5 h-3.5 text-text-secondary" />
            <span>{copied ? "Copied!" : "Copy Markdown"}</span>
          </Button>

          {/* Print / PDF Export */}
          <PrimaryButton
            onClick={handlePrint}
            size="sm"
            data-testid="print-btn"
          >
            <Printer className="w-3.5 h-3.5 text-brand-orange" />
            <span>Print / PDF</span>
          </PrimaryButton>
        </div>
      </div>

      {/* Document Type Tabs */}
      <div className="flex items-center gap-2 border-b border-slate pb-1 no-print text-xs">
        <Button
          variant={activeTab === "resume" ? "accent" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("resume")}
          data-testid="tab-resume"
          className="px-4 py-2"
        >
          <span>Pristine Tailored Resume</span>
          <Badge variant="critical" size="micro">{columnLayout}</Badge>
        </Button>

        <Button
          variant={activeTab === "cover_letter" ? "accent" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("cover_letter")}
          data-testid="tab-cover-letter"
          className="px-4 py-2"
        >
          <span>Tailored Cover Letter</span>
          <Badge variant="job" size="micro">Humanized</Badge>
        </Button>

        {currentOpp.category === "consultancy" && (
          <Button
            variant={activeTab === "proposal" ? "danger" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("proposal")}
            data-testid="tab-proposal"
            className="px-4 py-2"
          >
            <span>Consultancy Proposal & Executive Summary</span>
            <Badge variant="signoff" size="micro">≥90 Auto-Gen</Badge>
          </Button>
        )}
      </div>

      {/* Document Canvas (Pristine Upscale White-Collar Paper) */}
      <div className="bg-surface-white border border-slate rounded-xl p-8 sm:p-12 shadow-sm max-w-4xl mx-auto resume-paper transition-all" data-testid="document-content">
        {/* ================= RESUME VIEW ================= */}
        {activeTab === "resume" && (
          <div className="space-y-6 text-ink">
            {/* Header / Contact Banner */}
            <div className="border-b-2 border-ink pb-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-ink">
                  {resumeData.fullName}
                </h1>
                <div className="text-xs font-mono text-text-secondary space-x-2">
                  <span>{resumeData.contact.location}</span>
                  <span>•</span>
                  <span>{resumeData.contact.phone}</span>
                  <span>•</span>
                  <span>{resumeData.contact.email}</span>
                </div>
              </div>
              <div className="text-sm font-semibold uppercase tracking-widest text-brand-orange mt-1 font-mono">
                {resumeData.title}
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-1.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink font-mono border-b border-slate pb-1">
                Executive Profile
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed text-justify">
                {resumeData.summary}
              </p>
            </div>

            {/* Layout Split: 1-Column vs 2-Column */}
            {columnLayout === "two-column" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column (Skills, Education, Certs) */}
                <div className="space-y-5 md:border-r md:border-slate md:pr-4">
                  {/* Skills */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono border-b border-slate pb-1">
                      Core Competencies
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {resumeData.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-surface-muted text-ink px-2 py-0.5 rounded border border-slate font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono border-b border-slate pb-1">
                      Certifications
                    </h3>
                    <div className="space-y-1 text-xs text-text-secondary">
                      {resumeData.certifications.map((cert, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="text-brand-orange font-bold">•</span>
                          <span>{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono border-b border-slate pb-1">
                      Education
                    </h3>
                    <div className="space-y-2 text-xs">
                      {resumeData.education.map((edu, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="font-semibold text-ink">{edu.degree}</div>
                          <div className="text-text-secondary text-[11px]">{edu.institution} ({edu.year})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column (Experience & Impact) */}
                <div className="md:col-span-2 space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono border-b border-slate pb-1">
                    Selected Professional Engagements & Consultancies
                  </h3>
                  <div className="space-y-4">
                    {resumeData.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs">
                          <span className="font-bold text-ink text-sm">{exp.role}</span>
                          <span className="text-text-secondary font-mono text-[11px]">{exp.period}</span>
                        </div>
                        <div className="text-xs text-text-secondary font-medium italic">
                          {exp.company} — {exp.location}
                        </div>
                        <ul className="space-y-1 text-xs text-text-secondary list-disc list-outside pl-4">
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono border-b border-slate pb-1">
                    Professional Experience
                  </h3>
                  <div className="space-y-4">
                    {resumeData.experience.map((exp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="font-bold text-ink text-sm">{exp.role} — {exp.company}</span>
                          <span className="text-text-secondary font-mono">{exp.period} | {exp.location}</span>
                        </div>
                        <ul className="space-y-1 text-xs text-text-secondary list-disc list-outside pl-4 pt-1">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
                      Technical & Operational Competencies
                    </h3>
                    <div className="flex flex-wrap gap-1 text-xs">
                      {resumeData.skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-surface-muted rounded text-[11px] font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
                      Education & Credentials
                    </h3>
                    <div className="space-y-1 text-xs text-text-secondary">
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
          <div className="space-y-6 text-ink font-body">
            {/* Executive Letterhead */}
            <div className="border-b border-slate pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold font-heading text-ink">
                  {applicantProfile?.fullName || "Chifuniro Phiri"}
                </h1>
                <p className="text-xs text-text-secondary font-mono mt-0.5">{applicantProfile?.headline || "Senior Technology & Operations Specialist"}</p>
              </div>
              <div className="text-right text-xs font-mono text-text-secondary">
                <div>{applicantProfile?.location || "Area 10, Lilongwe, Malawi"}</div>
                <div>{applicantProfile?.email || "chifuniro.phiri@consult-mw.com"}</div>
                <div>{applicantProfile?.phone || "+265 99 412 8890"}</div>
              </div>
            </div>

            {/* Date & Recipient */}
            <div className="text-xs text-text-secondary space-y-1 font-mono">
              <div className="font-semibold">{coverLetterData.date}</div>
              <div className="text-ink font-bold">{coverLetterData.recipient}</div>
            </div>

            {/* Subject */}
            <div className="text-xs font-bold uppercase tracking-wider text-ink font-mono bg-surface-muted p-2 rounded border border-slate">
              RE: {coverLetterData.title}
            </div>

            {/* Greeting */}
            <div className="text-xs font-semibold text-ink">{coverLetterData.greeting}</div>

            {/* Letter Body Paragraphs */}
            <div className="space-y-4 text-xs text-text-secondary leading-relaxed text-justify">
              {coverLetterData.paragraphs?.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Sign-off */}
            <div className="pt-4 space-y-3 text-xs">
              <div>{coverLetterData.closing}</div>
              <div className="font-brand font-bold text-base text-ink">
                {coverLetterData.signature}
              </div>
              <div className="text-[11px] text-text-secondary font-mono">
                Principal Consultant & Senior Technical Lead
              </div>
            </div>
          </div>
        )}

        {/* ================= CONSULTANCY PROPOSAL VIEW ================= */}
        {activeTab === "proposal" && (
          <div className="space-y-6 text-ink">
            {/* Proposal Header */}
            <div className="border-b-2 border-signoff-red pb-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-signoff-red font-bold">
                CONFIDENTIAL ADVISORY PROPOSAL
              </div>
              <h1 className="text-2xl font-bold font-heading text-ink mt-1">
                {proposalData.title}
              </h1>
              <div className="flex justify-between items-center text-xs text-text-secondary mt-2 font-mono">
                <span>Client: {proposalData.recipient}</span>
                <span>Date: {proposalData.date}</span>
              </div>
            </div>

            {/* Executive Summary Box */}
            <div className="bg-red-50 border-l-4 border-signoff-red border border-red-200 p-4 rounded-r-lg space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-900 font-mono">
                Executive Summary (ATS ≥ 90 Automated Synthesis)
              </h3>
              <p className="text-xs text-red-950 leading-relaxed text-justify">
                {proposalData.executiveSummary}
              </p>
            </div>

            {/* Proposal Sections */}
            <div className="space-y-5">
              {proposalData.sections?.map((sec, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono border-b border-slate pb-1">
                    {sec.heading}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line text-justify">
                    {sec.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Sign-off */}
            <div className="pt-4 border-t border-slate flex justify-between items-end text-xs">
              <div className="space-y-1">
                <div className="text-text-secondary">{proposalData.closing}</div>
                <div className="font-bold text-ink font-heading text-sm">
                  {proposalData.signature}
                </div>
                <div className="text-[10px] text-text-secondary font-mono">
                  Verified Signatory • Lilongwe, Malawi
                </div>
              </div>

              <Button
                variant="danger"
                size="sm"
                onClick={() => onOpenSignOff?.(currentOpp)}
                className="no-print"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Sign-Off & Authorize Submission</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentStudio;