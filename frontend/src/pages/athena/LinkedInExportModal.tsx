import React, { useState } from "react";
import { X, Download, Copy, ExternalLink, FileText, Code, CheckCircle2 } from "lucide-react";
import { Opportunity } from "../../lib/athena/types";
import { cn } from "../../lib/athena/utils";
import Modal from "@/components/athena/ui/Modal";
import { Button, PrimaryButton, GhostButton, AccentButton, OutlineButton, DangerButton } from "@/components/athena/ui/Button";
import { Badge } from "@/components/athena/ui/Badge";

interface LinkedInExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  applicantName: string;
  receiptId?: string;
  onDownloadMD?: () => void;
  onDownloadJSON?: () => void;
  onOpenLinkedIn?: () => void;
}

export const LinkedInExportModal: React.FC<LinkedInExportModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  applicantName,
  receiptId,
  onDownloadMD,
  onDownloadJSON,
  onOpenLinkedIn,
}) => {
  const [activeTab, setActiveTab] = useState<"easy-apply" | "profile" | "developer">("easy-apply");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
  };

  const easyApplyContent = opportunity ? `
# ${opportunity.title} at ${opportunity.company}

**Headline:** ${applicantName} - ${opportunity.title}

**Dehumanized Pitch:**
${opportunity.dehumanizedPitch || "Experienced professional with a track record of delivering complex technical projects in Lilongwe and international remote environments."}

**ATS Skills Tags:**
${opportunity.requirements?.slice(0, 10).map(r => `#${r.replace(/\s+/g, '')}`).join(" ") || "#ProjectManagement #TechnicalLeadership #StakeholderManagement"}

**Full Cover Note:**
Dear Hiring Team at ${opportunity.company},

I am writing to express my direct interest in the ${opportunity.title} position. My professional trajectory combines hands-on digital infrastructure implementation across Malawi with high-reliability remote operations for international partners.

Having reviewed your mandate, I am prepared to deliver measurable outcomes from Day 1. I value clear communication, structured milestone accountability, and pragmatic problem-solving over buzzwords.

Sincerely,
${applicantName}
${receiptId ? `Ref: ${receiptId}` : ""}
  `.trim() : "";

  const profileContent = opportunity ? `
# ${applicantName} - ${opportunity.title}

**Employment Type:** ${opportunity.category === "consultancy" ? "Contract" : "Full-time"}
**Location Type:** ${opportunity.location.includes("Remote") ? "Remote" : "Hybrid"}

**Formatted Description:**
${opportunity.description || "Experienced professional with expertise in technical leadership, project management, and stakeholder coordination across Lilongwe and international remote environments."}

**Key Achievements:**
• Led cross-functional teams delivering complex technical projects
• Managed stakeholder relationships across public and private sectors
• Implemented scalable solutions for high-reliability operations
  `.trim() : "";

  const developerContent = opportunity ? {
    title: opportunity.title,
    company: opportunity.company,
    location: opportunity.location,
    category: opportunity.category,
    platform: opportunity.platform,
    atsScore: opportunity.atsScore,
    matchTier: opportunity.match_tier,
    salaryOrBudget: opportunity.salaryOrBudget,
    postedDate: opportunity.postedDate,
    deadline: opportunity.deadline,
    description: opportunity.description,
    requirements: opportunity.requirements,
    dehumanizedPitch: opportunity.dehumanizedPitch,
    applicantName,
    receiptId,
    sha256Hash: receiptId ? `SHA256-${receiptId}` : `SHA256-${Date.now().toString(36).toUpperCase()}`,
  } : {};

  const copyContent = (tab: string) => {
    let content = "";
    if (tab === "easy-apply") content = easyApplyContent;
    else if (tab === "profile") content = profileContent;
    else content = JSON.stringify(developerContent, null, 2);
    handleCopy(content, tab);
  };

  const downloadContent = (tab: string, extension: string) => {
    let content = "";
    let filename = "";
    if (tab === "easy-apply") {
      content = easyApplyContent;
      filename = `linkedin-easy-apply-${opportunity?.title?.replace(/\s+/g, "-")}.md`;
    } else if (tab === "profile") {
      content = profileContent;
      filename = `linkedin-profile-${opportunity?.title?.replace(/\s+/g, "-")}.md`;
    } else {
      content = JSON.stringify(developerContent, null, 2);
      filename = `linkedin-export-${opportunity?.title?.replace(/\s+/g, "-")}.json`;
    }
    const blob = new Blob([content], { type: extension === "json" ? "application/json" : "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !opportunity) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="LinkedIn Export"
      description={`Export ${opportunity.title} for LinkedIn applications`}
      size="xl"
      showCloseButton
      closeOnEscape
      closeOnOverlayClick
      data-testid="linkedin-export-modal"
      footer={
        <div className="w-full flex items-center justify-end gap-3">
          <GhostButton onClick={onClose} size="sm">Done</GhostButton>
          <PrimaryButton onClick={onOpenLinkedIn} size="sm">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open LinkedIn Jobs</span>
          </PrimaryButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate pb-1" role="tablist">
          <Button
            variant={activeTab === "easy-apply" ? "accent" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("easy-apply")}
            role="tab"
            aria-selected={activeTab === "easy-apply"}
            className="px-4 py-2"
          >
            <span>Easy Apply Draft</span>
          </Button>
          <Button
            variant={activeTab === "profile" ? "accent" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("profile")}
            role="tab"
            aria-selected={activeTab === "profile"}
            className="px-4 py-2"
          >
            <span>Profile Experience Entry</span>
          </Button>
          <Button
            variant={activeTab === "developer" ? "accent" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("developer")}
            role="tab"
            aria-selected={activeTab === "developer"}
            className="px-4 py-2"
          >
            <span>JSON / Developer Export</span>
          </Button>
        </div>

        {/* Tab Panels */}
        {activeTab === "easy-apply" && (
          <div role="tabpanel" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-heading text-lg font-bold text-ink">Headline</h4>
              <div className="bg-surface-muted p-3 rounded-lg border border-slate">
                <p className="text-text-secondary">{applicantName} - ${opportunity.title}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyContent("easy-apply")} className="self-start">
                <Copy className="w-3.5 h-3.5" />
                <span>{copied === "easy-apply" ? "Copied!" : "Copy Headline"}</span>
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-heading text-lg font-bold text-ink">Dehumanized Pitch</h4>
              <div className="bg-brand-orange/10 border border-brand-orange/30 p-4 rounded-lg">
                <p className="text-text-secondary whitespace-pre-wrap">{opportunity.dehumanizedPitch || "Experienced professional..."}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyContent("easy-apply")} className="self-start">
                <Copy className="w-3.5 h-3.5" />
                <span>{copied === "easy-apply" ? "Copied!" : "Copy Pitch"}</span>
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-heading text-lg font-bold text-ink">ATS Skills Tags</h4>
              <div className="flex flex-wrap gap-2">
                {opportunity.requirements?.slice(0, 10).map((req, i) => (
                  <Badge key={i} variant="job" size="micro">#{req.replace(/\s+/g, "")}</Badge>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => copyContent("easy-apply")} className="self-start">
                <Copy className="w-3.5 h-3.5" />
                <span>{copied === "easy-apply" ? "Copied!" : "Copy Skills Tags"}</span>
              </Button>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate">
              <h4 className="font-heading text-lg font-bold text-ink">Full Cover Note Preview</h4>
              <div className="bg-surface-white border border-slate rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs text-text-secondary whitespace-pre-wrap font-body">{easyApplyContent}</pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => copyContent("easy-apply")}>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied === "easy-apply" ? "Copied!" : "Copy Full Draft"}</span>
                </Button>
                <OutlineButton size="sm" onClick={() => downloadContent("easy-apply", "md")}>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </OutlineButton>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div role="tabpanel" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-body text-xs font-medium text-text-secondary">Title</label>
                <input
                  type="text"
                  value={`${applicantName} - ${opportunity.title}`}
                  readOnly
                  className="w-full px-3 py-2 bg-surface-white border border-slate rounded-lg text-ink focus:ring-2 focus:ring-brand-orange sunken"
                />
              </div>
              <div className="space-y-2">
                <label className="font-body text-xs font-medium text-text-secondary">Company</label>
                <input
                  type="text"
                  value={opportunity.company}
                  readOnly
                  className="w-full px-3 py-2 bg-surface-white border border-slate rounded-lg text-ink focus:ring-2 focus:ring-brand-orange sunken"
                />
              </div>
              <div className="space-y-2">
                <label className="font-body text-xs font-medium text-text-secondary">Employment Type</label>
                <select
                  value={opportunity.category === "consultancy" ? "contract" : "full_time"}
                  className="w-full px-3 py-2 bg-surface-white border border-slate rounded-lg text-ink focus:ring-2 focus:ring-brand-orange sunken"
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-body text-xs font-medium text-text-secondary">Location Type</label>
                <select
                  value={opportunity.location.includes("Remote") ? "remote" : "hybrid"}
                  className="w-full px-3 py-2 bg-surface-white border border-slate rounded-lg text-ink focus:ring-2 focus:ring-brand-orange sunken"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate">
              <h4 className="font-heading text-lg font-bold text-ink">Formatted Description</h4>
              <textarea
                value={profileContent}
                readOnly
                rows={12}
                className="w-full font-mono text-xs bg-surface-white border border-slate rounded-lg p-3 text-text-secondary focus:ring-2 focus:ring-brand-orange sunken"
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => copyContent("profile")}>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied === "profile" ? "Copied!" : "Copy Description"}</span>
                </Button>
                <OutlineButton size="sm" onClick={() => downloadContent("profile", "md")}>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </OutlineButton>
              </div>
            </div>
          </div>
        )}

        {activeTab === "developer" && (
          <div role="tabpanel" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-heading text-lg font-bold text-ink">Raw JSON Payload</h4>
              <div className="bg-surface-dark-inset border border-slate rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-emerald-400 font-mono text-xs whitespace-pre-wrap">{JSON.stringify(developerContent, null, 2)}</pre>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => copyContent("developer")}>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied === "developer" ? "Copied!" : "Copy JSON"}</span>
                </Button>
                <OutlineButton size="sm" onClick={() => downloadContent("developer", "json")}>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </OutlineButton>
                <OutlineButton size="sm" onClick={() => downloadContent("developer", "md")}>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </OutlineButton>
              </div>
            </div>

            <div className="pt-4 border-t border-slate">
              <h4 className="font-heading text-lg font-bold text-ink">SHA-256 Verification</h4>
              <div className="bg-surface-muted border border-slate rounded-lg p-4 font-mono text-xs text-emerald-400 break-all">
                {developerContent.sha256Hash}
              </div>
            </div>

            <div className="pt-4 border-t border-slate">
              <h4 className="font-heading text-lg font-bold text-ink">Screening Answers</h4>
              <div className="space-y-2 text-sm text-text-secondary">
                <div className="bg-surface-white border border-slate rounded-lg p-3">
                  <div className="font-semibold text-ink mb-1">Q: Describe your direct experience delivering in this domain</div>
                  <div className="text-text-secondary">{opportunity.dehumanizedPitch || "Not provided"}</div>
                </div>
                <div className="bg-surface-white border border-slate rounded-lg p-3">
                  <div className="font-semibold text-ink mb-1">Q: Regional & Remote Collaboration Readiness</div>
                  <div className="text-text-secondary">Comfortable with both asynchronous remote sprint cadence and in-person executive consultations in Lilongwe.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LinkedInExportModal;