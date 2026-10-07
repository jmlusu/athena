import React, { useState, useEffect, useMemo } from "react";
import {
  Globe,
  MapPin,
  Building,
  Briefcase,
  Search,
  RotateCw,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Database,
  Cpu,
} from "lucide-react";
import { Opportunity, OpportunityScope, OpportunityCategory } from "../../types";
import { api } from "../../api";
import { CircularGauge } from "../charts/CircularGauge";
import { ATS_CRITICAL_MIN, ATS_FLAGGED_MAX, ATS_FLAGGED_MIN } from "../../lib/athena/metrics-registry";
import { Pagination } from "../ui/Pagination";

interface ScraperDiscoveryViewProps {
  opportunities: Opportunity[];
  onOpenDetails: (opp: Opportunity) => void;
  onOpenDocumentStudio: (opp: Opportunity) => void;
  onReloadJobs: () => Promise<number>;
}

// The backend fans out across every registered board and applies max_results per
// source, so keep this modest enough that the button stays responsive.
const LIVE_SCRAPE_MAX_RESULTS = 25;

export const ScraperDiscoveryView: React.FC<ScraperDiscoveryViewProps> = ({
  opportunities,
  onOpenDetails,
  onOpenDocumentStudio,
  onReloadJobs,
}) => {
  const [activeScope, setActiveScope] = useState<OpportunityScope | "all">("all");
  const [activeCategory, setActiveCategory] = useState<OpportunityCategory | "all">("all");
  const [activePlatform, setActivePlatform] = useState<string>("all");
  const [searchKeywords, setSearchKeywords] = useState("Systems Architecture, n8n Automation, Public Sector Malawi, Remote Engineering");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeSuccessMsg, setScrapeSuccessMsg] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filter existing opportunities
  const filtered = useMemo(() => {
    return opportunities.filter((opp) => {
      if (activeScope !== "all" && opp.scope !== activeScope) return false;
      if (activeCategory !== "all" && opp.category !== activeCategory) return false;
      if (activePlatform !== "all" && opp.platform !== activePlatform) return false;
      return true;
    });
  }, [opportunities, activeScope, activeCategory, activePlatform]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeScope, activeCategory, activePlatform, searchKeywords]);

  // Paginated slice
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Real scrape: POST /api/v1/athena/scrape, then POST /process to score what it
  // wrote, then reload. The old path called /api/ai/scrape-live, which returns
  // AI-synthesized listings with invented ATS scores whenever no Gemini key is set,
  // and merged them under synthetic scraped-<timestamp>-<n> ids.
  const handleExecuteLiveScrape = async () => {
    setIsScraping(true);
    setScrapeSuccessMsg(null);

    // The keyword box holds a comma-separated phrase list; the scraper takes a
    // single query, so lead with the first entry.
    const query = searchKeywords
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)[0];

    if (!query) {
      setScrapeSuccessMsg("Enter at least one search keyword before scraping.");
      setIsScraping(false);
      return;
    }

    try {
      const scrape = await api.triggerScrape({
        query,
        ...(activeScope !== "all" ? { location: activeScope } : {}),
        ...(activeCategory !== "all" ? { job_type: activeCategory } : {}),
        max_results: LIVE_SCRAPE_MAX_RESULTS,
      });
      await api.processJobs();
      const inPipeline = await onReloadJobs();

      setScrapeSuccessMsg(
        `Scraped ${scrape.source}: ${scrape.jobsFound} found, ${scrape.jobsNew} new, ${scrape.jobsUpdated} updated. ${inPipeline} roles now in the pipeline.`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "network error";
      // 409 means the 4h scheduler holds the scrape lock, not that this failed.
      setScrapeSuccessMsg(
        message.includes("409")
          ? "A scrape is already running (the 4h scheduler holds the lock). Try again when it finishes."
          : `Scrape failed: ${message}`
      );
      console.error("Scrape error:", err);
    } finally {
      setIsScraping(false);
      setTimeout(() => setScrapeSuccessMsg(null), 8000);
    }
  };

  // Rendered listings content
  const listingsContent = paginated.length === 0 ? (
    <div className="p-8 text-center text-[#64748B] text-xs">
      No opportunities match the current filters.
    </div>
  ) : (
    paginated.map((opp) => {
      const isHigh = opp.atsScore >= ATS_CRITICAL_MIN;
      const isFlag = opp.atsScore >= ATS_FLAGGED_MIN && opp.atsScore < ATS_FLAGGED_MAX;

      return (
        <div
          key={opp.id}
          className="p-4 hover:bg-[#F8F9FA] transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          {/* Left: Info */}
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                  opp.category === "consultancy"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {opp.category}
              </span>

              <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {opp.platform}
              </span>

              <span className="text-[11px] text-[#64748B] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#94A3B8]" />
                <span>{opp.postedDate}</span>
              </span>
            </div>

            <h4
              onClick={() => onOpenDetails(opp)}
              className="font-bold text-sm text-[#18181B] hover:text-[#F97316] cursor-pointer transition-colors"
            >
              {opp.title}
            </h4>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B]">
              <span className="font-medium text-[#18181B] flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-[#94A3B8]" />
                {opp.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                {opp.location}
              </span>
              <span className="font-mono text-[#18181B] font-semibold">
                {opp.salaryOrBudget}
              </span>
            </div>

            <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed">
              {opp.description}
            </p>

            {/* Requirements tags */}
            <div className="flex flex-wrap gap-1 pt-1">
              {opp.requirements?.slice(0, 4).map((req, i) => (
                <span
                  key={i}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569]"
                >
                  {req}
                </span>
              ))}
              {(opp.requirements?.length || 0) > 4 && (
                <span className="text-[10px] text-[#94A3B8] font-mono self-center">
                  +{(opp.requirements?.length || 0) - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Right: ATS score gauge & actions */}
          <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
            <CircularGauge score={opp.atsScore} size="sm" showLabel={false} />

            <div className="text-right space-y-1.5 min-w-[130px]">
              <div className="text-xs font-mono font-bold">
                {isHigh ? (
                  <span className="text-[#EA580C] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    ≥90 AUTO-READY
                  </span>
                ) : isFlag ? (
                  <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    80-89 FLAGGED
                  </span>
                ) : (
                  <span className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded">
                    STANDARD ({opp.atsScore}%)
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-1.5">
                {isHigh && (
                  <button
                    onClick={() => onOpenDocumentStudio(opp)}
                    className="px-2.5 py-1 bg-[#F97316] hover:bg-[#EA580C] text-white text-[11px] rounded font-medium transition-colors shadow-xs"
                  >
                    View Docs
                  </button>
                )}

                <button
                  onClick={() => onOpenDetails(opp)}
                  className="px-2.5 py-1 bg-[#18181B] hover:bg-[#2A2E37] text-white text-[11px] rounded font-medium transition-colors"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    })
  );

  return (
    <div className="space-y-4">
      {/* Search & Aggregator Command Deck */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#F97316]" />
              <h3 className="font-serif-heading text-base font-bold text-[#18181B]">
                Athena Live Scraper & Semantic Aggregator
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Live crawler targeted for Lilongwe, Malawi local opportunities, Lilongwe remote, and international remote positions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExecuteLiveScrape}
              disabled={isScraping}
              className="px-4 py-2 bg-[#18181B] hover:bg-[#2A2E37] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#F97316] ${isScraping ? "animate-spin" : ""}`} />
              <span>{isScraping ? "Crawling Feeds..." : "Run Live Semantic Scrape"}</span>
            </button>
          </div>
        </div>

        {/* Query Input */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#F1F5F9]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              placeholder="Keywords matching applicant resume & expertise..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F4F5F7] border border-[#E2E8F0] rounded-lg text-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-[#64748B] font-medium">Platform:</span>
            {["all", "LinkedIn", "Upwork", "ReliefWeb", "Corporate"].map((plat) => (
              <button
                key={plat}
                onClick={() => setActivePlatform(plat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activePlatform === plat
                    ? "bg-[#F97316] text-white"
                    : "bg-[#F4F5F7] text-[#64748B] hover:text-[#18181B]"
                }`}
              >
                {plat === "all" ? "All" : plat}
              </button>
            ))}
          </div>
        </div>

        {/* Target Scope Pill Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2">
          <button
            onClick={() => setActiveScope("all")}
            className={`p-2 rounded-lg border text-left text-xs transition-all ${
              activeScope === "all"
                ? "bg-[#FFFBF7] border-[#F97316] text-[#18181B]"
                : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8F9FA]"
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[#18181B]">
              <Globe className="w-3.5 h-3.5 text-[#F97316]" />
              <span>All 3 Scopes</span>
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">Aggregated pipeline</div>
          </button>

          <button
            onClick={() => setActiveScope("lilongwe-local")}
            className={`p-2 rounded-lg border text-left text-xs transition-all ${
              activeScope === "lilongwe-local"
                ? "bg-[#FFFBF7] border-[#F97316] text-[#18181B]"
                : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8F9FA]"
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[#18181B]">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>1. Lilongwe Local</span>
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">City Centre / Capital Hill / On-site</div>
          </button>

          <button
            onClick={() => setActiveScope("lilongwe-remote")}
            className={`p-2 rounded-lg border text-left text-xs transition-all ${
              activeScope === "lilongwe-remote"
                ? "bg-[#FFFBF7] border-[#F97316] text-[#18181B]"
                : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8F9FA]"
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[#18181B]">
              <Building className="w-3.5 h-3.5 text-blue-500" />
              <span>2. Lilongwe Remote</span>
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">Malawi-based 100% remote</div>
          </button>

          <button
            onClick={() => setActiveScope("international-remote")}
            className={`p-2 rounded-lg border text-left text-xs transition-all ${
              activeScope === "international-remote"
                ? "bg-[#FFFBF7] border-[#F97316] text-[#18181B]"
                : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8F9FA]"
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[#18181B]">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span>3. Intl Remote</span>
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5">Anywhere (US/EU/Global)</div>
          </button>
        </div>

        {/* Success Alert Banner */}
        {scrapeSuccessMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{scrapeSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Sourced Listings Table & Grid */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-xs text-[#18181B] uppercase tracking-wider">
              Discovered Opportunities ({filtered.length})
            </h4>
            <span className="text-[11px] text-[#64748B]">Sorted by ATS Score</span>
          </div>
          <span className="text-[11px] font-mono text-[#64748B]">
            Automated Crawler Cycle: Every 4 Hours
          </span>
        </div>

        <div className="divide-y divide-[#F1F5F9]">
          {listingsContent}
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
};