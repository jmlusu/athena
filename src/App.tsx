import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Compass,
  Briefcase,
  FileText,
  CheckSquare,
  Receipt,
  Workflow,
  User,
  RotateCw,
  Bell,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Globe,
  Sliders,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Opportunity,
  OpportunityScope,
  OpportunityCategory,
  PipelineStatus,
  ApplicantProfile,
  ApplicationReceipt,
  AutomationSettings,
  CronScheduleState,
} from "./types";
import {
  initialOpportunities,
  initialApplicantProfile,
  initialCronState,
  defaultSettings,
} from "./data/mockData";
import { api } from "./api";
import { LeftSidebar, NavView } from "./components/layout/LeftSidebar";
import { RightSidebar } from "./components/layout/RightSidebar";
import { LayeredMountainChart } from "./components/charts/LayeredMountainChart";
import { MetricsAndBarChart } from "./components/charts/MetricsAndBarChart";
import { PipelineView } from "./components/views/PipelineView";
import { ScraperDiscoveryView } from "./components/views/ScraperDiscoveryView";
import { DocumentStudioView } from "./components/views/DocumentStudioView";
import { ReceiptsView } from "./components/views/ReceiptsView";
import { N8nIntegrationView } from "./components/views/N8nIntegrationView";
import { ApplicantProfileView } from "./components/views/ApplicantProfileView";
import { FormFillerView } from "./components/views/FormFillerView";
import { OpportunityDetailModal } from "./components/modals/OpportunityDetailModal";

// Query per cron cycle. "all" stays broad on purpose -- the APScheduler entry
// registered at startup uses "software engineer" for the same reason.
const CRON_QUERIES: Record<"job" | "consultancy" | "all", string> = {
  job: "software engineer",
  consultancy: "ICT consultant",
  all: "engineer",
};

// Kept modest so the button stays responsive: search_all fans out across every
// registered board and applies max_results per source.
const CRON_MAX_RESULTS = 25;

// The backend answers 409 when the 4h scheduler is mid-scrape. Say so plainly
// instead of surfacing a bare status code.
function describeError(err: unknown): string {
  const message = err instanceof Error ? err.message : "network error";
  if (message.includes("409")) {
    return "a scrape is already running (the 4h scheduler holds the lock) - retry when it finishes";
  }
  return message;
}

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<NavView>("pipeline");
  const [selectedScope, setSelectedScope] = useState<OpportunityScope | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory | "all">("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [atsFilter, setAtsFilter] = useState<"all" | "critical" | "flagged">("all");

  // Core Data
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfile>(initialApplicantProfile);
  const [isLoading, setIsLoading] = useState(true);
  // Set when a backend read fails. The old behaviour was a console.warn plus a
  // silent fall back to mockData, which is how a broken /jobs proxy went unnoticed:
  // the dashboard looked populated and nothing anywhere said the data was fake.
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  // Automation Settings (Right Sidebar)
  const [settings, setSettings] = useState<AutomationSettings>(defaultSettings);

  // 4-Hour Cron State
  const [cronState, setCronState] = useState<CronScheduleState>(initialCronState);
  const [cronFiring, setCronFiring] = useState(false);
  const cronInFlightRef = useRef(false);

  // Modals & Selected Objects
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [detailModalOpp, setDetailModalOpp] = useState<Opportunity | null>(null);
  const [signOffOpportunity, setSignOffOpportunity] = useState<Opportunity | null>(null);
  const [showNotificationToast, setShowNotificationToast] = useState<string | null>(null);

  // Re-read the job store. Shared by first paint and by every post-scrape reload.
  // A successful read always wins, including when the store is genuinely empty --
  // rendering mock rows because the backend had nothing would be a second lie.
  const loadJobs = useCallback(async (): Promise<number> => {
    const jobsRes = await api.listJobs();
    const jobs = jobsRes.jobs ?? [];
    setOpportunities(jobs);
    setDataLoadError(null);
    return jobs.length;
  }, []);

  // Load data from backend on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadJobs();
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown error";
        setDataLoadError(
          `Could not load jobs from the Athena backend (${message}). These are seed rows, not live data -- check that uvicorn is running on port 8000.`
        );
      } finally {
        setIsLoading(false);
      }

      // The applicant profile is non-fatal: jobs still render without it, and the
      // jobs error banner is the one worth a user's attention.
      try {
        const profilesRes = await api.listProfiles();
        if (profilesRes && profilesRes.length > 0) {
          setApplicantProfile(profilesRes[0]);
        }
      } catch (err) {
        console.warn("Failed to load applicant profile:", err);
      }
    };
    loadData();
  }, [loadJobs]);

  // Real scrape chain. /scrape writes unscored jobs and returns a ScrapeJob record
  // rather than jobs, so /process has to run before the reload or the new rows
  // arrive with no ats_score and look like poor matches.
  const runScrapeCycle = async (
    type: "job" | "consultancy" | "all",
    opts: { query: string; location?: string; jobType?: string; maxResults?: number } = { query: "" }
  ): Promise<string> => {
    const scrape = await api.triggerScrape({
      query: opts.query,
      ...(opts.location ? { location: opts.location } : {}),
      ...(opts.jobType ? { job_type: opts.jobType } : {}),
      max_results: opts.maxResults ?? CRON_MAX_RESULTS,
    });
    await api.processJobs();
    const inPipeline = await loadJobs();
    return `${scrape.jobsFound} found, ${scrape.jobsNew} new, ${inPipeline} in pipeline`;
  };

  // Backend-backed cron cycle. Runs the real scraper, not the AI-synthesis
  // fallback that /api/ai/scrape-live returns when no Gemini key is configured.
  const runCronCycle = async (type: "job" | "consultancy" | "all") => {
    if (cronInFlightRef.current) return;
    cronInFlightRef.current = true;
    setCronFiring(true);

    const label = type.toUpperCase();
    try {
      const summary = await runScrapeCycle(type, {
        query: CRON_QUERIES[type],
        ...(type === "all" ? {} : { jobType: type }),
      });
      setShowNotificationToast(`4-Hour ${label} cron cycle completed - ${summary}.`);
    } catch (err) {
      setShowNotificationToast(`4-Hour ${label} cron cycle failed - ${describeError(err)}.`);
    } finally {
      cronInFlightRef.current = false;
      setCronFiring(false);
      setTimeout(() => setShowNotificationToast(null), 6000);
    }
  };

  const triggerCronRefresh = (type: "job" | "consultancy" | "all") => {
    runCronCycle(type);
  };

  // Keep the countdown timer firing through the latest handler without restarting it
  const cronRefreshRef = useRef(triggerCronRefresh);
  useEffect(() => {
    cronRefreshRef.current = triggerCronRefresh;
  });

  const handleTriggerCronNow = () => {
    if (cronFiring) return;
    setCronState((prev) => ({
      ...prev,
      jobSecondsRemaining: 14400,
      consultancySecondsRemaining: 14400,
      lastJobRun: new Date().toLocaleTimeString(),
      lastConsultancyRun: new Date().toLocaleTimeString(),
    }));
    triggerCronRefresh("all");
  };

  // 4-Hour Countdown Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCronState((prev) => {
        let newJob = prev.jobSecondsRemaining - 1;
        let newCons = prev.consultancySecondsRemaining - 1;

        if (newJob <= 0) {
          newJob = 14400; // Reset 4 hours (4 * 3600)
          cronRefreshRef.current("job");
        }
        if (newCons <= 0) {
          newCons = 14400; // Reset 4 hours
          cronRefreshRef.current("consultancy");
        }

        return {
          ...prev,
          jobSecondsRemaining: newJob,
          consultancySecondsRemaining: newCons,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Opportunity Status Updater
  const handleUpdateStatus = (id: string, newStatus: PipelineStatus) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === id ? { ...opp, status: newStatus } : opp))
    );
  };

  // Submission Success Handler
  const handleSubmitSuccess = (oppId: string, receipt: ApplicationReceipt) => {
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === oppId
          ? {
              ...opp,
              status: "submitted",
              receipt,
            }
          : opp
      )
    );
    setSignOffOpportunity(null);
    setShowNotificationToast(`Official Submission Receipt Generated: ${receipt.receiptId}`);
    setTimeout(() => setShowNotificationToast(null), 6000);
    // Switch to receipts view to show the proof
    setCurrentView("receipts");
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col font-sans text-[#18181B] selection:bg-[#F97316] selection:text-white">
      {/* Toast Notification */}
      {showNotificationToast && (
        <div className="fixed top-4 right-4 z-50 bg-[#18181B] text-white px-4 py-2.5 rounded-xl shadow-xl border border-[#3E4452] flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <Sparkles className="w-4 h-4 text-[#F97316]" />
          <span>{showNotificationToast}</span>
        </div>
      )}

      {/* Live-data failure banner. Deliberately loud: the previous silent
          mockData fallback is what let a dead /jobs proxy look healthy. */}
      {dataLoadError && (
        <div className="sticky top-0 z-40 bg-red-600 text-white px-4 py-2.5 text-xs flex items-start gap-2.5 shadow-lg">
          <AlertCircle className="w-4 h-4 mt-px shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Pipeline is not live.</span> {dataLoadError}
          </div>
          <button
            onClick={() => setDataLoadError(null)}
            className="shrink-0 underline hover:no-underline"
            aria-label="Dismiss"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Structural Frame: Far-Left Sidebar + Fluid Center Body + Far-Right Sidebar */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Far-Left Vertical Sidebar */}
        <LeftSidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          selectedScope={selectedScope}
          onSelectScope={setSelectedScope}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          cronState={cronState}
          cronFiring={cronFiring}
          onTriggerCronNow={handleTriggerCronNow}
        />

        {/* Center Fluid Application Canvas */}
        <main className="flex-1 min-w-0 overflow-y-auto min-h-screen flex flex-col">
          {/* Top Application Bar */}
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between shadow-2xs">
            {/* Breadcrumb & Scope Pill */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-brand font-bold text-sm tracking-wider text-[#18181B]">
                ATHENA
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="font-semibold text-[#64748B] capitalize">
                {currentView.replace("_", " ")}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#FFFBF7] text-[#EA580C] border border-[#F97316]/30 font-medium">
                Scope: {selectedScope === "all" ? "Lilongwe & Global" : selectedScope}
              </span>
            </div>

            {/* Quick Actions & Status */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#64748B] font-mono bg-[#F8F9FA] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Lilongwe Gateway: Active</span>
              </div>

              <button
                onClick={() => setCurrentView("documents")}
                className="px-3 py-1.5 bg-[#18181B] hover:bg-[#2A2E37] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#F97316]" />
                <span className="hidden sm:inline">Pristine Document Studio</span>
                <span className="sm:hidden">Studio</span>
              </button>
            </div>
          </header>

          {/* Body Content Container */}
          <div className="p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">
            {/* Mountain Chart & Secondary Visualizations (Visible in Pipeline & Scraper views) */}
            {(currentView === "pipeline" || currentView === "scraper") && (
              <div className="space-y-4">
                {/* Primary Stylized Layered Mountain Area Chart */}
                <LayeredMountainChart
                  opportunities={opportunities}
                  onSelectScope={(scope) => setSelectedScope(scope as any)}
                />

                {/* Secondary Graphs: Metrics, Compatibility Bar Chart, Pipeline Marker Graph */}
                <MetricsAndBarChart
                  opportunities={opportunities}
                  onCardClick={(filter) => {
                    if (filter === "all") {
                      setStageFilter("all");
                      setAtsFilter("all");
                      setCurrentView("pipeline");
                    }
                    if (filter === "critical") {
                      setStageFilter("all");
                      setAtsFilter("critical");
                      setCurrentView("pipeline");
                    }
                    if (filter === "flagged") {
                      setStageFilter("all");
                      setAtsFilter("flagged");
                      setCurrentView("pipeline");
                    }
                    if (filter === "awaiting_signoff") {
                      setStageFilter("awaiting_signoff");
                      setAtsFilter("all");
                      setCurrentView("pipeline");
                    }
                    if (filter === "submitted") setCurrentView("receipts");
                  }}
                />
              </div>
            )}

            {/* Primary View Router */}
            {currentView === "pipeline" && (
              <PipelineView
                opportunities={opportunities}
                onOpenDetails={(opp) => setDetailModalOpp(opp)}
                onOpenDocumentStudio={(opp) => {
                  setSelectedOpportunity(opp);
                  setCurrentView("documents");
                }}
                onOpenSignOff={(opp) => setSignOffOpportunity(opp)}
                onOpenReceipt={(opp) => {
                  setSelectedOpportunity(opp);
                  setCurrentView("receipts");
                }}
                onUpdateStatus={handleUpdateStatus}
                scopeFilter={selectedScope}
                categoryFilter={selectedCategory}
                externalStageFilter={stageFilter}
                externalAtsFilter={atsFilter}
                onFilterConsumed={() => {
                  setStageFilter("all");
                  setAtsFilter("all");
                }}
              />
            )}

            {currentView === "scraper" && (
              <ScraperDiscoveryView
                opportunities={opportunities}
                onOpenDetails={(opp) => setDetailModalOpp(opp)}
                onOpenDocumentStudio={(opp) => {
                  setSelectedOpportunity(opp);
                  setCurrentView("documents");
                }}
                onReloadJobs={loadJobs}
              />
            )}

            {currentView === "documents" && (
              <DocumentStudioView
                selectedOpportunity={selectedOpportunity}
                applicantProfile={applicantProfile}
                opportunities={opportunities}
                onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                onOpenSignOff={(opp) => setSignOffOpportunity(opp)}
              />
            )}

            {currentView === "form_filler" && (
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center space-y-3">
                <CheckSquare className="w-10 h-10 text-[#F97316] mx-auto" />
                <h3 className="text-base font-bold font-serif-heading text-[#18181B]">
                  Online Application Form Assistant
                </h3>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  Select any tailored opportunity awaiting sign-off to initiate automated field-filling and digital power-of-attorney authorization.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const waitingOpp =
                        opportunities.find((o) => o.status === "awaiting_signoff") || opportunities[0];
                      if (waitingOpp) setSignOffOpportunity(waitingOpp);
                    }}
                    className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    Open Next Application for Sign-Off
                  </button>
                </div>
              </div>
            )}

            {currentView === "receipts" && (
              <ReceiptsView opportunities={opportunities} />
            )}

            {currentView === "n8n" && <N8nIntegrationView />}

            {currentView === "profile" && (
              <ApplicantProfileView
                profile={applicantProfile}
                onUpdateProfile={(updated) => setApplicantProfile(updated)}
              />
            )}
          </div>
        </main>

        {/* Far-Right Vertical Sidebar: Autonomous Rules, Sign-Off Gate, Aggregator Status */}
        <RightSidebar
          settings={settings}
          onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
          opportunities={opportunities}
          onOpenSignOff={(opp) => setSignOffOpportunity(opp)}
          onOpenDetails={(opp) => setDetailModalOpp(opp)}
        />
      </div>

      {/* Opportunity Detail Modal */}
      {detailModalOpp && (
        <OpportunityDetailModal
          opportunity={detailModalOpp}
          onClose={() => setDetailModalOpp(null)}
          onOpenDocumentStudio={(opp) => {
            setDetailModalOpp(null);
            setSelectedOpportunity(opp);
            setCurrentView("documents");
          }}
          onOpenSignOff={(opp) => {
            setDetailModalOpp(null);
            setSignOffOpportunity(opp);
          }}
        />
      )}

      {/* Online Form Filler & Mandatory Human Sign-Off Gate Modal */}
      {signOffOpportunity && (
        <FormFillerView
          opportunity={signOffOpportunity}
          applicantProfile={applicantProfile}
          onClose={() => setSignOffOpportunity(null)}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  );
}
