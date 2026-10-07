import React from "react";
import { ATS_CRITICAL_MIN, ATS_FLAGGED_MIN } from "../../lib/athena/metrics-registry";

interface CircularGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  score,
  size = "md",
  showLabel = true,
  label = "ATS Match",
}) => {
  // Dimensions based on size
  const config = {
    sm: { dimension: 48, strokeWidth: 4.5, fontSize: "text-xs", labelSize: "text-[9px]" },
    md: { dimension: 84, strokeWidth: 7, fontSize: "text-lg", labelSize: "text-[10px]" },
    lg: { dimension: 120, strokeWidth: 9, fontSize: "text-2xl", labelSize: "text-xs" },
  }[size];

  const radius = (config.dimension - config.strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Score clamped 0-100
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Color logic
  let strokeColor = "#64748B"; // slate
  let bgBadgeColor = "text-slate-700 bg-slate-100";
  let tierText = "Standard";

  if (clampedScore >= ATS_CRITICAL_MIN) {
    strokeColor = "#F97316"; // Soft Orange / High Match Trigger
    bgBadgeColor = "text-[#EA580C] bg-orange-50";
    tierText = "Priority Auto-Apply (≥90)";
  } else if (clampedScore >= ATS_FLAGGED_MIN) {
    strokeColor = "#D97706"; // Amber / Auto-flagged
    bgBadgeColor = "text-amber-700 bg-amber-50";
    tierText = "Flagged Review (80-89)";
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: config.dimension, height: config.dimension }}>
        <svg className="transform -rotate-90" width={config.dimension} height={config.dimension}>
          {/* Background circle track */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={config.strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={config.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className={`font-bold font-mono tracking-tight text-[#18181B] ${config.fontSize}`}>
            {clampedScore}
          </span>
          {size !== "sm" && (
            <span className="text-[9px] uppercase tracking-wider text-[#64748B] font-medium -mt-0.5">
              ATS
            </span>
          )}
        </div>
      </div>

      {showLabel && size !== "sm" && (
        <div className="mt-1.5 text-center">
          <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${config.labelSize} ${bgBadgeColor}`}>
            {tierText}
          </span>
        </div>
      )}
    </div>
  );
};
