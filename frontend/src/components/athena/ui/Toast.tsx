import React, { useEffect, useCallback, createContext, useContext, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/athena/utils';

/**
 * Toast — AI Studio v2.4.0 Exact Specification
 * 
 * - Top-right position
 * - Slide-in from top, 300ms animation
 * - Auto-dismiss 5s, manual dismiss
 * - Variants: info (amber), success (emerald), error (red)
 * - Uses CSS classes from index.css: .toast, .toast-success, .toast-error, .toast-info
 */

export type ToastVariant = 'info' | 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  'data-testid'?: string;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, options?: Partial<Toast>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast container props
interface ToastContainerProps {
  className?: string;
  'data-testid'?: string;
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const POSITION_CLASSES: Record<string, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

const VARIANT_ICONS: Record<ToastVariant, React.ReactNode> = {
  info: <Info className="w-5 h-5 text-amber-led flex-shrink-0" aria-hidden="true" />,
  success: <CheckCircle2 className="w-5 h-5 text-success-emerald flex-shrink-0" aria-hidden="true" />,
  error: <AlertCircle className="w-5 h-5 text-signoff-red flex-shrink-0" aria-hidden="true" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-led flex-shrink-0" aria-hidden="true" />,
};

const VARIANT_TOAST_CLASSES: Record<ToastVariant, string> = {
  info: 'toast toast-info',
  success: 'toast toast-success',
  error: 'toast toast-error',
  warning: 'toast toast-info', // Use info styling for warning
};

// Individual Toast component
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const { id, message, variant, duration = 5000, action, 'data-testid': testId } = toast;
  const variantClass = VARIANT_TOAST_CLASSES[variant];
  const icon = VARIANT_ICONS[variant];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onDismiss(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  return (
    <div
      data-testid={testId || `toast-${id}`}
      data-variant={variant}
      className={cn(
        variantClass,
        'animate-slide-in-from-top',
        'min-w-[300px]',
        'max-w-md'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-white">{message}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {action && (
            <button
              type="button"
              onClick={() => {
                action.onClick();
                onDismiss(id);
              }}
              className="font-body text-xs font-medium text-brand-orange hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 rounded"
            >
              {action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDismiss(id)}
            className="flex-shrink-0 p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Container - manages multiple toasts
export const ToastContainer: React.FC<ToastContainerProps> = ({
  className,
  'data-testid': testId,
  maxToasts = 5,
  position = 'top-right',
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info', options: Partial<Toast> = {}) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      id,
      message,
      variant,
      duration: options.duration ?? 5000,
      action: options.action,
      'data-testid': options['data-testid'],
    };

    setToasts(prev => {
      const updated = [newToast, ...prev].slice(0, maxToasts);
      return updated;
    });

    return id;
  }, [maxToasts]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue = useMemo<ToastContextValue>(() => ({
    toast: addToast,
    dismiss,
    dismissAll,
  }), [addToast, dismiss, dismissAll]);

  const positionClass = POSITION_CLASSES[position];

  return (
    <ToastContext.Provider value={contextValue}>
      <div
        data-testid={testId || 'toast-container'}
        className={cn(
          'fixed z-[800] flex flex-col gap-2 pointer-events-none',
          positionClass,
          className
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto w-full">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Toast Provider - wrapper for app-level toast management
interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  position?: ToastContainerProps['position'];
  'data-testid'?: string;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
  position = 'top-right',
  'data-testid': testId,
}) => {
  return (
    <ToastContext.Provider value={useMemo(() => ({
      toast: () => '',
      dismiss: () => {},
      dismissAll: () => {},
    }), [])}>
      {children}
      <ToastContainer maxToasts={maxToasts} position={position} data-testid={testId} />
    </ToastContext.Provider>
  );
};

// Hook for programmatic toast access (alternative to context)
export const createToastHelpers = () => {
  let containerRef: { current: { addToast: (message: string, variant: ToastVariant, options?: Partial<Toast>) => string } | null } = { current: null };
  
  return {
    setContainerRef: (ref: typeof containerRef) => { containerRef = ref; },
    toast: (message: string, variant: ToastVariant = 'info', options?: Partial<Toast>) => {
      return containerRef.current?.addToast(message, variant, options) || '';
    },
  };
};

// Convenience functions for common toast types
export const toastHelpers = {
  info: (message: string, options?: Partial<Toast>) => ({ message, variant: 'info' as ToastVariant, ...options }),
  success: (message: string, options?: Partial<Toast>) => ({ message, variant: 'success' as ToastVariant, ...options }),
  error: (message: string, options?: Partial<Toast>) => ({ message, variant: 'error' as ToastVariant, ...options }),
  warning: (message: string, options?: Partial<Toast>) => ({ message, variant: 'warning' as ToastVariant, ...options }),
};

export default ToastContainer;