/**
 * Athena Shared Components - AI Studio v2.4.0
 * 
 * Reusable visual primitives matching AI Studio spec exactly.
 * Export all shared UI components from a single entry point.
 */

// CircularGauge / ATS Gauge
export {
  CircularGauge,
  MiniCircularGauge,
  HorizontalGauge,
} from './CircularGauge';
export type { GaugeSize, GaugeTier } from './CircularGauge';

// MetricCard
export {
  MetricCard,
  ALL_METRIC_VARIANTS,
  getMetricVariantFromStatus,
} from './MetricCard';
export type { MetricVariant, MetricCardSize } from './MetricCard';

// Badge / StatusPill
export {
  Badge,
  StatusPill,
  CriticalMatchPill,
  FlaggedReviewPill,
  SignOffRequiredPill,
  SubmittedPill,
  ConsultancyPill,
  JobPositionPill,
  LinkedInPill,
  StatusDot,
  BadgeGroup,
} from './Badge';
export type { BadgeVariant, BadgeSize, BadgeGroupProps, StatusDotProps } from './Badge';

// Button
export {
  Button,
  PrimaryButton,
  AccentButton,
  DangerButton,
  LinkedInButton,
  SuccessButton,
  GhostButton,
  OutlineButton,
  IconButton,
  ButtonGroup,
} from './Button';
export type { ButtonVariant, ButtonSize, IconButtonProps, ButtonGroupProps } from './Button';

// Modal
export {
  Modal,
  ConfirmModal,
  FormModal,
} from './Modal';
export type { ModalSize, ConfirmModalProps, FormModalProps } from './Modal';

// Toast
export {
  ToastContainer,
  ToastProvider,
  useToast,
  createToastHelpers,
  toastHelpers,
} from './Toast';
export type { Toast, ToastVariant, ToastContainerProps, ToastProviderProps } from './Toast';

// Re-export utilities
export { cn } from '@/lib/athena/utils';