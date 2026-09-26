import React from "react";
import {
  Compass,
  Briefcase,
  FileText,
  CheckSquare,
  Receipt,
  Workflow,
  User,
  Clock,
  MapPin,
  Globe,
  Building,
  RotateCw,
  Zap,
  Sliders,
} from "lucide-react";
import { OpportunityScope, OpportunityCategory, CronScheduleState } from "../../types";

export type NavView =
  | "pipeline"
  | "scraper"
  | "documents"
  | "form_filler"
  | "receipts"
  | "n8n"
  | "profile";

interface LeftSidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  selectedScope: OpportunityScope | "all";
  onSelectScope: (scope: OpportunityScope | "all") => void;
  selectedCategory: OpportunityCategory | "all";
  onSelectCategory: (category: OpportunityCategory | "all") => void;
  cronState: CronScheduleState;
  onTriggerCronNow: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentView,
  onSelectView,
  selectedScope,
  onSelectScope,
  selectedCategory,
  onSelectCategory,
  cronState,
  onTriggerCronNow,
}) => {
  const formatSeconds = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const navItems = [
    { id: "pipeline", label: "Pipeline & Command", icon: Compass, badge: null },
    { id: "scraper", label: "Scraper & Discovery", icon: Briefcase, badge: "Live" },
    { id: "documents", label: "Pristine Document Studio", icon: FileText, badge: "1/2 Col" },
    { id: "form_filler", label: "Online Forms & Sign-Off", icon: CheckSquare, badge: "Auth" },
    { id: "receipts", label: "Receipts & Follow-ups", icon: Receipt, badge: null },
    { id: "n8n", label: "n8n Workflow Nodes", icon: Workflow, badge: "Plus" },
    { id: "profile", label: "Applicant Skills & Profile", icon: User, badge: null },
  ];

  return (
    <aside className="w-68 min-h-screen bg-[#1E2024] text-[#E2E8F0] border-r border-[#2D3139] flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-4 border-b border-[#2D3139] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-white shadow-md font-brand font-bold text-base">
              A
            </div>
            <div>
              <h1 className="font-brand font-bold tracking-wider text-white text-base leading-none">
                ATHENA
              </h1>
              <span className="text-[10px] tracking-widest text-[#94A3B8] uppercase font-mono">
                Auto Job & Consultancy
              </span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" title="Engine Online" />
        </div>

        {/* Search Scopes Quick Filters */}
        <div className="p-3 border-b border-[#2D3139]">
          <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Target Scopes</span>
            <span className="font-mono text-[9px] text-[#F97316]">Lilongwe / Global</span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => onSelectScope("all")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedScope === "all"
                  ? "bg-[#2A2E37] text-white border-l-2 border-[#F97316]"
                  : "text-[#94A3B8] hover:bg-[#252830] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#F97316]" /> All Targeted Feeds
              </span>
            </button>

            <button
              onClick={() => onSelectScope("lilongwe-local")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedScope === "lilongwe-local"
                  ? "bg-[#2A2E37] text-white border-l-2 border-[#F97316]"
                  : "text-[#94A3B8] hover:bg-[#252830] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Lilongwe Local (MW)
              </span>
            </button>

            <button
              onClick={() => onSelectScope("lilongwe-remote")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedScope === "lilongwe-remote"
                  ? "bg-[#2A2E37] text-white border-l-2 border-[#F97316]"
                  : "text-[#94A3B8] hover:bg-[#252830] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-blue-400" /> Lilongwe Remote Hub
              </span>
            </button>

            <button
              onClick={() => onSelectScope("international-remote")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedScope === "international-remote"
                  ? "bg-[#2A2E37] text-white border-l-2 border-[#F97316]"
                  : "text-[#94A3B8] hover:bg-[#252830] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> International Remote
              </span>
            </button>
          </div>

          {/* Category Toggle: Jobs vs Consultancies */}
          <div className="grid grid-cols-3 gap-1 mt-2.5 p-0.5 bg-[#141619] rounded-lg border border-[#2D3139] text-[10px]">
            <button
              onClick={() => onSelectCategory("all")}
              className={`py-1 rounded font-medium ${
                selectedCategory === "all" ? "bg-[#2D3139] text-white" : "text-[#94A3B8]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => onSelectCategory("job")}
              className={`py-1 rounded font-medium ${
                selectedCategory === "job" ? "bg-[#F97316] text-white" : "text-[#94A3B8]"
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => onSelectCategory("consultancy")}
              className={`py-1 rounded font-medium ${
                selectedCategory === "consultancy" ? "bg-[#DC2626] text-white" : "text-[#94A3B8]"
              }`}
            >
              Consultancies
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="p-3 space-y-1">
          <div className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2 px-1">
            System Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id as NavView)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#F97316] text-white shadow-sm font-semibold"
                    : "text-[#CBD5E1] hover:bg-[#252830] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#94A3B8]"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? "bg-black/20 text-white" : "bg-[#2A2E37] text-[#FB923C]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4-Hour Cron Schedules Status Widget (Required by prompt) */}
      <div className="p-3.5 m-3 bg-[#141619] rounded-xl border border-[#2D3139] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <Clock className="w-3.5 h-3.5 text-[#F97316]" />
            <span>4-Hour Cron Crawlers</span>
          </div>
          <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">
            Active (q=4h)
          </span>
        </div>

        {/* Job crawler status */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#94A3B8]">Job Search (4h)</span>
            <span className="font-mono text-[#FB923C] font-semibold">
              {formatSeconds(cronState.jobSecondsRemaining)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#252830] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F97316] transition-all"
              style={{
                width: `${Math.max(5, ((14400 - cronState.jobSecondsRemaining) / 14400) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Consultancy crawler status */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#94A3B8]">Consultancy (4h)</span>
            <span className="font-mono text-[#EF4444] font-semibold">
              {formatSeconds(cronState.consultancySecondsRemaining)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#252830] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#DC2626] transition-all"
              style={{
                width: `${Math.max(5, ((14400 - cronState.consultancySecondsRemaining) / 14400) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Manual Instant Trigger Button */}
        <button
          onClick={onTriggerCronNow}
          className="w-full flex items-center justify-center gap-2 py-1.5 bg-[#2A2E37] hover:bg-[#343944] text-white text-xs rounded-lg font-medium transition-colors border border-[#3E4452]"
        >
          <RotateCw className="w-3 h-3 text-[#F97316]" />
          <span>Execute 4h Cycle Now</span>
        </button>

        <div className="text-[10px] text-[#64748B] text-center font-mono">
          Last sync: {cronState.lastJobRun}
        </div>
      </div>
    </aside>
  );
};
