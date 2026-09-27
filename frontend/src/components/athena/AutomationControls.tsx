import React from "react";
import { Zap, Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, Workflow, ExternalLink } from "lucide-react";

interface AutomationControlsProps {
  settings: {
    autoCreateThreshold: number;
    flagThresholdMin: number;
    flagThresholdMax: number;
    autoCreateResumeCoverLetter: boolean;
    autoCreateProposalExecSummary: boolean;
    dehumanizeEnabled: boolean;
    n8nWebhookUrl: string;
    n8nActive: boolean;
  };
  onUpdateSettings: (settings: Partial<AutomationControlsProps["settings"]>) => void;
  pendingCount: number;
}

export const AutomationControls: React.FC<AutomationControlsProps> = ({
  settings,
  onUpdateSettings,
  pendingCount,
}) => {
  return (
    <div className="space-y-4 p-4 bg-chassis-frame border border-chassis rounded-xl">
      <div className="flex items-center justify-between border-b border-chassis pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-brand-orange" />
          <span className="font-semibold text-xs text-chassis-primary uppercase tracking-wider">
            Autonomous Controls
          </span>
        </div>
        <span className="text-[10px] font-mono bg-brand-orange/20 text-brand-orange px-2 py-0.5 rounded border border-brand-orange/30">
          AUTO-PILOT
        </span>
      </div>

      <div className="space-y-3">
        <div className="text-[11px] font-medium text-chassis-muted uppercase tracking-wider">
          Scoring & Document Triggers
        </div>

        {/* ATS >= 90 Auto-Create */}
        <div className="p-3 bg-chassis-base border border-chassis rounded-lg space-y-2" data-testid="auto-apply-threshold-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              <span className="text-xs font-semibold text-chassis-primary">ATS ≥ 90 Auto-Generate</span>
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
              <div className="w-8 h-4 bg-chassis-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-orange" />
            </label>
          </div>
          <p className="text-[10px] text-chassis-muted leading-tight">
            Auto-creates tailored resume + cover letter for jobs, and executive summary + proposal for consultancies.
          </p>
        </div>

        {/* ATS 80-89 Auto-Flag */}
        <div className="p-3 bg-chassis-base border border-chassis rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-led" />
              <span className="text-xs font-semibold text-chassis-primary">ATS 80-89 Auto-Flag</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-brand-orange peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all" />
            </label>
          </div>
          <p className="text-[10px] text-chassis-muted leading-tight">
            Auto-flags opportunities with 80-89 ATS match into high-priority review queue.
          </p>
        </div>

        {/* Dehumanizer */}
        <div className="p-3 bg-chassis-base border border-chassis rounded-lg space-y-2" data-testid="dehumanize-toggle-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-led" />
              <span className="text-xs font-semibold text-chassis-primary">Dehumanize AI Voice</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dehumanizeEnabled}
                onChange={(e) => onUpdateSettings({ dehumanizeEnabled: e.target.checked })}
                data-testid="dehumanize-toggle"
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-chassis-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-orange" />
            </label>
          </div>
          <p className="text-[10px] text-chassis-muted leading-tight">
            Purges AI telltales ("delve", "spearhead", "testament to") ensuring organic human professional voice.
          </p>
        </div>
      </div>

      {/* Human Sign-Off Gate */}
      <div className="pt-4 border-t border-chassis space-y-2" data-testid="signoff-queue">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-chassis-primary uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-signoff-red" />
            <span>Human Sign-Off Gate</span>
          </div>
          <span className="text-[10px] font-mono bg-signoff-red/20 text-signoff-red px-1.5 py-0.2 rounded border border-signoff-red/30">
            {pendingCount} Waiting
          </span>
        </div>

        <p className="text-[10px] text-chassis-muted">
          Applicant must authorize and sign before Athena submits online forms.
        </p>

        {pendingCount === 0 ? (
          <div className="p-3 bg-chassis-base rounded-lg border border-chassis text-center text-xs text-chassis-muted">
            No applications waiting for signature.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div className="p-2.5 bg-chassis-base rounded-lg border border-signoff-red/40 space-y-1.5">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-xs text-chassis-primary line-clamp-1">
                  Sample Opportunity Awaiting Sign-Off
                </span>
                <span className="text-[9px] font-mono text-brand-orange font-bold">95%</span>
              </div>
              <div className="text-[10px] text-chassis-muted line-clamp-1">Sample Company</div>
              <button
                className="w-full mt-1 py-1 bg-signoff-red hover:bg-signoff-red-hover text-white text-[11px] rounded font-medium flex items-center justify-center gap-1 transition-colors tactile"
              >
                <span>Sign-Off & Authorize</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Aggregator Status */}
      <div className="pt-4 border-t border-chassis space-y-2" data-testid="aggregator-status">
        <div className="text-[11px] font-semibold text-chassis-muted uppercase tracking-wider flex items-center justify-between">
          <span>Aggregator Ingress</span>
          <span className="w-2 h-2 rounded-full bg-success-emerald animate-pulse-custom" />
        </div>

        <div className="space-y-1 text-xs">
          {[
            { name: "LinkedIn Malawi & Global", status: "SYNCED" },
            { name: "Upwork Enterprise", status: "SYNCED" },
            { name: "ReliefWeb / UN Malawi", status: "SYNCED" },
            { name: "Devex Southern Africa", status: "SYNCED" },
          ].map((source) => (
            <div key={source.name} className="flex items-center justify-between py-1 px-2 rounded bg-chassis-base">
              <span className="text-chassis-primary">{source.name}</span>
              <span className="text-success-emerald font-mono text-[10px]">{source.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* n8n Webhook Status */}
      <div className="p-3 bg-chassis-base rounded-lg border border-chassis space-y-1.5" data-testid="n8n-status-pill">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium text-chassis-primary">
            <Workflow className="w-3.5 h-3.5 text-brand-orange" />
            <span>n8n Pipeline Hook</span>
          </span>
          <span className={`w-2 h-2 rounded-full ${settings.n8nActive ? "bg-success-emerald" : "bg-chassis-border"}`} />
        </div>
        <p className="text-[10px] text-chassis-muted font-mono truncate">{settings.n8nWebhookUrl}</p>
      </div>
    </div>
  );
};