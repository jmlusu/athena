import React from "react";
import {
  Sliders,
  Sparkles,
  AlertTriangle,
  UserCheck,
  Zap,
  CheckCircle2,
  Workflow,
  Radio,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { AutomationSettings, Opportunity } from "../../types";

interface RightSidebarProps {
  settings: AutomationSettings;
  onUpdateSettings: (newSettings: Partial<AutomationSettings>) => void;
  opportunities: Opportunity[];
  onOpenSignOff: (opp: Opportunity) => void;
  onOpenDetails: (opp: Opportunity) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  settings,
  onUpdateSettings,
  opportunities,
  onOpenSignOff,
  onOpenDetails,
}) => {
  const pendingAuthorizations = opportunities.filter((o) => o.status === "awaiting_signoff");
  const autoCreatedCount = opportunities.filter(
    (o) =>
      o.autoCreatedDocs?.hasResume ||
      o.autoCreatedDocs?.hasCoverLetter ||
      o.autoCreatedDocs?.hasProposal ||
      o.autoCreatedDocs?.hasExecutiveSummary
  ).length;

  return (
    <aside className="w-72 min-h-screen bg-[#1E2024] text-[#E2E8F0] border-l border-[#2D3139] flex flex-col justify-between shrink-0 select-none overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#F97316]" />
            <span className="font-semibold text-xs text-white uppercase tracking-wider">
              Autonomous Controls
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#FB923C] bg-orange-950/80 px-2 py-0.5 rounded border border-orange-800/60">
            AUTO-PILOT
          </span>
        </div>

        {/* Autonomous ATS Rules & Toggles (Prompt requirements 18-23) */}
        <div className="space-y-3">
          <div className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">
            Scoring & Document Triggers
          </div>

          {/* Rule 1: ATS >= 90 Auto-Create */}
          <div className="bg-[#141619] border border-[#2D3139] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                <span className="text-xs font-semibold text-white">ATS ≥ 90 Auto-Generate</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoCreateResumeCoverLetter}
                  onChange={(e) =>
                    onUpdateSettings({
                      autoCreateResumeCoverLetter: e.target.checked,
                      autoCreateProposalExecSummary: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-[#2D3139] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#F97316]"></div>
              </label>
            </div>
            <p className="text-[10.5px] text-[#94A3B8] leading-tight">
              Auto-creates tailored resume + cover letter for jobs, and executive summary + proposal for consultancies.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>{autoCreatedCount} Documents Generated</span>
            </div>
          </div>

          {/* Rule 2: ATS 80-89 Auto-Flag */}
          <div className="bg-[#141619] border border-[#2D3139] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-white">ATS 80-89 Auto-Flag</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-[#F97316] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
              </label>
            </div>
            <p className="text-[10.5px] text-[#94A3B8] leading-tight">
              Auto-flags opportunities with 80-89 ATS match into high-priority review queue.
            </p>
          </div>

          {/* Rule 3: Dehumanizer Engine */}
          <div className="bg-[#141619] border border-[#2D3139] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-semibold text-white">Dehumanize AI Voice</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dehumanizeEnabled}
                  onChange={(e) => onUpdateSettings({ dehumanizeEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-[#2D3139] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#F97316]"></div>
              </label>
            </div>
            <p className="text-[10.5px] text-[#94A3B8] leading-tight">
              Purges AI telltales ("delve", "spearhead", "testament to") ensuring organic human professional voice.
            </p>
          </div>
        </div>

        {/* Pending Human Authorization Queue (Gatekeeper before submission) */}
        <div className="space-y-2 pt-2 border-t border-[#2D3139]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Human Sign-Off Gate</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-800">
              {pendingAuthorizations.length} Waiting
            </span>
          </div>

          <p className="text-[10.5px] text-[#94A3B8]">
            Applicant must authorize and sign before Athena submits online forms.
          </p>

          {pendingAuthorizations.length === 0 ? (
            <div className="p-3 bg-[#141619] rounded-lg border border-[#2D3139] text-center text-xs text-[#94A3B8]">
              No applications waiting for signature.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {pendingAuthorizations.map((opp) => (
                <div
                  key={opp.id}
                  className="p-2.5 bg-[#141619] rounded-lg border border-red-900/40 hover:border-red-600 transition-all space-y-1.5"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-xs text-white line-clamp-1">
                      {opp.title}
                    </span>
                    <span className="text-[9px] font-mono text-[#F97316] font-bold">
                      {opp.atsScore}%
                    </span>
                  </div>
                  <div className="text-[10.5px] text-[#94A3B8] line-clamp-1">{opp.company}</div>
                  <button
                    onClick={() => onOpenSignOff(opp)}
                    className="w-full mt-1 py-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[11px] rounded font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Sign-Off & Authorize</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Aggregator Streams Status */}
        <div className="space-y-2 pt-2 border-t border-[#2D3139]">
          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider flex items-center justify-between">
            <span>Aggregator Ingress</span>
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between py-1 px-2 rounded bg-[#141619]">
              <span className="text-white">LinkedIn Malawi & Global</span>
              <span className="text-emerald-400 font-mono text-[10px]">SYNCED</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 rounded bg-[#141619]">
              <span className="text-white">Upwork Enterprise</span>
              <span className="text-emerald-400 font-mono text-[10px]">SYNCED</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 rounded bg-[#141619]">
              <span className="text-white">ReliefWeb / UN Malawi</span>
              <span className="text-emerald-400 font-mono text-[10px]">SYNCED</span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 rounded bg-[#141619]">
              <span className="text-white">Devex Southern Africa</span>
              <span className="text-emerald-400 font-mono text-[10px]">SYNCED</span>
            </div>
          </div>
        </div>

        {/* n8n Webhook Status Pill */}
        <div className="p-3 bg-[#141619] rounded-lg border border-[#2D3139] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-white">
              <Workflow className="w-3.5 h-3.5 text-[#F97316]" />
              <span>n8n Pipeline Hook</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <p className="text-[10px] text-[#94A3B8] font-mono truncate">
            {settings.n8nWebhookUrl}
          </p>
        </div>
      </div>

      {/* Footer Security Badge */}
      <div className="p-3 border-t border-[#2D3139] bg-[#141619] flex items-center justify-between text-[10px] text-[#64748B]">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Human Protected
        </span>
        <span className="font-mono">ATHENA v2.4</span>
      </div>
    </aside>
  );
};
