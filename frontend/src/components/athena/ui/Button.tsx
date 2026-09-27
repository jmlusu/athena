import React from 'react';
import { cn } from '@/lib/athena/utils';

/**
 * Button — AI Studio v2.4.0 Exact Specification
 * 
 * Variants:
 * - Primary: Chassis surface dark #18181B (bg-surface-dark-inset)
 * - Accent: Orange #F97316 hover #EA580C (bg-brand-orange / bg-brand-orange-hover)
 * - Danger: Sign-off red #DC2626 hover #B91C1C (bg-signoff-red / bg-signoff-red-hover)
 * - LinkedIn: Blue #0A66C2 hover #004182 (bg-linkedin-blue / bg-linkedin-blue-dark)
 * - Success: Emerald #10B981 hover #059669 (bg-success-emerald / bg-success-emerald-dark)
 * - Ghost: Transparent background
 * - Outline: Transparent with border
 * 
 * Sizes:
 * - sm: px-2.5 py-1 text-[11px]
 * - md: px-3.5 py-2 text-xs
 * - lg: px-5 py-2.5 text-xs font-bold
 * 
 * Tactile press: translateY(1px) using .tactile class from index.css
 * 
 * Border radius: rounded-lg (8px)
 */

export type ButtonVariant = 
  | 'primary' 
  | 'accent' 
  | 'danger' 
  | 'linkedin' 
  | 'success' 
  | 'ghost' 
  | 'outline';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  'data-testid'?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-surface-dark-inset text-white hover:bg-[#0d0d0f]',
  accent: 'bg-brand-orange text-white hover:bg-brand-orange-hover',
  danger: 'bg-signoff-red text-white hover:bg-signoff-red-hover',
  linkedin: 'bg-linkedin-blue text-white hover:bg-linkedin-blue-dark',
  success: 'bg-success-emerald text-white hover:bg-success-emerald-dark',
  ghost: 'bg-transparent text-text-primary hover:bg-surface-muted',
  outline: 'bg-transparent border border-slate text-text-primary hover:bg-surface-muted hover:border-slate-medium',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-[11px]',
  md: 'px-3.5 py-2 text-xs',
  lg: 'px-5 py-2.5 text-xs font-bold',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const variantClass = VARIANT_CLASSES[variant];
    const sizeClass = SIZE_CLASSES[size];

    const effectiveDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        data-testid={testId}
        data-variant={variant}
        data-size={size}
        disabled={effectiveDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'font-body font-medium',
          'rounded-lg',
          'border',
          'border-transparent',
          'transition-all',
          'duration-120',
          'ease-out',
          'tactile',
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-brand-orange',
          'focus-visible:ring-offset-2',
          'disabled:opacity-50',
          'disabled:cursor-not-allowed',
          'disabled:transform-none',
          variantClass,
          sizeClass,
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
            <span className="truncate">{children}</span>
            {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Pre-configured button variants for common use cases
export const PrimaryButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="primary" {...props} />
);
PrimaryButton.displayName = 'PrimaryButton';

export const AccentButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="accent" {...props} />
);
AccentButton.displayName = 'AccentButton';

export const DangerButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="danger" {...props} />
);
DangerButton.displayName = 'DangerButton';

export const LinkedInButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="linkedin" {...props} />
);
LinkedInButton.displayName = 'LinkedInButton';

export const SuccessButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="success" {...props} />
);
SuccessButton.displayName = 'SuccessButton';

export const GhostButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="ghost" {...props} />
);
GhostButton.displayName = 'GhostButton';

export const OutlineButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="outline" {...props} />
);
OutlineButton.displayName = 'OutlineButton';

// Icon button (square, for toolbars)
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  'aria-label': string;
  'data-testid'?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'ghost',
      size = 'md',
      'aria-label': ariaLabel,
      className,
      disabled,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const variantClass = VARIANT_CLASSES[variant];
    
    // Icon buttons are square
    const sizeMap = {
      sm: 'w-8 h-8',
      md: 'w-9 h-9',
      lg: 'w-10 h-10',
    };

    return (
      <button
        ref={ref}
        data-testid={testId}
        data-variant={variant}
        data-size={size}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center justify-center',
          'rounded-lg',
          'border',
          'border-transparent',
          'transition-all',
          'duration-120',
          'ease-out',
          'tactile',
          'focus-visible:outline-none',
          'focus-visible:ring-2',
          'focus-visible:ring-brand-orange',
          'focus-visible:ring-offset-2',
          'disabled:opacity-50',
          'disabled:cursor-not-allowed',
          'disabled:transform-none',
          variantClass,
          sizeMap[size],
          className
        )}
        {...props}
      >
        <span className="flex-shrink-0" aria-hidden="true">{icon}</span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Button group for grouped actions
export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
  ariaLabel?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  'data-testid': testId,
  ariaLabel,
}) => (
  <div
    data-testid={testId || 'button-group'}
    className={cn('inline-flex items-center gap-2', className)}
    role="group"
    aria-label={ariaLabel}
  >
    {children}
  </div>
);

export default Button;