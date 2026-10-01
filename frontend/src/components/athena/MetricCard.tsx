import React from 'react';
import { TrendingUp, TrendingDown, Minus, Search, Award, ShieldCheck, CheckCircle2, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/athena/utils';
import type { MetricCardProps } from '@/lib/athena/types';

const METRIC_ICONS: Record<string, React.ReactNode> = {
  discovered: <Search className="w-5 h-5" />,
  critical: <Award className="w-5 h-5" />,
  flagged: <AlertTriangle className="w-5 h-5" />,
  signoff: <ShieldCheck className="w-5 h-5" />,
  submitted: <CheckCircle2 className="w-5 h-5" />,
  default: <Target className="w-5 h-5" />,
};

const SEMANTIC_VARIANTS = {
  discovered: {
    bg: 'bg-surface-muted',
    border: 'border-slate',
    iconBg: 'bg-brand-orange/15',
    iconColor: 'text-brand-orange',
    textColor: 'text-ink',
    accentBar: 'bg-brand-orange',
  },
  critical: {
    bg: 'bg-[var(--tint-critical-bg)]',
    border: 'border-[var(--color-tint-critical-border)]',
    iconBg: 'bg-[var(--color-tint-critical-border)]/20',
    iconColor: 'text-[var(--color-tint-critical-text)]',
    textColor: 'text-ink',
    accentBar: 'bg-[var(--color-tint-critical-border)]',
  },
  flagged: {
    bg: 'bg-[var(--tint-flagged-bg)]',
    border: 'border-[var(--color-tint-flagged-border)]',
    iconBg: 'bg-[var(--color-tint-flagged-border)]/20',
    iconColor: 'text-[var(--color-tint-flagged-text)]',
    textColor: 'text-ink',
    accentBar: 'bg-[var(--color-tint-flagged-border)]',
  },
  signoff: {
    bg: 'bg-[var(--tint-signoff-bg)]',
    border: 'border-[var(--color-tint-signoff-border)]',
    iconBg: 'bg-[var(--color-tint-signoff-border)]/20',
    iconColor: 'text-[var(--color-tint-signoff-text)]',
    textColor: 'text-ink',
    accentBar: 'bg-[var(--color-tint-signoff-border)]',
  },
  submitted: {
    bg: 'bg-[var(--tint-submitted-bg)]',
    border: 'border-[var(--color-tint-submitted-border)]',
    iconBg: 'bg-[var(--color-tint-submitted-border)]/20',
    iconColor: 'text-[var(--color-tint-submitted-text)]',
    textColor: 'text-ink',
    accentBar: 'bg-[var(--color-tint-submitted-border)]',
  },
  default: {
    bg: 'bg-surface-white',
    border: 'border-slate',
    iconBg: 'bg-brand-orange/15',
    iconColor: 'text-brand-orange',
    textColor: 'text-ink',
    accentBar: 'bg-brand-orange',
  },
} as const;

type SemanticVariant = keyof typeof SEMANTIC_VARIANTS;

interface PipelineMetricCardProps extends Omit<MetricCardProps, 'accentColor'> {
  variant?: SemanticVariant;
  onClick?: () => void;
  trendValue?: string;
}

export const PipelineMetricCard: React.FC<PipelineMetricCardProps> = ({
  title,
  value,
  subtitle,
  trend = 'stable',
  icon: customIcon,
  variant = 'default',
  className,
  onClick,
  trendValue,
}) => {
  const styles = SEMANTIC_VARIANTS[variant] || SEMANTIC_VARIANTS.default;
  const icon = customIcon || METRIC_ICONS[variant] || METRIC_ICONS.default;

  const trendIcon = trend === 'up' ? (
    <TrendingUp className="w-4 h-4 text-success-emerald" aria-hidden="true" />
  ) : trend === 'down' ? (
    <TrendingDown className="w-4 h-4 text-signoff-red" aria-hidden="true" />
  ) : (
    <Minus className="w-4 h-4 text-text-secondary" aria-hidden="true" />
  );

  const trendLabel = trend === 'up' ? 'Increase' : trend === 'down' ? 'Decrease' : 'Stable';

  const Component = onClick ? 'button' : 'article';
  const componentProps = onClick
    ? {
        onClick,
        className: cn(
          'relative p-5 sm:p-6 rounded-xl border transition-all duration-200 tactile',
          styles.bg,
          styles.border,
          'hover:shadow-md',
          'focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2',
          className
        ),
        'aria-label': `View ${title} details`,
      }
    : {
        className: cn(
          'relative p-5 sm:p-6 rounded-xl border transition-all duration-200',
          styles.bg,
          styles.border,
          'hover:shadow-md',
          className
        ),
      };

  return (
    <Component
      data-testid="metric-card"
      data-title={title}
      data-variant={variant}
      {...componentProps}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                'p-2 rounded-lg flex-shrink-0',
                styles.iconBg,
                styles.iconColor
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
            <h2 className="font-body text-xs font-bold tracking-widest uppercase truncate" style={{ color: styles.textColor }}>
              {title}
            </h2>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="readout font-black text-2xl sm:text-3xl font-mono tabular-nums" style={{ color: styles.textColor }} data-testid="metric-value">
              {value}
            </span>
            {subtitle && (
              <span className="font-body text-sm text-text-secondary self-end">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {trendIcon}
          <span className="font-body text-xs font-medium text-text-secondary" aria-label={`${trendLabel} trend`}>
            {trendLabel}
          </span>
          {trendValue && (
            <span className="font-body text-xs font-medium" style={{ color: trend === 'up' ? '#10B981' : trend === 'down' ? '#DC2626' : '#64748B' }}>
              {trendValue}
            </span>
          )}
        </div>
      </div>

      {/* Accent bar */}
      <div
        className={cn('absolute bottom-0 left-0 right-0 h-1 rounded-b-xl', styles.accentBar)}
        aria-hidden="true"
      />
    </Component>
  );
};

// Keep existing MetricCard for backward compatibility but update to new design system
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend = 'stable',
  icon: customIcon,
  accentColor = 'default',
  className,
}) => {
  const variantMap: Record<string, SemanticVariant> = {
    orange: 'critical',
    red: 'signoff',
    emerald: 'submitted',
    amber: 'flagged',
    navy: 'discovered',
    cyan: 'discovered',
    blue: 'discovered',
    purple: 'discovered',
  };
  const variant = variantMap[accentColor] || 'default';

  return <PipelineMetricCard title={title} value={value} subtitle={subtitle} trend={trend} icon={customIcon} variant={variant} className={className} />;
};

// Large metric card for dashboard header
export const MetricCardLarge: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: React.ReactNode;
  variant?: SemanticVariant;
  className?: string;
}> = ({
  title,
  value,
  subtitle,
  description,
  trend = 'stable',
  trendValue,
  icon,
  variant = 'default',
  className,
}) => {
  const styles = SEMANTIC_VARIANTS[variant] || SEMANTIC_VARIANTS.default;

  const trendIcon = trend === 'up' ? (
    <TrendingUp className="w-4 h-4 text-success-emerald" aria-hidden="true" />
  ) : trend === 'down' ? (
    <TrendingDown className="w-4 h-4 text-signoff-red" aria-hidden="true" />
  ) : (
    <Minus className="w-4 h-4 text-text-secondary" aria-hidden="true" />
  );

  return (
    <article
      data-testid="metric-card"
      data-title={title}
      data-variant={variant}
      className={cn(
        'relative p-5 sm:p-6 rounded-xl border transition-all duration-200',
        styles.bg,
        styles.border,
        'hover:shadow-lg',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn('p-3 rounded-xl flex-shrink-0', styles.iconBg, styles.iconColor)}
            aria-hidden="true"
          >
            {icon || <Target className="w-6 h-6" />}
          </span>
          <h2 className="font-body text-xs font-bold tracking-widest uppercase truncate" style={{ color: styles.textColor }}>
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {trendIcon}
          {trendValue && (
            <span className="font-body text-sm font-medium" style={{ color: trend === 'up' ? '#10B981' : trend === 'down' ? '#DC2626' : '#64748B' }}>
              {trendValue}
            </span>
          )}
        </div>
      </div>

      {description && (
        <p className="font-body text-sm text-text-secondary mb-4 max-w-sm">
          {description}
        </p>
      )}
      {!description && <div className="mb-4" />}

      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="readout font-black text-4xl sm:text-5xl font-mono tabular-nums" style={{ color: styles.textColor }} data-testid="metric-value">
          {value}
        </span>
        {subtitle && (
          <span className="font-body text-lg text-text-secondary self-end">
            {subtitle}
          </span>
        )}
      </div>

      <div
        className={cn('absolute bottom-0 left-0 right-0 h-1.5 rounded-b-xl', styles.accentBar)}
        aria-hidden="true"
      />
    </article>
  );
};

// Stat counter for proof stats
export const StatCounter: React.FC<{
  value: number;
  label: string;
  format?: 'plain' | 'comma';
  suffix?: string;
  variant?: SemanticVariant;
  className?: string;
}> = ({ value, label, format = 'comma', suffix, variant = 'default', className }) => {
  const styles = SEMANTIC_VARIANTS[variant] || SEMANTIC_VARIANTS.default;

  const formattedValue = format === 'comma'
    ? value.toLocaleString()
    : String(value);

  return (
    <div className={cn('text-center p-4', className)} data-testid="metric-card" data-label={label}>
      <div className="relative inline-block mb-2">
        <span className={cn('readout font-black text-3xl sm:text-4xl font-mono tabular-nums', styles.textColor)}>
          {formattedValue}
          {suffix && <span className="font-brand font-bold text-xl text-text-secondary ml-1">{suffix}</span>}
        </span>
      </div>
      <p className="font-body text-xs font-bold tracking-widest uppercase text-text-secondary" data-testid="metric-label">
        {label}
      </p>
    </div>
  );
};