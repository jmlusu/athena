import React from 'react';
import { cn } from '@/lib/athena/utils';

/**
 * Badge (StatusPill) — AI Studio v2.4.0 Exact Specification
 * 
 * 7 semantic variants with exact tints:
 * - critical: Critical Match (≥90%) - tint-critical
 * - flagged: Flagged Review (80-89%) - tint-flagged
 * - signoff: Human Sign-Off Required - tint-signoff
 * - submitted: Submitted / Verified - tint-submitted
 * - consultancy: Consultancy Mandate - tint-consultancy
 * - job: Job Position - tint-job
 * - linkedin: LinkedIn Integration - tint-linkedin
 * 
 * Sizes:
 * - micro: 10px mono (text-[10px] font-mono uppercase tracking-wider)
 * - standard: default size
 * - large: larger size for prominent badges
 * 
 * Uses tint utilities: .tint-critical, .tint-flagged, .tint-signoff, 
 * .tint-submitted, .tint-consultancy, .tint-job, .tint-linkedin
 */

export type BadgeVariant = 
  | 'critical' 
  | 'flagged' 
  | 'signoff' 
  | 'submitted' 
  | 'consultancy' 
  | 'job' 
  | 'linkedin';

export type BadgeSize = 'micro' | 'standard' | 'large';

interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  onClick?: () => void;
  'data-testid'?: string;
}

const SIZE_CLASSES: Record<BadgeSize, string> = {
  micro: 'px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider leading-none rounded-md',
  standard: 'px-2.5 py-1 text-xs font-medium rounded-full',
  large: 'px-3 py-1.5 text-sm font-medium rounded-full',
};

const VARIANT_TINT_CLASSES: Record<BadgeVariant, string> = {
  critical: 'tint-critical',
  flagged: 'tint-flagged',
  signoff: 'tint-signoff',
  submitted: 'tint-submitted',
  consultancy: 'tint-consultancy',
  job: 'tint-job',
  linkedin: 'tint-linkedin',
};

const VARIANT_ICONS: Record<BadgeVariant, React.ReactNode> = {
  critical: <span className="w-3 h-3" aria-hidden="true">⬢</span>, // Hexagon for critical
  flagged: <span className="w-3 h-3" aria-hidden="true">⚠</span>,  // Warning for flagged
  signoff: <span className="w-3 h-3" aria-hidden="true">🛡</span>, // Shield for signoff
  submitted: <span className="w-3 h-3" aria-hidden="true">✓</span>, // Check for submitted
  consultancy: <span className="w-3 h-3" aria-hidden="true">📋</span>, // Clipboard for consultancy
  job: <span className="w-3 h-3" aria-hidden="true">💼</span>, // Briefcase for job
  linkedin: <span className="w-3 h-3" aria-hidden="true">🔗</span>, // Link for linkedin
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  size = 'standard',
  className,
  onClick,
  'data-testid': testId,
}) => {
  const tintClass = VARIANT_TINT_CLASSES[variant];
  const sizeClass = SIZE_CLASSES[size];
  const showIcon = size !== 'micro';

  const Component = onClick ? 'button' : 'span';
  const componentProps = onClick
    ? {
        onClick,
        className: cn(
          'inline-flex items-center gap-1.5',
          'transition-all duration-150',
          'tactile',
          'focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2',
          tintClass,
          sizeClass,
          className
        ),
        type: 'button' as const,
        'aria-label': `${children} badge`,
      }
    : {
        className: cn(
          'inline-flex items-center gap-1.5',
          tintClass,
          sizeClass,
          className
        ),
      };

  return (
    <Component
      data-testid={testId || `badge-${variant}`}
      data-variant={variant}
      data-size={size}
      {...componentProps}
    >
      {showIcon && VARIANT_ICONS[variant]}
      <span className="whitespace-nowrap">{children}</span>
    </Component>
  );
};

// StatusPill - alias for Badge with semantic naming for status indicators
export const StatusPill: React.FC<BadgeProps> = Badge;

// Pre-configured status pills for common use cases
export const CriticalMatchPill: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge variant="critical" {...props} />
);

export const FlaggedReviewPill: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge variant="flagged" {...props} />
);

export const SignOffRequiredPill: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge variant="signoff" {...props} />
);

export const SubmittedPill: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge variant="submitted" {...props} />
);

export const ConsultancyPill: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge variant="consultancy" {...props} />
);

export const JobPositionPill: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge variant="job" {...props} />
);

export const LinkedInPill: React.FC<Omit<BadgeProps, 'variant'>> = (props) => (
  <Badge variant="linkedin" {...props} />
);

// Dot indicator for inline status (used in tables, lists)
export interface StatusDotProps {
  variant: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'data-testid'?: string;
}

const DOT_SIZES = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export const StatusDot: React.FC<StatusDotProps> = ({
  variant,
  size = 'md',
  className,
  'data-testid': testId,
}) => {
  const tintClass = VARIANT_TINT_CLASSES[variant];
  const dotSize = DOT_SIZES[size];

  return (
    <span
      data-testid={testId || `status-dot-${variant}`}
      data-variant={variant}
      className={cn(
        'inline-block rounded-full',
        tintClass,
        dotSize,
        className
      )}
      aria-hidden="true"
    />
  );
};

// Badge group for displaying multiple badges
export interface BadgeGroupProps {
  badges: Array<{
    label: string;
    variant: BadgeVariant;
    size?: BadgeSize;
    onClick?: () => void;
  }>;
  maxVisible?: number;
  className?: string;
  'data-testid'?: string;
}

export const BadgeGroup: React.FC<BadgeGroupProps> = ({
  badges,
  maxVisible,
  className,
  'data-testid': testId,
}) => {
  const visibleBadges = maxVisible ? badges.slice(0, maxVisible) : badges;
  const hiddenCount = maxVisible && badges.length > maxVisible ? badges.length - maxVisible : 0;

  return (
    <div
      data-testid={testId || 'badge-group'}
      className={cn('flex flex-wrap gap-1.5', className)}
      role="group"
      aria-label="Status badges"
    >
      {visibleBadges.map((badge, index) => (
        <Badge
          key={`${badge.variant}-${index}`}
          variant={badge.variant}
          size={badge.size}
          onClick={badge.onClick}
        >
          {badge.label}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Badge variant="job" size="micro" className="cursor-default">
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
};

export default Badge;