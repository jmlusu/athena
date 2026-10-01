import React, { useState } from "react";
import { Zap, Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, Workflow, RotateCw, Clock } from "lucide-react";
import type { AutomationSettings } from "@/lib/athena/types";

interface AutomationControlsProps {
  settings: AutomationSettings;
  onUpdateSettings: (settings: Partial<AutomationSettings>) => void;
  pendingCount: number;
  onTriggerCron?: () => void;
}

export const AutomationControls: React.FC<AutomationControlsProps> = ({
  settings,
  onUpdateSettings,
  pendingCount,
  onTriggerCron,
}) => {
  const [autoApplyThreshold, setAutoApplyThreshold] = useState(settings.autoCreateThreshold);
  const [flagMin, setFlagMin] = useState(settings.flagThresholdMin);
  const [flagMax, setFlagMax] = useState(settings.flagThresholdMax);

  const handleSaveThresholds = () => {
    onUpdateSettings({
      autoCreateThreshold: autoApplyThreshold,
      flagThresholdMin: flagMin,
      flagThresholdMax: flagMax,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-chassis-frame border border-chassis rounded-xl" data-testid="automation-controls">
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

        {/* ATS >= 90 Auto-Create - Editable Threshold */}
        <div className="p-3 bg-chassis-base border border-chassis rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
              <span className="text-xs font-semibold text-chassis-primary">ATS ≥ 90 Auto-Generate</span>
            </div>
            <input
              type="number"
              min="0"
              max="100"
              value={autoApplyThreshold}
              onChange={(e) => setAutoApplyThreshold(parseInt(e.target.value) || 0)}
              className="w-16 text-right text-xs font-mono bg-chassis-raised border border-chassis rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-orange"
              data-testid="auto-apply-threshold"
            />
          </div>
          <div className="flex items-center gap-2">
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
            <span className="text-[10px] text-chassis-muted">Enabled</span>
          </div>
          <p className="text-[10px] text-chassis-muted leading-tight">
            Auto-creates tailored resume + cover letter for jobs, and executive summary + proposal for consultancies.
          </p>
        </div>

        {/* ATS 80-89 Auto-Flag - Editable Thresholds */}
        <div className="p-3 bg-chassis-base border border-chassis rounded-lg space-y-2" data-testid="flag-thresholds">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-led" />
              <span className="text-xs font-semibold text-chassis-primary">ATS 80-89 Auto-Flag</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono">
              <input
                type="number"
                min="0"
                max="100"
                value={flagMin}
                onChange={(e) => setFlagMin(parseInt(e.target.value) || 0)}
                className="w-14 text-center text-xs font-mono bg-chassis-raised border border-chassis rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                data-testid="flag-threshold-min"
              />
              <span>–</span>
              <input
                type="number"
                min="0"
                max="100"
                value={flagMax}
                onChange={(e) => setFlagMax(parseInt(e.target.value) || 0)}
                className="w-14 text-center text-xs font-mono bg-chassis-raised border border-chassis rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                data-testid="flag-threshold-max"
              />
            </div>
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
          <p className="text-[10px] text-chassis-muted leading-tight">
            Auto-flags opportunities with 80-89 ATS match into high-priority review queue.
          </p>
        </div>

        {/* Save Automation Settings */}
        <div className="p-3 bg-chassis-base border border-chassis rounded-lg space-y-2">
          <button data-testid="save-automation" onClick={handleSaveThresholds} className="w-full py-1 rounded-md text-xs font-medium text-brand-orange hover:bg-brand-orange/20 hover:text-brand-orange transition-colors tactile">
            Save
          </button>
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
                className="peer opacity-0 absolute inset-0 z-10 w-8 h-4 cursor-pointer"
              />
              <div className="w-8 h-4 bg-chassis-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-orange" />
            </label>
          </div>
          <p className="text-[10px] text-chassis-muted leading-tight">
            Purges AI telltales ("delve", "spearhead", "testament to") ensuring organic human professional voice.
          </p>
        </div>
      </div>

      {/* 4-Hour Cron Countdown */}
      <div data-testid="cron-countdown" className="p-4 bg-chassis-base sunken space-y-4 rounded-xl border border-chassis">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-chassis-primary">
            <Clock className="w-4 h-4 text-amber-led" />
            <span>4-Hour Cron Crawlers</span>
          </div>
          <span className="text-[10px] font-mono bg-success-emerald/20 text-success-emerald px-2 py-0.5 rounded border border-success-emerald/30">
            Active (q=4h)
          </span>
        </div>

        {/* Job crawler */}
        <div className="space-y-1.5" data-testid="cron-jobs">
          <div className="flex justify-between text-xs">
            <span className="text-chassis-muted">Job Search (4h)</span>
            <span className="font-mono font-semibold text-amber-led" data-testid="cron-countdown-text">3h 45m</span>
          </div>
          <div className="w-full h-2 bg-chassis-raised rounded-full overflow-hidden">
            <div className="h-full bg-amber-led glow-amber transition-all duration-1000" style={{ width: '45%' }} />
          </div>
        </div>

        {/* Consultancy crawler */}
        <div className="space-y-1.5" data-testid="cron-consultancy">
          <div className="flex justify-between text-xs">
            <span className="text-chassis-muted">Consultancy (4h)</span>
            <span className="font-mono font-semibold text-signoff-red">3h 45m</span>
          </div>
          <div className="w-full h-2 bg-chassis-raised rounded-full overflow-hidden">
            <div className="h-full bg-signoff-red glow-amber transition-all duration-1000" style={{ width: '45%' }} />
          </div>
        </div>

        {/* Manual trigger */}
        <button
          onClick={onTriggerCron || (() => {})}
          data-testid="manual-trigger-scrape"
          className="w-full flex items-center justify-center gap-2 py-2 bg-chassis-raised hover:bg-chassis-active text-chassis-primary text-xs rounded-lg font-medium transition-colors border border-chassis tactile"
        >
          <RotateCw className="w-3 h-3 text-amber-led" />
          <span>Execute 4h Cycle Now</span>
        </button>
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
          <div className="p-3 bg-chassis-base rounded-lg border border-signoff-red/40 text-center text-xs text-chassis-muted">
            {pendingCount} {pendingCount === 1 ? "application" : "applications"} waiting for
            applicant sign-off.
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