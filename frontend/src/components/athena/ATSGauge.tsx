import React from 'react';
import {
  RadialBarChart,
  RadialBar,
  Cell,
} from 'recharts';
import { cn } from '@/lib/athena/utils';
import type { MatchTier } from '@/lib/athena/types';

type GaugeTier = 'critical' | 'flagged' | 'standard';

/**
 * Call sites pass either the gauge's own tiers (from ATS thresholds) or a
 * `MatchTier` from `Job.match_tier` / `Opportunity.match_tier`. Normalise both
 * here so consumers don't need per-call-site conversions.
 */
const toGaugeTier = (tier: GaugeTier | MatchTier): GaugeTier => {
  switch (tier) {
    case 'excellent':
    case 'critical':
      return 'critical';
    case 'good':
    case 'flagged':
      return 'flagged';
    default: // fair | poor | standard
      return 'standard';
  }
};

interface ATSGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
  tier?: GaugeTier | MatchTier;
}

const TIER_COLORS = {
  critical: '#10B981',    // emerald - ≥90%
  flagged: '#FFA928',     // amber LED - 80-89%
  standard: '#64748B',    // slate - <80%
} as const;

const TIER_LABELS = {
  critical: 'Critical Match',
  flagged: 'Flagged Review',
  standard: 'Standard',
} as const;

const tierGlow = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `drop-shadow(0 0 4px rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0.35))`;
};

export const ATSGauge: React.FC<ATSGaugeProps> = ({
  score,
  size = 80,
  strokeWidth = 8,
  showLabel = true,
  label = 'ATS Score',
  className,
  tier,
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  
  // Determine tier from score if not provided
  const effectiveTier = tier
    ? toGaugeTier(tier)
    : (clampedScore >= 90 ? 'critical' : clampedScore >= 80 ? 'flagged' : 'standard');
  const color = TIER_COLORS[effectiveTier];
  const tierLabel = TIER_LABELS[effectiveTier];

  const data = [
    { name: 'Score', value: clampedScore },
    { name: 'Remaining', value: 100 - clampedScore },
  ];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div style={{ width: size, height: size }}>
        <RadialBarChart
          width={size}
          height={size}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          data={data}
        >
          <RadialBar
            cx="50%"
            cy="50%"
            background={{ fill: '#2A2F38' }}
            dataKey="Remaining"
            strokeWidth={strokeWidth}
            stroke="#2A2F38"
            fill="none"
            cornerRadius={strokeWidth / 2}
          />
          <RadialBar
            cx="50%"
            cy="50%"
            dataKey="Score"
            strokeWidth={strokeWidth}
            stroke={color}
            fill="none"
            cornerRadius={strokeWidth / 2}
            style={{ filter: tierGlow(color) }}
          >
            <Cell fill={color} />
          </RadialBar>
        </RadialBarChart>
        <div
          className="absolute flex flex-col items-center justify-center pointer-events-none"
          style={{
            width: size,
            height: size,
            marginTop: -size,
          }}
        >
          <span className="font-brand font-bold text-ink" style={{ fontSize: size * 0.22 }}>
            {clampedScore}
          </span>
          {showLabel && tierLabel && (
            <span className="font-body font-medium text-text-secondary" style={{ fontSize: size * 0.1 }}>
              {tierLabel}
            </span>
          )}
        </div>
      </div>

      {showLabel && !tierLabel && (
        <span className="font-body text-xs font-medium text-text-secondary text-center">
          {label}
        </span>
      )}
    </div>
  );
};

// Mini gauge for inline use
export const MiniATSGauge: React.FC<{
  score: number;
  size?: number;
  className?: string;
  tier?: 'critical' | 'flagged' | 'standard';
}> = ({ score, size = 40, className, tier }) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const effectiveTier = tier || (clampedScore >= 90 ? 'critical' : clampedScore >= 80 ? 'flagged' : 'standard');
  const color = TIER_COLORS[effectiveTier];

  const circumference = 2 * Math.PI * (size / 2 - 3);
  const strokeDashoffset = circumference * (1 - clampedScore / 100);

  return (
    <div className={cn('relative inline-flex', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 3}
          stroke="#2A2F38"
          strokeWidth={3}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 3}
          stroke={color}
          strokeWidth={3}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{ filter: tierGlow(color) }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="font-brand font-bold text-ink" style={{ fontSize: size * 0.25 }}>
          {clampedScore}
        </span>
      </div>
    </div>
  );
};

// Horizontal progress gauge
export const HorizontalATSGauge: React.FC<{
  score: number;
  width?: number;
  height?: number;
  showScore?: boolean;
  className?: string;
  tier?: 'critical' | 'flagged' | 'standard';
}> = ({ score, width = 200, height = 8, showScore = true, className, tier }) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const effectiveTier = tier || (clampedScore >= 90 ? 'critical' : clampedScore >= 80 ? 'flagged' : 'standard');
  const color = TIER_COLORS[effectiveTier];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex-1" style={{ width, height, filter: tierGlow(color) }}>
        <div
          className="rounded-full overflow-hidden"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#2A2F38',
          }}
        >
          <div
            className="rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${clampedScore}%`,
              height: '100%',
              backgroundColor: color,
            }}
          />
        </div>
      </div>
      {showScore && (
        <span className="font-brand font-bold text-ink whitespace-nowrap" style={{ fontSize: '14px' }}>
          {clampedScore}%
        </span>
      )}
    </div>
  );
};