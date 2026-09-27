import React, { useState, useEffect, useCallback } from "react";
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

export default function App() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<NavView>("pipeline");
  const [selectedScope, setSelectedScope] = useState<OpportunityScope | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory | "all">("all");

  // Core Data
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfile>(initialApplicantProfile);

  // Automation Settings (Right Sidebar)
  const [settings, setSettings] = useState<AutomationSettings>(defaultSettings);

  // 4-Hour Cron State
  const [cronState, setCronState] = useState<CronScheduleState>(initialCronState);

  // Modals & Selected Objects
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [signOffOpportunity, setSignOffOpportunity] = useState<Opportunity | null>(null);
  const [showNotificationToast, setShowNotificationToast] = useState<string | null>(null);

  // 4-Hour Countdown Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCronState((prev) => {
        let newJob = prev.jobSecondsRemaining - 1;
        let newCons = prev.consultancySecondsRemaining - 1;

        if (newJob <= 0) {
          newJob = 14400; // Reset 4 hours (4 * 3600)
          triggerCronRefresh("job");
        }
        if (newCons <= 0) {
          newCons = 14400; // Reset 4 hours
          triggerCronRefresh("consultancy");
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

  const triggerCronRefresh = (type: "job" | "consultancy" | "all") => {
    setShowNotificationToast(`4-Hour ${type.toUpperCase()} cron cycle triggered automated discovery.`);
    setTimeout(() => setShowNotificationToast(null), 5000);
  };

  const handleTriggerCronNow = () => {
    setCronState((prev) => ({
      ...prev,
      jobSecondsRemaining: 14400,
      consultancySecondsRemaining: 14400,
      lastJobRun: new Date().toLocaleTimeString(),
      lastConsultancyRun: new Date().toLocaleTimeString(),
    }));
    triggerCronRefresh("all");
  };

  // Opportunity Status Updater
  const handleUpdateStatus = (id: string, newStatus: PipelineStatus) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === id ? { ...opp, status: newStatus } : opp))
    );
  };

  // Add freshly scraped listings
  const handleAddListings = (newListings: Opportunity[]) => {
    setOpportunities((prev) => {
      const existingIds = new Set(prev.map((o) => o.id));
      const filteredNew = newListings.filter((n) => !existingIds.has(n.id));
      return [...filteredNew, ...prev];
    });
    setShowNotificationToast(`Added ${newListings.length} newly discovered positions.`);
    setTimeout(() => setShowNotificationToast(null), 4000);
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
                    if (filter === "critical") setCurrentView("pipeline");
                    if (filter === "flagged") setCurrentView("pipeline");
                    if (filter === "awaiting_signoff") setCurrentView("pipeline");
                    if (filter === "submitted") setCurrentView("receipts");
                  }}
                />
              </div>
            )}

            {/* Primary View Router */}
            {currentView === "pipeline" && (
              <PipelineView
                opportunities={opportunities}
                onOpenDetails={(opp) => setSelectedOpportunity(opp)}
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
              />
            )}

            {currentView === "scraper" && (
              <ScraperDiscoveryView
                opportunities={opportunities}
                applicantProfile={applicantProfile}
                onOpenDetails={(opp) => setSelectedOpportunity(opp)}
                onOpenDocumentStudio={(opp) => {
                  setSelectedOpportunity(opp);
                  setCurrentView("documents");
                }}
                onAddListings={handleAddListings}
                onScoreAts={(opp) => {
                  setSelectedOpportunity(opp);
                }}
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
          onOpenDetails={(opp) => setSelectedOpportunity(opp)}
        />
      </div>

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onOpenDocumentStudio={(opp) => {
            setSelectedOpportunity(opp);
            setCurrentView("documents");
          }}
          onOpenSignOff={(opp) => setSignOffOpportunity(opp)}
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
