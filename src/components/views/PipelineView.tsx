import React, { useState, useEffect, useMemo } from "react";
import {
  Compass,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Building,
  MapPin,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Opportunity, PipelineStatus, OpportunityScope, OpportunityCategory } from "../../types";
import { CircularGauge } from "../charts/CircularGauge";
import { ATS_CRITICAL_MIN, ATS_FLAGGED_MAX, ATS_FLAGGED_MIN } from "../../lib/athena/metrics-registry";
import { Pagination } from "../ui/Pagination";

interface PipelineViewProps {
  opportunities: Opportunity[];
  onOpenDetails: (opp: Opportunity) => void;
  onOpenDocumentStudio: (opp: Opportunity) => void;
  onOpenSignOff: (opp: Opportunity) => void;
  onOpenReceipt: (opp: Opportunity) => void;
  onUpdateStatus: (id: string, newStatus: PipelineStatus) => void;
  scopeFilter: OpportunityScope | "all";
  categoryFilter: OpportunityCategory | "all";
  externalStageFilter?: string;
  externalAtsFilter?: "all" | "critical" | "flagged";
  onFilterConsumed?: () => void;
}

const pipelineStages: { id: PipelineStatus; title: string; subtitle: string; color: string }[] = [
  { id: "discovered", title: "1. Discovered", subtitle: "Scraped & Queued", color: "border-t-slate-400" },
  { id: "evaluated", title: "2. ATS Evaluated", subtitle: "Semantic Matching", color: "border-t-[#F97316]" },
  { id: "tailored", title: "3. Tailored / Ready", subtitle: "≥90 Auto-Created", color: "border-t-amber-500" },
  { id: "awaiting_signoff", title: "4. Awaiting Sign-Off", subtitle: "Human Authorization", color: "border-t-[#DC2626]" },
  { id: "submitted", title: "5. Submitted", subtitle: "Receipts Archived", color: "border-t-emerald-600" },
  { id: "interview", title: "6. Interview & Award", subtitle: "Follow-Up Cadence", color: "border-t-purple-600" },
  { id: "offer", title: "7. Offer", subtitle: "Negotiation & Close", color: "border-t-blue-600" },
];

export const PipelineView: React.FC<PipelineViewProps> = ({
  opportunities,
  onOpenDetails,
  onOpenDocumentStudio,
  onOpenSignOff,
  onOpenReceipt,
  onUpdateStatus,
  scopeFilter,
  categoryFilter,
  externalStageFilter,
  externalAtsFilter,
  onFilterConsumed,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStageFilter, setActiveStageFilter] = useState<string>("all");

  // Pagination state per column
  const [page, setPage] = useState<Record<PipelineStatus, number>>({
    discovered: 1,
    evaluated: 1,
    tailored: 1,
    awaiting_signoff: 1,
    submitted: 1,
    interview: 1,
    offer: 1,
  });
  const [pageSize, setPageSize] = useState<Record<PipelineStatus, number>>({
    discovered: 25,
    evaluated: 25,
    tailored: 25,
    awaiting_signoff: 25,
    submitted: 25,
    interview: 25,
    offer: 25,
  });

  const filterStage = externalStageFilter && externalStageFilter !== "all" ? externalStageFilter : activeStageFilter;
  const filterAts = externalAtsFilter ?? "all";

  const filteredOpportunities = opportunities.filter((opp) => {
    if (scopeFilter !== "all" && opp.scope !== scopeFilter) return false;
    if (categoryFilter !== "all" && opp.category !== categoryFilter) return false;
    if (filterStage !== "all" && opp.status !== filterStage) return false;
    if (filterAts === "critical" && opp.atsScore < ATS_CRITICAL_MIN) return false;
    if (filterAts === "flagged" && (opp.atsScore < ATS_FLAGGED_MIN || opp.atsScore >= ATS_FLAGGED_MAX)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        opp.title.toLowerCase().includes(q) ||
        opp.company.toLowerCase().includes(q) ||
        opp.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Paginated items per stage
  const getPaginatedItems = (stageId: PipelineStatus, items: Opportunity[]) => {
    const start = (page[stageId] - 1) * pageSize[stageId];
    return items.slice(start, start + pageSize[stageId]);
  };

  const handleStageClick = (stage: string) => {
    setActiveStageFilter(stage);
    if (externalStageFilter && externalStageFilter !== stage) onFilterConsumed?.();
    if (externalAtsFilter && externalAtsFilter !== "all") onFilterConsumed?.();
  };

  // Reset page when filters change
  useEffect(() => {
    setPage({
      discovered: 1,
      evaluated: 1,
      tailored: 1,
      awaiting_signoff: 1,
      submitted: 1,
      interview: 1,
      offer: 1,
    });
  }, [filterStage, filterAts, searchQuery, scopeFilter, categoryFilter]);

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by title, client, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F4F5F7] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F97316] text-[#18181B]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[#64748B] text-[11px] font-medium whitespace-nowrap">Stage Filter:</span>
          <button
            onClick={() => handleStageClick("all")}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              filterStage === "all" && filterAts === "all" ? "bg-[#18181B] text-white" : "bg-[#F4F5F7] text-[#64748B] hover:text-[#18181B]"
            }`}
          >
            All Stages ({opportunities.length})
          </button>
          <button
            onClick={() => handleStageClick("tailored")}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              filterStage === "tailored" ? "bg-[#F97316] text-white" : "bg-[#F4F5F7] text-[#64748B] hover:text-[#18181B]"
            }`}
          >
            Tailored
          </button>
          <button
            onClick={() => handleStageClick("awaiting_signoff")}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              filterStage === "awaiting_signoff" ? "bg-[#DC2626] text-white" : "bg-[#F4F5F7] text-[#64748B] hover:text-[#18181B]"
            }`}
          >
            Sign-Off Needed
          </button>
          <button
            onClick={() => handleStageClick("submitted")}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              filterStage === "submitted" ? "bg-emerald-600 text-white" : "bg-[#F4F5F7] text-[#64748B] hover:text-[#18181B]"
            }`}
          >
            Submitted
          </button>
          {filterAts !== "all" && (
            <span className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap text-white ${
              filterAts === "critical" ? "bg-[#F97316]" : "bg-amber-500"
            }`}>
              {filterAts === "critical" ? "ATS ≥ 90" : "ATS 80-89"}
            </span>
          )}
        </div>
      </div>

      {/* End-to-End Kanban Stage Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 min-h-[560px]">
        {pipelineStages.map((stage) => {
          const itemsInStage = filteredOpportunities.filter((o) => o.status === stage.id);
          const paginatedItems = getPaginatedItems(stage.id, itemsInStage);
          const totalPages = Math.ceil(itemsInStage.length / pageSize[stage.id]);

          return (
            <div
              key={stage.id}
              className={`bg-[#F9FAFB] border border-[#E2E8F0] ${stage.color} border-t-4 rounded-xl p-2.5 flex flex-col`}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
                <div>
                  <h4 className="text-xs font-bold text-[#18181B] leading-tight">{stage.title}</h4>
                  <span className="text-[10px] text-[#64748B]">{stage.subtitle}</span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-[#E2E8F0] text-[#18181B]">
                  {itemsInStage.length}
                </span>
              </div>

              {/* Opportunity Cards List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                {paginatedItems.length === 0 ? (
                  <div className="text-center py-8 text-[11px] text-[#94A3B8] italic">
                    No opportunities in this stage.
                  </div>
                ) : (
                  <div>
                    {paginatedItems.map((opp) => {
                      const isHighAts = opp.atsScore >= ATS_CRITICAL_MIN;
                      const isFlagged = opp.atsScore >= ATS_FLAGGED_MIN && opp.atsScore < ATS_FLAGGED_MAX;

                      return (
                        <div
                          key={opp.id}
                          className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg p-3 shadow-xs transition-all space-y-2 group"
                        >
                          {/* Card Top: Category & Platform */}
                          <div className="flex items-center justify-between text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono uppercase font-semibold ${
                                opp.category === "consultancy"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {opp.category}
                            </span>
                            <span className="text-[#64748B] font-mono">{opp.platform}</span>
                          </div>

                          {/* Title & Organization */}
                          <div
                            onClick={() => onOpenDetails(opp)}
                            className="cursor-pointer hover:text-[#F97316] transition-colors"
                          >
                            <h5 className="font-semibold text-xs text-[#18181B] line-clamp-2 leading-snug">
                              {opp.title}
                            </h5>
                            <div className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1 flex items-center gap-1">
                              <Building className="w-3 h-3 text-[#94A3B8]" />
                              <span>{opp.company}</span>
                            </div>
                          </div>

                          {/* Location & Compensation */}
                          <div className="text-[10px] text-[#64748B] space-y-0.5 bg-[#F8F9FA] p-1.5 rounded">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#94A3B8]" />
                              <span className="line-clamp-1">{opp.location}</span>
                            </div>
                            <div className="font-mono text-[#18181B] font-medium">
                              {opp.salaryOrBudget}
                            </div>
                          </div>

                          {/* ATS Score & Triggers */}
                          <div className="flex items-center justify-between pt-1 border-t border-[#F1F5F9]">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                                  isHighAts
                                    ? "bg-orange-100 text-[#EA580C]"
                                    : isFlagged
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {opp.atsScore}
                              </div>
                              <span className="text-[10px] text-[#64748B]">ATS Match</span>
                            </div>

                            {isHighAts && (
                              <span
                                className="text-[9px] font-mono text-[#EA580C] bg-orange-50 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1"
                                title="ATS ≥90: Auto-created documents ready"
                              >
                                <Sparkles className="w-2.5 h-2.5" /> ≥90
                              </span>
                            )}

                            {isFlagged && (
                              <span
                                className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1"
                                title="ATS 80-89: Auto-flagged for priority review"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" /> 80-89
                              </span>
                            )}
                          </div>

                          {/* Action buttons based on status */}
                          <div className="pt-1.5 border-t border-[#F1F5F9] flex items-center justify-between gap-1 text-[11px]">
                            {stage.id === "tailored" && (
                              <button
                                onClick={() => onOpenDocumentStudio(opp)}
                                className="w-full py-1 bg-[#F4F5F7] hover:bg-[#F97316] hover:text-white text-[#18181B] rounded font-medium transition-colors flex items-center justify-center gap-1 text-[10.5px]"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Inspect Documents</span>
                              </button>
                            )}

                            {stage.id === "awaiting_signoff" && (
                              <button
                                onClick={() => onOpenSignOff(opp)}
                                className="w-full py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded font-medium transition-colors flex items-center justify-center gap-1 text-[10.5px] shadow-xs"
                              >
                                <span>Sign & Submit</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}

                            {stage.id === "submitted" && (
                              <button
                                onClick={() => onOpenReceipt(opp)}
                                className="w-full py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-medium transition-colors flex items-center justify-center gap-1 text-[10.5px]"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>View Receipt</span>
                              </button>
                            )}

                            {stage.id === "discovered" && (
                              <button
                                onClick={() => onUpdateStatus(opp.id, "evaluated")}
                                className="w-full py-1 bg-[#18181B] hover:bg-[#2A2E37] text-white rounded font-medium transition-colors text-[10.5px]"
                              >
                                Evaluate ATS
                              </button>
                            )}

                            {stage.id === "evaluated" && (
                              <button
                                onClick={() => {
                                  onUpdateStatus(opp.id, "tailored");
                                  onOpenDocumentStudio(opp);
                                }}
                                className="w-full py-1 bg-[#F97316] hover:bg-[#EA580C] text-white rounded font-medium transition-colors text-[10.5px]"
                              >
                                Tailor Documents
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination for this column */}
              {totalPages > 1 && (
                <Pagination
                  page={page[stage.id]}
                  pageSize={pageSize[stage.id]}
                  total={itemsInStage.length}
                  onPageChange={(p) => setPage((prev) => ({ ...prev, [stage.id]: p }))}
                  onPageSizeChange={(size) => setPageSize((prev) => ({ ...prev, [stage.id]: size }))}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};