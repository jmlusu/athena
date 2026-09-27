import React, { useState } from "react";
import {
  X,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  ExternalLink,
  FileText,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Share2,
} from "lucide-react";
import { Opportunity } from "../../types";
import { CircularGauge } from "../charts/CircularGauge";
import { LinkedInExportModal } from "./LinkedInExportModal";

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  onClose: () => void;
  onOpenDocumentStudio: (opp: Opportunity) => void;
  onOpenSignOff: (opp: Opportunity) => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  opportunity,
  onClose,
  onOpenDocumentStudio,
  onOpenSignOff,
}) => {
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);

  if (!opportunity) return null;

  const isHigh = opportunity.atsScore >= 90;
  const isFlag = opportunity.atsScore >= 80 && opportunity.atsScore < 90;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
          {/* Header */}
          <div className="p-5 border-b border-[#E2E8F0] flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                    opportunity.category === "consultancy"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {opportunity.category}
                </span>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {opportunity.platform}
                </span>
                <span className="text-xs text-[#64748B]">Posted: {opportunity.postedDate}</span>
              </div>

              <h3 className="text-lg font-bold text-[#18181B] font-serif-heading leading-snug">
                {opportunity.title}
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B] pt-1">
                <span className="font-semibold text-[#18181B] flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-[#94A3B8]" />
                  {opportunity.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                  {opportunity.location}
                </span>
                <span className="font-mono font-bold text-[#F97316]">
                  {opportunity.salaryOrBudget}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-[#94A3B8] hover:text-[#18181B] p-1 rounded-md hover:bg-[#F4F5F7]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* ATS Score Dial Card */}
            <div className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono">
                    ATS Semantic Compatibility Rating
                  </h4>
                  {isHigh && (
                    <span className="text-[10px] font-mono bg-orange-100 text-[#EA580C] px-2 py-0.5 rounded font-bold">
                      CRITICAL MATCH
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B]">
                  {isHigh
                    ? "Exceeds 90% threshold. Automated tailored resume, letter, and proposal have been generated."
                    : isFlag
                    ? "Scored 80-89%. Auto-flagged for priority review and manual tailoring refinement."
                    : "Standard pipeline rating."}
                </p>
              </div>

              <CircularGauge score={opportunity.atsScore} size="md" />
            </div>

            {/* Dehumanized Elevator Pitch (Prompt requirement 5) */}
            {opportunity.dehumanizedPitch && (
              <div className="bg-[#FFFBF7] border-l-4 border-l-[#F97316] border border-orange-200 p-3.5 rounded-r-lg space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#EA580C] font-mono">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Dehumanized Organic Candidate Pitch</span>
                </div>
                <p className="text-xs text-[#334155] leading-relaxed italic">
                  "{opportunity.dehumanizedPitch}"
                </p>
              </div>
            )}

            {/* Description / Terms of Reference */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono border-b border-[#E2E8F0] pb-1">
                Opportunity Description / Scope of Work
              </h4>
              <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-line">
                {opportunity.description}
              </p>
            </div>

            {/* Key Requirements */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] font-mono border-b border-[#E2E8F0] pb-1">
                Required Qualifications & Skills
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#334155]">
                {opportunity.requirements.map((req, i) => (
                  <div key={i} className="flex items-start gap-1.5 bg-[#F8F9FA] p-2 rounded border border-[#E2E8F0]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 bg-[#F8F9FA] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-[#64748B] hover:text-[#18181B]"
              >
                Close
              </button>

              <button
                onClick={() => setShowLinkedInModal(true)}
                className="px-3.5 py-2 bg-[#F0F7FD] hover:bg-[#E1EFFB] text-[#0A66C2] border border-[#B8D7F2] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Export structured draft for LinkedIn Easy Apply or Experience Entry"
              >
                <span className="font-bold bg-[#0A66C2] text-white w-4 h-4 rounded text-[10px] flex items-center justify-center leading-none">in</span>
                <span>Export to LinkedIn</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenDocumentStudio(opportunity);
                }}
                className="px-4 py-2 bg-white hover:bg-[#F1F5F9] text-[#18181B] text-xs font-semibold rounded-lg border border-[#CBD5E1] flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Inspect Tailored Documents</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenSignOff(opportunity);
                }}
                className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Authorize & Submit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLinkedInModal && (
        <LinkedInExportModal
          opportunity={opportunity}
          receipt={opportunity.receipt}
          onClose={() => setShowLinkedInModal(false)}
        />
      )}
    </>
  );
};
