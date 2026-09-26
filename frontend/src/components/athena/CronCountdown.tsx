import React from "react";
import { Clock, RotateCw, Zap } from "lucide-react";

interface CronCountdownProps {
  jobSecondsRemaining: number;
  consultancySecondsRemaining: number;
  lastJobRun: string;
  onTriggerNow: () => void;
}

const formatSeconds = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const CronCountdown: React.FC<CronCountdownProps> = ({
  jobSecondsRemaining,
  consultancySecondsRemaining,
  lastJobRun,
  onTriggerNow,
}) => {
  const jobProgress = Math.max(5, ((14400 - jobSecondsRemaining) / 14400) * 100);
  const consultancyProgress = Math.max(5, ((14400 - consultancySecondsRemaining) / 14400) * 100);

  return (
    <div className="p-4 bg-card border border-border rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>4-Hour Cron Crawlers</span>
        </div>
        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
          Active (q=4h)
        </span>
      </div>

      {/* Job crawler */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted">Job Search (4h)</span>
          <span className="font-mono font-semibold text-orange-500">{formatSeconds(jobSecondsRemaining)}</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-1000"
            style={{ width: `${jobProgress}%` }}
          />
        </div>
      </div>

      {/* Consultancy crawler */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted">Consultancy (4h)</span>
          <span className="font-mono font-semibold text-red-500">{formatSeconds(consultancySecondsRemaining)}</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-danger transition-all duration-1000"
            style={{ width: `${consultancyProgress}%` }}
          />
        </div>
      </div>

      {/* Manual trigger */}
      <button
        onClick={onTriggerNow}
        className="w-full flex items-center justify-center gap-2 py-2 bg-muted hover:bg-border text-text text-xs rounded-lg font-medium transition-colors border border-border"
      >
        <RotateCw className="w-3 h-3 text-accent" />
        <span>Execute 4h Cycle Now</span>
      </button>

      <div className="text-center text-[10px] text-subtle font-mono">
        Last sync: {lastJobRun}
      </div>
    </div>
  );
};