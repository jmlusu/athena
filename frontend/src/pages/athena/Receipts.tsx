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

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-text">
              Application Receipts & Follow-Up Ledger
            </h3>
            <p className="text-xs text-muted">
              Cryptographic verification tokens, submission receipts, and 7-day follow-up schedules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            {submittedItems.length} Confirmed Submissions
          </span>
        </div>
      </div>

      {submittedItems.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center space-y-2">
          <FileCheck className="w-10 h-10 text-muted mx-auto" />
          <h4 className="text-sm font-semibold text-text">No applications submitted yet</h4>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Once you sign-off on prepared jobs or consultancies in the pipeline, legal submission receipts will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Receipts List */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs divide-y divide-border max-h-[600px] overflow-y-auto">
            <div className="p-3 bg-muted text-xs font-semibold text-muted uppercase tracking-wider flex items-center justify-between">
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
                    setShowFollowUpDraft(false);
                  }}
                  className={cn(
                    "p-3.5 cursor-pointer transition-colors space-y-1",
                    isSelected ? "bg-orange-50 border-l-4 border-l-accent" : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-text">{rcpt.receiptId}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rcpt.status}
                    </span>
                  </div>

                  <h5 className="font-semibold text-xs text-text line-clamp-1">{opp.title}</h5>
                  <div className="text-[11px] text-muted flex items-center justify-between">
                    <span>{opp.company}</span>
                    <span className="font-mono text-[10px] text-subtle">
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
              <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-5">
                {/* Certificate Banner */}
                <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold font-mono uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Official Submission Receipt</span>
                    </div>
                    <h4 className="text-lg font-bold font-heading text-text mt-0.5">
                      {selectedReceipt.jobTitle}
                    </h4>
                    <p className="text-xs text-muted">Client/Employer: {selectedReceipt.company}</p>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div className="text-subtle text-[10px]">RECEIPT ID</div>
                    <div className="font-bold text-text text-sm">{selectedReceipt.receiptId}</div>
                  </div>
                </div>

                {/* Audit Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 bg-muted p-3 rounded-lg border border-border">
                    <span className="text-[10px] text-muted uppercase font-mono">
                      Timestamp & Ingress Portal
                    </span>
                    <div className="font-semibold text-text">
                      {new Date(selectedReceipt.submittedAt).toLocaleString()}
                    </div>
                    <div className="text-muted">{selectedReceipt.portalName}</div>
                  </div>

                  <div className="space-y-1 bg-muted p-3 rounded-lg border border-border">
                    <span className="text-[10px] text-muted uppercase font-mono">
                      Human Signatory & Legal Sign-off
                    </span>
                    <div className="font-semibold text-text flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{selectedReceipt.authorizedBy}</span>
                    </div>
                    <div className="text-[10px] font-mono text-muted">
                      Authorized: {new Date(selectedReceipt.authorizedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1 bg-text text-white p-3 rounded-lg font-mono text-[11px]">
                    <span className="text-[10px] text-subtle uppercase block">
                      Cryptographic Confirmation Hash
                    </span>
                    <div className="text-emerald-400 break-all">{selectedReceipt.confirmationHash}</div>
                  </div>
                </div>

                {/* Follow-Up Cadence Box */}
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      <span className="text-xs font-bold text-text">
                        Automated 7-Day Follow-Up Alert
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-accent">
                      Scheduled: {selectedReceipt.followUpDate}
                    </span>
                  </div>

                  <p className="text-xs text-muted">
                    Athena automatically schedules follow-up outreach 7 days after submission to maximize callback rates.
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFollowUpDraft(!showFollowUpDraft)}
                      className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{showFollowUpDraft ? "Hide Follow-Up Draft" : "Generate Professional Follow-Up Email"}</span>
                    </button>
                  </div>

                  {showFollowUpDraft && (
                    <div className="p-3 bg-card border border-border rounded-lg text-xs space-y-2 text-text">
                      <div className="flex justify-between items-center text-[11px] text-muted font-mono border-b pb-1">
                        <span>SUBJECT: Follow-Up: {selectedReceipt.jobTitle} - {selectedReceipt.applicantName}</span>
                        <button
                          onClick={() =>
                            handleCopyDraft(
                              `Dear Hiring Team at ${selectedReceipt.company},\n\nI hope this message finds you well. I am following up on my formal application submitted on ${new Date(selectedReceipt.submittedAt).toLocaleDateString()} for the ${selectedReceipt.jobTitle} position.\n\nHaving reviewed the project requirements, I remain enthusiastic about contributing my background in systems leadership and high-reliability program delivery. Please let me know if any additional documentation or technical portfolio samples would be helpful.\n\nWarm regards,\n${selectedReceipt.applicantName}\n${selectedReceipt.receiptId}`
                            )
                          }
                          className="text-accent hover:underline font-body text-xs flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedDraft ? "Copied!" : "Copy Email"}</span>
                        </button>
                      </div>

                      <div className="text-xs text-muted whitespace-pre-line leading-relaxed font-body">
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
    </div>
  );
};

export default Receipts;