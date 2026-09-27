import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/athena/utils';

/**
 * Modal — AI Studio v2.4.0 Exact Specification
 * 
 * - rounded-2xl (16px radius)
 * - Backdrop blur
 * - Fade-in 200ms, scale from 0.98
 * - Focus trap
 * - ESC to close
 * - Portal rendering
 * 
 * Uses CSS classes from index.css:
 * - .modal-overlay (backdrop with blur)
 * - .modal-container (modal with animations)
 */

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  'data-testid'?: string;
  // Optional footer actions
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  'data-testid': testId,
  footer,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap implementation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!closeOnEscape && event.key !== 'Tab') return;

    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'Tab' && contentRef.current) {
      const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [closeOnEscape, onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  // Setup and cleanup
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      // Focus the first focusable element or close button
      setTimeout(() => {
        if (contentRef.current) {
          const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else if (showCloseButton && overlayRef.current) {
            // Focus close button if no other focusable elements
            const closeButton = overlayRef.current.querySelector('button[aria-label="Close modal"]');
            (closeButton as HTMLElement)?.focus();
          }
        }
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      
      // Restore focus to previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown, showCloseButton]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
      data-testid={testId || 'modal-overlay'}
    >
      <div
        ref={contentRef}
        className={cn(
          'modal-container',
          'bg-surface-white',
          'overflow-hidden',
          SIZE_CLASSES[size],
          className
        )}
        data-testid={testId ? `${testId}-content` : 'modal-content'}
      >
        {(title || showCloseButton) && (
          <header className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="font-heading text-lg font-bold text-ink"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="font-body text-sm text-text-secondary mt-1"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 p-1.5 rounded-lg text-text-secondary hover:text-ink hover:bg-surface-muted transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </header>
        )}

        <div className="p-5 sm:p-6" data-testid={testId ? `${testId}-body` : 'modal-body'}>
          {children}
        </div>

        {footer && (
          <footer className="flex items-center justify-end gap-3 p-5 sm:p-6 border-t border-slate bg-surface-muted/50">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );

  // Render via portal to document body
  return createPortal(modalContent, document.body);
};

// Confirmation modal variant
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'accent';
  isLoading?: boolean;
  'data-testid'?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
  'data-testid': testId,
}) => {
  const variantButtonMap = {
    danger: 'danger' as const,
    primary: 'primary' as const,
    accent: 'accent' as const,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      data-testid={testId || 'confirm-modal'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-ghost btn-md"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn('btn btn-md', `btn-${variantButtonMap[variant]}`)}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="font-body text-body text-text-secondary">{message}</p>
    </Modal>
  );
};

// Form modal with built-in form handling
interface FormModalProps extends Omit<ModalProps, 'children' | 'footer'> {
  onSubmit: (data: FormData) => Promise<void> | void;
  children: (register: (name: string) => React.InputHTMLAttributes<HTMLInputElement>) => React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  children,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isLoading = false,
  size = 'md',
  'data-testid': testId,
  ...modalProps
}) => {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      data-testid={testId}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-ghost btn-md"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            form={testId ? `${testId}-form` : undefined}
            disabled={isLoading}
            className="btn btn-accent btn-md"
          >
            {isLoading ? 'Saving...' : submitLabel}
          </button>
        </>
      }
      {...modalProps}
    >
      <form onSubmit={handleSubmit} id={testId ? `${testId}-form` : undefined} className="space-y-4">
        {children(() => ({}))}
      </form>
    </Modal>
  );
};

export default Modal;