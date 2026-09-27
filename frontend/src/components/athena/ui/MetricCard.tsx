import React from 'react';
import { TrendingUp, TrendingDown, Minus, Search, Award, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/athena/utils';

/**
 * MetricCard — AI Studio v2.4.0 Exact Specification
 * 
 * 5 specific metric types with exact labels:
 * 1. Discovered (Search icon, brand orange tint)
 * 2. ATS ≥90% (Award icon, critical/emerald tint)
 * 3. ATS 80-89% (AlertTriangle icon, flagged/amber tint)
 * 4. Sign-Off Pending (ShieldCheck icon, signoff/red tint)
 * 5. Submitted (CheckCircle2 icon, submitted/emerald tint)
 * 
 * Background tint per metric type using semantic tint utilities from index.css
 * Monospace values, font-brand for labels
 */

export type MetricVariant = 
  | 'discovered' 
  | 'ats-critical' 
  | 'ats-flagged' 
  | 'signoff' 
  | 'submitted';

const METRIC_SPECS: Record<MetricVariant, {
  label: string;
  icon: React.ReactNode;
  tintClass: string;
  iconBgClass: string;
  iconColorClass: string;
  textColorClass: string;
  accentBarClass: string;
}> = {
  discovered: {
    label: 'Discovered',
    icon: <Search className="w-5 h-5" aria-hidden="true" />,
    tintClass: 'tint-job',       // Job position tint (blue family)
    iconBgClass: 'bg-brand-orange/15',
    iconColorClass: 'text-brand-orange',
    textColorClass: 'text-ink',
    accentBarClass: 'bg-brand-orange',
  },
  'ats-critical': {
    label: 'ATS ≥90%',
    icon: <Award className="w-5 h-5" aria-hidden="true" />,
    tintClass: 'tint-critical',  // Critical match tint (emerald/orange)
    iconBgClass: 'bg-[var(--color-tint-critical-border)]/20',
    iconColorClass: 'text-[var(--color-tint-critical-text)]',
    textColorClass: 'text-ink',
    accentBarClass: 'bg-[var(--color-tint-critical-border)]',
  },
  'ats-flagged': {
    label: 'ATS 80-89%',
    icon: <AlertTriangle className="w-5 h-5" aria-hidden="true" />,
    tintClass: 'tint-flagged',   // Flagged review tint (amber)
    iconBgClass: 'bg-[var(--color-tint-flagged-border)]/20',
    iconColorClass: 'text-[var(--color-tint-flagged-text)]',
    textColorClass: 'text-ink',
    accentBarClass: 'bg-[var(--color-tint-flagged-border)]',
  },
  signoff: {
    label: 'Sign-Off Pending',
    icon: <ShieldCheck className="w-5 h-5" aria-hidden="true" />,
    tintClass: 'tint-signoff',   // Human sign-off tint (red)
    iconBgClass: 'bg-[var(--color-tint-signoff-border)]/20',
    iconColorClass: 'text-[var(--color-tint-signoff-text)]',
    textColorClass: 'text-ink',
    accentBarClass: 'bg-[var(--color-tint-signoff-border)]',
  },
  submitted: {
    label: 'Submitted',
    icon: <CheckCircle2 className="w-5 h-5" aria-hidden="true" />,
    tintClass: 'tint-submitted', // Submitted/verified tint (emerald)
    iconBgClass: 'bg-[var(--color-tint-submitted-border)]/20',
    iconColorClass: 'text-[var(--color-tint-submitted-text)]',
    textColorClass: 'text-ink',
    accentBarClass: 'bg-[var(--color-tint-submitted-border)]',
  },
};

export type MetricCardSize = 'default' | 'large';

interface MetricCardProps {
  variant: MetricVariant;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendLabel?: string;
  size?: MetricCardSize;
  onClick?: () => void;
  className?: string;
  'data-testid'?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  variant,
  value,
  subtitle,
  trend = 'stable',
  trendLabel,
  size = 'default',
  onClick,
  className,
  'data-testid': testId,
}) => {
  const spec = METRIC_SPECS[variant];
  const { label, icon, tintClass, iconBgClass, iconColorClass, textColorClass, accentBarClass } = spec;

  const trendIcon = trend === 'up' ? (
    <TrendingUp className="w-4 h-4 text-success-emerald" aria-hidden="true" />
  ) : trend === 'down' ? (
    <TrendingDown className="w-4 h-4 text-signoff-red" aria-hidden="true" />
  ) : (
    <Minus className="w-4 h-4 text-text-secondary" aria-hidden="true" />
  );

  const defaultTrendLabel = trend === 'up' ? 'Increase' : trend === 'down' ? 'Decrease' : 'Stable';
  const effectiveTrendLabel = trendLabel || defaultTrendLabel;

  const isLarge = size === 'large';
  const paddingClass = isLarge ? 'p-5 sm:p-6' : 'p-4 sm:p-5';
  const titleSizeClass = isLarge ? 'text-xs' : 'text-[11px]';
  const valueSizeClass = isLarge ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl';
  const subtitleSizeClass = isLarge ? 'text-lg' : 'text-sm';
  const trendSizeClass = isLarge ? 'text-sm' : 'text-xs';
  const accentBarHeight = isLarge ? 'h-1.5' : 'h-1';

  const Component = onClick ? 'button' : 'article';
  const componentProps = onClick
    ? {
        onClick,
        className: cn(
          'relative',
          paddingClass,
          'rounded-xl',
          'border',
          'transition-all',
          'duration-200',
          'tactile',
          tintClass,
          'hover:shadow-md',
          'focus:outline-none',
          'focus:ring-2',
          'focus:ring-brand-orange',
          'focus:ring-offset-2',
          className
        ),
        'aria-label': `View ${label} details`,
        type: 'button' as const,
      }
    : {
        className: cn(
          'relative',
          paddingClass,
          'rounded-xl',
          'border',
          'transition-all',
          'duration-200',
          tintClass,
          'hover:shadow-md',
          className
        ),
      };

  return (
    <Component
      data-testid={testId || `metric-card-${variant}`}
      data-variant={variant}
      {...componentProps}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                'p-2 rounded-lg flex-shrink-0',
                iconBgClass,
                iconColorClass
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
            <h2 className={cn('font-brand font-bold tracking-widest uppercase truncate', titleSizeClass)} style={{ color: 'var(--color-text-primary)' }}>
              {label}
            </h2>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span 
              className={cn('readout font-black font-mono tabular-nums', valueSizeClass)} 
              style={{ color: 'var(--color-text-primary)' }}
              data-testid="metric-value"
            >
              {value}
            </span>
            {subtitle && (
              <span className={cn('font-body font-medium', subtitleSizeClass)} style={{ color: 'var(--color-text-secondary)' }}>
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {trendIcon}
          <span className={cn('font-body font-medium', trendSizeClass)} style={{ color: 'var(--color-text-secondary)' }} aria-label={`${effectiveTrendLabel} trend`}>
            {effectiveTrendLabel}
          </span>
        </div>
      </div>

      {/* Accent bar at bottom */}
      <div
        className={cn('absolute bottom-0 left-0 right-0 rounded-b-xl', accentBarClass, accentBarHeight)}
        aria-hidden="true"
      />
    </Component>
  );
};

// Array of all 5 metric variants for easy iteration
export const ALL_METRIC_VARIANTS: MetricVariant[] = [
  'discovered',
  'ats-critical',
  'ats-flagged',
  'signoff',
  'submitted',
];

// Helper to get variant from pipeline status
export function getMetricVariantFromStatus(status: string): MetricVariant {
  switch (status) {
    case 'discovered':
      return 'discovered';
    case 'scored':
    case 'matched':
      // Would need ATS score to differentiate critical vs flagged
      return 'ats-critical';
    case 'awaiting_signoff':
    case 'flagged':
      return 'signoff';
    case 'submitted':
    case 'applied':
      return 'submitted';
    default:
      return 'discovered';
  }
}

export default MetricCard;