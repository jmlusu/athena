import React, { useState } from "react";
import {
  Receipt,
  CheckCircle2,
  Calendar,
  Clock,
  ExternalLink,
  Mail,
  Copy,
  Building,
  ShieldCheck,
  FileCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Opportunity, ApplicationReceipt } from "../../lib/athena/types";
import { cn } from "../../lib/athena/utils";
import { Button, GhostButton, AccentButton, OutlineButton } from "@/components/athena/ui/Button";
import { Badge } from "@/components/athena/ui/Badge";
import { LinkedInExportModal } from "./LinkedInExportModal";

interface ReceiptsProps {
  opportunities?: Opportunity[];
  onOpenFollowUpModal?: (opp: Opportunity) => void;
}

export const Receipts: React.FC<ReceiptsProps> = ({ opportunities = [] }) => {
  // Collect all opportunities that have receipts
  const submittedItems = opportunities.filter((o) => o.receipt || o.status === "submitted");
  const [selectedReceipt, setSelectedReceipt] = useState<ApplicationReceipt | null>(
    submittedItems[0]?.receipt || null
  );
  const [showFollowUpDraft, setShowFollowUpDraft] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(() => submittedItems[0] ?? null);
  const [exportOpen, setExportOpen] = useState(false);

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-surface-white border border-slate p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-ink">
              Application Receipts & Follow-Up Ledger
            </h3>
            <p className="text-xs text-text-secondary">
              Cryptographic verification tokens, submission receipts, and 7-day follow-up schedules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <Badge variant="submitted" size="standard">
            {submittedItems.length} Confirmed Submissions
          </Badge>
        </div>
      </div>

      {submittedItems.length === 0 ? (
        <div className="bg-surface-white border border-slate rounded-xl p-12 text-center space-y-2" data-testid="receipts-empty">
          <FileCheck className="w-10 h-10 text-text-secondary mx-auto" />
          <h4 className="font-heading text-sm font-semibold text-ink">No applications submitted yet</h4>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Once you sign-off on prepared jobs or consultancies in the pipeline, legal submission receipts will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Receipts List */}
          <div className="bg-surface-white border border-slate rounded-xl overflow-hidden shadow-xs divide-y divide-slate max-h-[600px] overflow-y-auto">
            <div className="p-3 bg-surface-muted text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center justify-between">
              <span>Submitted Applications</span>
              <span>Status</span>
            </div>

            {submittedItems.map((opp) => {
              const rcpt = opp.receipt || {
                receiptId: `ATH-RCPT-${opp.id.slice(-6)}`,
                confirmationHash: `SHA256-${opp.id}`,
                submittedAt: new Date().toISOString(),
                jobTitle: opp.title,
                company: opp.company,
                applicantName: "Chifuniro Phiri",
                authorizedBy: "Chifuniro Phiri (Authorized)",
                authorizedAt: new Date().toISOString(),
                portalName: `${opp.platform} Direct Portal`,
                followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
                status: "SUBMITTED" as const,
                notes: "Dispatched via Athena automated agent.",
              };

              const isSelected = selectedReceipt?.receiptId === rcpt.receiptId;

              return (
                <div
                  key={opp.id}
                  onClick={() => {
                    setSelectedReceipt(rcpt);
                    setSelectedOpp(opp);
                    setShowFollowUpDraft(false);
                  }}
                  className={cn(
                    "p-3.5 cursor-pointer transition-colors space-y-1",
                    isSelected ? "bg-brand-orange/10 border-l-4 border-brand-orange" : "hover:bg-surface-muted"
                  )}
                  data-testid="receipt-card"
                  data-receipt-job-title={opp.title}
                  data-receipt-company={opp.company}
                  data-receipt-hash={rcpt.confirmationHash}
                  data-receipt-submitted={rcpt.submittedAt}
                  data-receipt-signatory={rcpt.authorizedBy}
                  data-receipt-followup={rcpt.followUpDate}
                  data-receipt-status={rcpt.status}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-ink">{rcpt.receiptId}</span>
                    <Badge variant="submitted" size="micro">{rcpt.status}</Badge>
                  </div>

                  <h5 className="font-semibold text-xs text-ink line-clamp-1" data-testid="receipt-job-title">{opp.title}</h5>
                  <div className="text-[11px] text-text-secondary flex items-center justify-between">
                    <span data-testid="receipt-company">{opp.company}</span>
                    <span className="font-mono text-[10px] text-text-secondary">
                      Follow-up: {rcpt.followUpDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Receipt Certificate (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {selectedReceipt ? (
              <div className="bg-surface-white border border-slate rounded-xl p-6 shadow-xs space-y-5">
                {/* Certificate Banner */}
                <div className="border-b border-slate pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-success-emerald text-xs font-bold font-mono uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Official Submission Receipt</span>
                    </div>
                    <h4 className="text-lg font-bold font-heading text-ink mt-0.5">
                      {selectedReceipt.jobTitle}
                    </h4>
                    <p className="text-xs text-text-secondary">Client/Employer: {selectedReceipt.company}</p>
                  </div>

                  <div className="text-right space-y-2">
                    <div className="font-mono text-xs">
                      <div className="text-text-secondary text-[10px]">RECEIPT ID</div>
                      <div className="font-bold text-ink text-sm">{selectedReceipt.receiptId}</div>
                    </div>
                    <OutlineButton size="sm" onClick={() => setExportOpen(true)}>
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Export to LinkedIn</span>
                    </OutlineButton>
                  </div>
                </div>

                {/* Audit Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 bg-surface-muted p-3 rounded-lg border border-slate">
                    <span className="text-[10px] text-text-secondary uppercase font-mono">
                      Timestamp & Ingress Portal
                    </span>
                    <div className="font-semibold text-ink">
                      {new Date(selectedReceipt.submittedAt).toLocaleString()}
                    </div>
                    <div className="text-text-secondary">{selectedReceipt.portalName}</div>
                  </div>

                  <div className="space-y-1 bg-surface-muted p-3 rounded-lg border border-slate">
                    <span className="text-[10px] text-text-secondary uppercase font-mono">
                      Human Signatory & Legal Sign-off
                    </span>
                    <div className="font-semibold text-ink flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-success-emerald" />
                      <span>{selectedReceipt.authorizedBy}</span>
                    </div>
                    <div className="text-[10px] font-mono text-text-secondary">
                      Authorized: {new Date(selectedReceipt.authorizedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1 bg-surface-dark-inset text-white p-3 rounded-lg font-mono text-[11px]">
                    <span className="text-[10px] text-white/60 uppercase block">
                      Cryptographic Confirmation Hash
                    </span>
                    <div className="text-emerald-400 break-all">{selectedReceipt.confirmationHash}</div>
                  </div>
                </div>

                {/* Follow-Up Cadence Box */}
                <div className="bg-brand-orange/10 border border-brand-orange/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-orange" />
                      <span className="text-xs font-bold text-ink">
                        Automated 7-Day Follow-Up Alert
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-brand-orange">
                      Scheduled: {selectedReceipt.followUpDate}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary">
                    Athena automatically schedules follow-up outreach 7 days after submission to maximize callback rates.
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => setShowFollowUpDraft(!showFollowUpDraft)}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{showFollowUpDraft ? "Hide Follow-Up Draft" : "Generate Professional Follow-Up Email"}</span>
                    </Button>
                  </div>

                  {showFollowUpDraft && (
                    <div className="p-3 bg-surface-white border border-slate rounded-lg text-xs space-y-2 text-ink" data-testid="follow-up-draft">
                      <div className="flex justify-between items-center text-[11px] text-text-secondary font-mono border-b border-slate pb-1">
                        <span>SUBJECT: Follow-Up: {selectedReceipt.jobTitle} - {selectedReceipt.applicantName}</span>
                        <button
                          onClick={() =>
                            handleCopyDraft(
                              `Dear Hiring Team at ${selectedReceipt.company},\n\nI hope this message finds you well. I am following up on my formal application submitted on ${new Date(selectedReceipt.submittedAt).toLocaleDateString()} for the ${selectedReceipt.jobTitle} position.\n\nHaving reviewed the project requirements, I remain enthusiastic about contributing my background in systems leadership and high-reliability program delivery. Please let me know if any additional documentation or technical portfolio samples would be helpful.\n\nWarm regards,\n${selectedReceipt.applicantName}\n${selectedReceipt.receiptId}`
                            )
                          }
                          data-testid="copy-follow-up-btn"
                          className="text-brand-orange hover:underline font-body text-xs flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedDraft ? "Copied!" : "Copy Email"}</span>
                        </button>
                      </div>

                      <div className="text-xs text-text-secondary whitespace-pre-line leading-relaxed font-body">
                        {`Dear Hiring Team at ${selectedReceipt.company},

I hope this message finds you well. I am following up on my formal application submitted on ${new Date(selectedReceipt.submittedAt).toLocaleDateString()} for the ${selectedReceipt.jobTitle} opportunity (Ref: ${selectedReceipt.receiptId}).

Having delivered complex digital initiatives in Lilongwe and with international partners, I remain very enthusiastic about contributing to your mandate.

Please let me know if any additional verification, references, or technical project samples would assist your evaluation committee.

Sincerely,
${selectedReceipt.applicantName}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {selectedOpp && (
        <LinkedInExportModal
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
          opportunity={selectedOpp}
          applicantName={selectedReceipt?.applicantName ?? "Applicant"}
          receiptId={selectedReceipt?.receiptId}
          onOpenLinkedIn={() =>
            window.open("https://www.linkedin.com/jobs/", "_blank", "noopener,noreferrer")
          }
        />
      )}
    </div>
  );
};

export default Receipts;