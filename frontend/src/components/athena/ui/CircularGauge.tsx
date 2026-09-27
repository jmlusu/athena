import React from 'react';
import { cn } from '@/lib/athena/utils';

/**
 * CircularGauge (ATS Gauge) — AI Studio v2.4.0 Exact Specification
 * 
 * Threshold colors:
 * - ≥90%: Emerald #10B981 (Critical Match)
 * - 80-89%: Amber #FFA928 (Flagged Review)
 * - <80%: Slate #64748B (Standard)
 * 
 * Size variants: sm (40px), md (80px), lg (120px)
 * Stroke math: C = 2πr, stroke-dashoffset = C * (1 - score/100)
 */

export type GaugeSize = 'sm' | 'md' | 'lg';
export type GaugeTier = 'critical' | 'flagged' | 'standard';

interface CircularGaugeProps {
  score: number;
  size?: GaugeSize;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
  className?: string;
  tier?: GaugeTier;
  showTierLabel?: boolean;
}

const SIZE_MAP: Record<GaugeSize, number> = {
  sm: 40,
  md: 80,
  lg: 120,
};

const TIER_COLORS: Record<GaugeTier, string> = {
  critical: '#10B981',  // Emerald - ≥90%
  flagged: '#FFA928',   // Amber LED - 80-89%
  standard: '#64748B',  // Slate - <80%
} as const;

const TIER_LABELS: Record<GaugeTier, string> = {
  critical: 'Critical Match',
  flagged: 'Flagged Review',
  standard: 'Standard',
} as const;

const TIER_GLOW_COLORS: Record<GaugeTier, string> = {
  critical: 'rgba(16, 185, 129, 0.35)',
  flagged: 'rgba(255, 169, 40, 0.35)',
  standard: 'rgba(100, 116, 139, 0.35)',
} as const;

function getTierFromScore(score: number): GaugeTier {
  if (score >= 90) return 'critical';
  if (score >= 80) return 'flagged';
  return 'standard';
}

function getGlowFilter(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `drop-shadow(0 0 4px rgba(${r}, ${g}, ${b}, 0.35))`;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  score,
  size = 'md',
  strokeWidth = 8,
  showLabel = true,
  label = 'ATS Score',
  className,
  tier,
  showTierLabel = true,
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const pixelSize = SIZE_MAP[size];
  const effectiveTier = tier || getTierFromScore(clampedScore);
  const color = TIER_COLORS[effectiveTier];
  const tierLabel = TIER_LABELS[effectiveTier];
  const glowColor = TIER_GLOW_COLORS[effectiveTier];

  // Stroke math: C = 2πr, stroke-dashoffset = C * (1 - score/100)
  const radius = pixelSize / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedScore / 100);

  const fontSizeValue = Math.max(10, pixelSize * 0.22);
  const fontSizeLabel = Math.max(8, pixelSize * 0.1);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: pixelSize, height: pixelSize }}>
        <svg width={pixelSize} height={pixelSize} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={pixelSize / 2}
            cy={pixelSize / 2}
            r={radius}
            stroke="#2A2F38"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          <circle
            cx={pixelSize / 2}
            cy={pixelSize / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{ filter: getGlowFilter(color) }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <span className="font-brand font-bold text-ink" style={{ fontSize: fontSizeValue }}>
            {clampedScore}
          </span>
          {showLabel && showTierLabel && tierLabel && (
            <span className="font-body font-medium text-text-secondary" style={{ fontSize: fontSizeLabel }}>
              {tierLabel}
            </span>
          )}
        </div>
      </div>

      {showLabel && !showTierLabel && (
        <span className="font-body text-xs font-medium text-text-secondary text-center">
          {label}
        </span>
      )}
    </div>
  );
};

// Mini gauge for inline use (40px fixed)
export const MiniCircularGauge: React.FC<{
  score: number;
  className?: string;
  tier?: GaugeTier;
}> = ({ score, className, tier }) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const effectiveTier = tier || getTierFromScore(clampedScore);
  const color = TIER_COLORS[effectiveTier];
  const pixelSize = 40;
  const strokeWidth = 3;
  const radius = pixelSize / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedScore / 100);

  return (
    <div className={cn('relative inline-flex', className)} style={{ width: pixelSize, height: pixelSize }}>
      <svg width={pixelSize} height={pixelSize} className="transform -rotate-90">
        <circle
          cx={pixelSize / 2}
          cy={pixelSize / 2}
          r={radius}
          stroke="#2A2F38"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={pixelSize / 2}
          cy={pixelSize / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{ filter: getGlowFilter(color) }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="font-brand font-bold text-ink" style={{ fontSize: pixelSize * 0.25 }}>
          {clampedScore}
        </span>
      </div>
    </div>
  );
};

// Horizontal progress gauge variant
export const HorizontalGauge: React.FC<{
  score: number;
  width?: number;
  height?: number;
  showScore?: boolean;
  className?: string;
  tier?: GaugeTier;
}> = ({ score, width = 200, height = 8, showScore = true, className, tier }) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const effectiveTier = tier || getTierFromScore(clampedScore);
  const color = TIER_COLORS[effectiveTier];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex-1" style={{ width, height }}>
        <div
          className="rounded-full overflow-hidden"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#2A2F38',
          }}
        >
          <div
            className="rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${clampedScore}%`,
              height: '100%',
              backgroundColor: color,
              filter: getGlowFilter(color),
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

export default CircularGauge;