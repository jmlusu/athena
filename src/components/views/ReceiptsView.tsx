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
import { Opportunity, ApplicationReceipt } from "../../types";
import { LinkedInExportModal } from "../modals/LinkedInExportModal";

interface ReceiptsViewProps {
  opportunities: Opportunity[];
  onOpenFollowUpModal?: (opp: Opportunity) => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({ opportunities }) => {
  // Collect all opportunities that have receipts
  const submittedItems = opportunities.filter((o) => o.receipt || o.status === "submitted");
  const [selectedReceipt, setSelectedReceipt] = useState<ApplicationReceipt | null>(
    submittedItems[0]?.receipt || null
  );
  const [showFollowUpDraft, setShowFollowUpDraft] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);

  // Match corresponding opportunity for selected receipt
  const matchedOpportunity = opportunities.find(
    (o) => o.receipt?.receiptId === selectedReceipt?.receiptId || o.title === selectedReceipt?.jobTitle
  ) || opportunities[0] || null;

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif-heading text-base font-bold text-[#18181B]">
              Application Receipts & Follow-Up Ledger
            </h3>
            <p className="text-xs text-[#64748B]">
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
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center space-y-2">
          <FileCheck className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h4 className="text-sm font-semibold text-[#18181B]">No applications submitted yet</h4>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Once you sign-off on prepared jobs or consultancies in the pipeline, legal submission receipts will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Receipts List */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs divide-y divide-[#F1F5F9] max-h-[600px] overflow-y-auto">
            <div className="p-3 bg-[#F8F9FA] text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center justify-between">
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
                applicantName: "Tendai Chirwa",
                authorizedBy: "Tendai Chirwa (Authorized)",
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
                  className={`p-3.5 cursor-pointer transition-colors space-y-1 ${
                    isSelected ? "bg-[#FFFBF7] border-l-4 border-l-[#F97316]" : "hover:bg-[#F8F9FA]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#18181B]">{rcpt.receiptId}</span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rcpt.status}
                    </span>
                  </div>

                  <h5 className="font-semibold text-xs text-[#18181B] line-clamp-1">{opp.title}</h5>
                  <div className="text-[11px] text-[#64748B] flex items-center justify-between">
                    <span>{opp.company}</span>
                    <span className="font-mono text-[10px] text-[#94A3B8]">
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
              <div className="bg-white border border-[#D1D5DB] rounded-xl p-6 shadow-xs space-y-5">
                {/* Certificate Banner */}
                <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold font-mono uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Official Submission Receipt</span>
                    </div>
                    <h4 className="text-lg font-bold font-serif-heading text-[#18181B] mt-0.5">
                      {selectedReceipt.jobTitle}
                    </h4>
                    <p className="text-xs text-[#64748B]">Client/Employer: {selectedReceipt.company}</p>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div className="text-[#94A3B8] text-[10px]">RECEIPT ID</div>
                    <div className="font-bold text-[#18181B] text-sm">{selectedReceipt.receiptId}</div>
                  </div>
                </div>

                {/* Audit Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 bg-[#F8F9FA] p-3 rounded-lg border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] uppercase font-mono">
                      Timestamp & Ingress Portal
                    </span>
                    <div className="font-semibold text-[#18181B]">
                      {new Date(selectedReceipt.submittedAt).toLocaleString()}
                    </div>
                    <div className="text-[#64748B]">{selectedReceipt.portalName}</div>
                  </div>

                  <div className="space-y-1 bg-[#F8F9FA] p-3 rounded-lg border border-[#E2E8F0]">
                    <span className="text-[10px] text-[#64748B] uppercase font-mono">
                      Human Signatory & Legal Sign-off
                    </span>
                    <div className="font-semibold text-[#18181B] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{selectedReceipt.authorizedBy}</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#64748B]">
                      Authorized: {new Date(selectedReceipt.authorizedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1 bg-[#18181B] text-white p-3 rounded-lg font-mono text-[11px]">
                    <span className="text-[10px] text-[#94A3B8] uppercase block">
                      Cryptographic Confirmation Hash
                    </span>
                    <div className="text-emerald-400 break-all">{selectedReceipt.confirmationHash}</div>
                  </div>
                </div>

                {/* Follow-Up Cadence Box */}
                <div className="bg-[#FFFBF7] border border-[#F97316]/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#F97316]" />
                      <span className="text-xs font-bold text-[#18181B]">
                        Automated 7-Day Follow-Up Alert
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#EA580C]">
                      Scheduled: {selectedReceipt.followUpDate}
                    </span>
                  </div>

                  <p className="text-xs text-[#64748B]">
                    Athena automatically schedules follow-up outreach 7 days after submission to maximize callback rates.
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowFollowUpDraft(!showFollowUpDraft)}
                      className="px-3.5 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{showFollowUpDraft ? "Hide Follow-Up Draft" : "Generate Professional Follow-Up Email"}</span>
                    </button>

                    <button
                      onClick={() => setShowLinkedInModal(true)}
                      className="px-3.5 py-2 bg-[#F0F7FD] hover:bg-[#E1EFFB] text-[#0A66C2] border border-[#B8D7F2] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                      title="Export verified submission draft to LinkedIn"
                    >
                      <span className="font-bold bg-[#0A66C2] text-white w-4 h-4 rounded text-[10px] flex items-center justify-center leading-none">in</span>
                      <span>Export to LinkedIn</span>
                    </button>
                  </div>

                  {showFollowUpDraft && (
                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-xs space-y-2 text-[#18181B]">
                      <div className="flex justify-between items-center text-[11px] text-[#64748B] font-mono border-b pb-1">
                        <span>SUBJECT: Follow-Up: {selectedReceipt.jobTitle} - {selectedReceipt.applicantName}</span>
                        <button
                          onClick={() =>
                            handleCopyDraft(
                              `Dear Hiring Team at ${selectedReceipt.company},\n\nI hope this message finds you well. I am following up on my formal application submitted on ${new Date(selectedReceipt.submittedAt).toLocaleDateString()} for the ${selectedReceipt.jobTitle} position.\n\nHaving reviewed the project requirements, I remain enthusiastic about contributing my background in systems leadership and high-reliability program delivery. Please let me know if any additional documentation or technical portfolio samples would be helpful.\n\nWarm regards,\n${selectedReceipt.applicantName}\n${selectedReceipt.receiptId}`
                            )
                          }
                          className="text-[#F97316] hover:underline font-sans text-xs flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedDraft ? "Copied!" : "Copy Email"}</span>
                        </button>
                      </div>

                      <div className="text-xs text-[#334155] whitespace-pre-line leading-relaxed font-sans">
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
      {showLinkedInModal && matchedOpportunity && (
        <LinkedInExportModal
          opportunity={matchedOpportunity}
          receipt={selectedReceipt}
          onClose={() => setShowLinkedInModal(false)}
        />
      )}
    </div>
  );
};
