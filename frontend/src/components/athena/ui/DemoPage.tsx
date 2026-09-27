import React, { useState } from 'react';
import {
  CircularGauge,
  MiniCircularGauge,
  HorizontalGauge,
  MetricCard,
  ALL_METRIC_VARIANTS,
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
  Modal,
  ConfirmModal,
  ToastContainer,
  useToast,
  toastHelpers,
} from './index';

/**
 * Demo Page for verifying all shared components
 * Run this component to visually verify all variants match DESIGN_SYSTEM.md
 */

// Demo component for CircularGauge variants
const GaugeDemo: React.FC = () => {
  const scores = [95, 87, 72, 100, 80, 65];
  const sizes: ('sm' | 'md' | 'lg')[] = ['sm', 'md', 'lg'];

  return (
    <section className="space-y-8">
      <h2 className="font-heading text-xl font-bold text-ink">CircularGauge / ATS Gauge</h2>
      
      <div className="space-y-6">
        <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">Score Variants (md size)</h3>
        <div className="flex flex-wrap items-center gap-6">
          {scores.map(score => (
            <div key={score} className="flex flex-col items-center gap-2">
              <CircularGauge score={score} size="md" showTierLabel />
              <span className="font-body text-xs text-text-secondary">{score}%</span>
            </div>
          ))}
        </div>

        <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">Size Variants (87% score)</h3>
        <div className="flex items-end gap-8">
          {sizes.map(size => (
            <div key={size} className="flex flex-col items-center gap-2">
              <CircularGauge score={87} size={size} showTierLabel />
              <span className="font-body text-xs text-text-secondary">{size}</span>
            </div>
          ))}
        </div>

        <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">Mini Gauge (inline)</h3>
        <div className="flex items-center gap-4">
          {scores.map(score => (
            <div key={score} className="flex flex-col items-center gap-1">
              <MiniCircularGauge score={score} />
              <span className="font-body text-[10px] text-text-secondary">{score}%</span>
            </div>
          ))}
        </div>

        <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">Horizontal Gauge</h3>
        <div className="space-y-4 w-80">
          {scores.map(score => (
            <HorizontalGauge key={score} score={score} width={300} height={10} showScore />
          ))}
        </div>
      </div>
    </section>
  );
};

// Demo component for MetricCard variants
const MetricCardDemo: React.FC = () => {
  return (
    <section className="space-y-8">
      <h2 className="font-heading text-xl font-bold text-ink">MetricCard (5 Spec Variants)</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {ALL_METRIC_VARIANTS.map(variant => (
          <MetricCard
            key={variant}
            variant={variant}
            value={variant === 'discovered' ? 127 : variant === 'ats-critical' ? 23 : variant === 'ats-flagged' ? 18 : variant === 'signoff' ? 5 : 42}
            subtitle={variant === 'discovered' ? 'this week' : variant === 'submitted' ? 'this month' : undefined}
            trend={variant === 'discovered' ? 'up' : variant === 'submitted' ? 'up' : 'stable'}
            size="default"
          />
        ))}
      </div>

      <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">Large Size</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_METRIC_VARIANTS.slice(0, 3).map(variant => (
          <MetricCard
            key={`${variant}-large`}
            variant={variant}
            value={variant === 'discovered' ? 127 : variant === 'ats-critical' ? 23 : 18}
            subtitle={variant === 'discovered' ? 'opportunities found' : 'matches'}
            trend="up"
            size="large"
          />
        ))}
      </div>
    </section>
  );
};

// Demo component for Badge/StatusPill variants
const BadgeDemo: React.FC = () => {
  const variants: Array<{ variant: 'critical' | 'flagged' | 'signoff' | 'submitted' | 'consultancy' | 'job' | 'linkedin'; label: string }> = [
    { variant: 'critical', label: 'Critical Match' },
    { variant: 'flagged', label: 'Flagged Review' },
    { variant: 'signoff', label: 'Sign-Off Required' },
    { variant: 'submitted', label: 'Submitted' },
    { variant: 'consultancy', label: 'Consultancy' },
    { variant: 'job', label: 'Job Position' },
    { variant: 'linkedin', label: 'LinkedIn' },
  ];

  return (
    <section className="space-y-8">
      <h2 className="font-heading text-xl font-bold text-ink">Badge / StatusPill (7 Semantic Variants)</h2>

      <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">Standard Size</h3>
      <div className="flex flex-wrap gap-3">
        {variants.map(({ variant, label }) => (
          <Badge key={variant} variant={variant}>{label}</Badge>
        ))}
      </div>

      <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">Micro Size (10px mono)</h3>
      <div className="flex flex-wrap gap-2">
        {variants.map(({ variant, label }) => (
          <Badge key={`${variant}-micro`} variant={variant} size="micro">{label}</Badge>
        ))}
      </div>

      <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">Large Size</h3>
      <div className="flex flex-wrap gap-3">
        {variants.map(({ variant, label }) => (
          <Badge key={`${variant}-large`} variant={variant} size="large">{label}</Badge>
        ))}
      </div>

      <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">StatusDot Indicators</h3>
      <div className="flex items-center gap-4 flex-wrap">
        {variants.map(({ variant, label }) => (
          <div key={variant} className="flex items-center gap-2">
            <StatusDot variant={variant} size="md" />
            <span className="font-body text-sm text-text-secondary">{label}</span>
          </div>
        ))}
      </div>

      <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">BadgeGroup (with overflow)</h3>
      <BadgeGroup
        badges={[
          { label: 'Critical Match', variant: 'critical' },
          { label: 'Flagged Review', variant: 'flagged' },
          { label: 'Sign-Off Required', variant: 'signoff' },
          { label: 'Submitted', variant: 'submitted' },
          { label: 'Consultancy', variant: 'consultancy' },
          { label: 'Job Position', variant: 'job' },
          { label: 'LinkedIn', variant: 'linkedin' },
        ]}
        maxVisible={4}
      />
    </section>
  );
};

// Demo component for Button variants
const ButtonDemo: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleClick = (variant: string) => {
    setLoading(variant);
    setTimeout(() => setLoading(null), 1500);
  };

  return (
    <section className="space-y-8">
      <h2 className="font-heading text-xl font-bold text-ink">Button (All Variants & Sizes)</h2>

      <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">Variants (md size)</h3>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => handleClick('primary')}>Primary</Button>
        <Button variant="accent" onClick={() => handleClick('accent')}>Accent</Button>
        <Button variant="danger" onClick={() => handleClick('danger')}>Danger</Button>
        <Button variant="linkedin" onClick={() => handleClick('linkedin')}>LinkedIn</Button>
        <Button variant="success" onClick={() => handleClick('success')}>Success</Button>
        <Button variant="outline" onClick={() => handleClick('outline')}>Outline</Button>
        <Button variant="ghost" onClick={() => handleClick('ghost')}>Ghost</Button>
      </div>

      <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">Sizes (accent variant)</h3>
      <div className="flex items-center gap-3">
        <Button variant="accent" size="sm">Small</Button>
        <Button variant="accent" size="md">Medium</Button>
        <Button variant="accent" size="lg">Large</Button>
      </div>

      <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">Loading States</h3>
      <div className="flex flex-wrap gap-3">
        {(['primary', 'accent', 'danger', 'linkedin', 'success'] as const).map(variant => (
          <Button
            key={variant}
            variant={variant}
            isLoading={loading === variant}
            onClick={() => handleClick(variant)}
          >
            {variant.charAt(0).toUpperCase() + variant.slice(1)}
          </Button>
        ))}
      </div>

      <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">With Icons</h3>
      <div className="flex flex-wrap gap-3">
        <Button variant="accent" leftIcon={<span>➕</span>}>Add New</Button>
        <Button variant="primary" rightIcon={<span>→</span>}>Continue</Button>
        <Button variant="danger" leftIcon={<span>🗑</span>}>Delete</Button>
      </div>

      <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">IconButton</h3>
      <div className="flex items-center gap-2">
        <IconButton variant="ghost" size="sm" icon={<span>⚙</span>} aria-label="Settings" />
        <IconButton variant="ghost" size="md" icon={<span>✏</span>} aria-label="Edit" />
        <IconButton variant="ghost" size="lg" icon={<span>🗑</span>} aria-label="Delete" />
        <IconButton variant="accent" size="md" icon={<span>+</span>} aria-label="Add" />
      </div>

      <h3 className="font-body text-sm font-bold text-text-secondary uppercase tracking-wide">ButtonGroup</h3>
      <ButtonGroup ariaLabel="Pagination">
        <Button variant="ghost" size="sm">← Prev</Button>
        <Button variant="primary" size="sm">1</Button>
        <Button variant="outline" size="sm">2</Button>
        <Button variant="outline" size="sm">3</Button>
        <Button variant="ghost" size="sm">Next →</Button>
      </ButtonGroup>
    </section>
  );
};

// Demo component for Modal
const ModalDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <section className="space-y-8">
      <h2 className="font-heading text-xl font-bold text-ink">Modal</h2>

      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>Open Modal</Button>
        <Button variant="accent" onClick={() => setIsConfirmOpen(true)}>Confirm Dialog</Button>
        <Button variant="outline" onClick={() => setIsFormOpen(true)}>Form Modal</Button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Opportunity Details"
        description="Review the opportunity details before proceeding"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-body text-xs font-bold uppercase tracking-wide text-text-secondary mb-2">Description</h4>
            <p className="font-body text-body text-text-secondary">
              This is a sample modal content area. It can contain any React components including forms, 
              tables, charts, or other interactive elements. The modal uses portal rendering and includes 
              focus trapping, ESC key handling, and backdrop blur.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-surface-muted rounded-lg">
              <p className="font-body text-xs font-bold uppercase tracking-wide text-text-secondary">ATS Score</p>
              <p className="font-brand font-bold text-3xl text-ink">92%</p>
            </div>
            <div className="p-4 bg-surface-muted rounded-lg">
              <p className="font-body text-xs font-bold uppercase tracking-wide text-text-secondary">Match Tier</p>
              <p className="font-brand font-bold text-3xl text-brand-orange">Critical Match</p>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => { setIsConfirmOpen(false); alert('Confirmed!'); }}
        title="Submit Application"
        message="This action will submit your application to the employer. You will not be able to make changes after submission. Are you sure you want to proceed?"
        variant="danger"
        confirmLabel="Submit Application"
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Create New Opportunity"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button variant="accent" type="submit" form="demo-form">Create</Button>
          </>
        }
      >
        <form id="demo-form" className="space-y-4">
          <div>
            <label className="font-body text-xs font-bold uppercase tracking-wide text-text-secondary block mb-1">Title</label>
            <input type="text" className="input w-full" placeholder="Enter opportunity title" />
          </div>
          <div>
            <label className="font-body text-xs font-bold uppercase tracking-wide text-text-secondary block mb-1">Company</label>
            <input type="text" className="input w-full" placeholder="Enter company name" />
          </div>
          <div>
            <label className="font-body text-xs font-bold uppercase tracking-wide text-text-secondary block mb-1">Location</label>
            <input type="text" className="input w-full" placeholder="Enter location" />
          </div>
        </form>
      </Modal>
    </section>
  );
};

// Demo component for Toast
const ToastDemo: React.FC = () => {
  const { toast, dismiss, dismissAll } = useToast();

  return (
    <section className="space-y-8">
      <h2 className="font-heading text-xl font-bold text-ink">Toast Notifications</h2>

      <div className="flex flex-wrap gap-3">
        <Button variant="accent" onClick={() => toast('New opportunity discovered!', 'info')}>
          Info Toast
        </Button>
        <Button variant="success" onClick={() => toast('Application submitted successfully!', 'success')}>
          Success Toast
        </Button>
        <Button variant="danger" onClick={() => toast('Failed to submit application. Please try again.', 'error')}>
          Error Toast
        </Button>
        <Button variant="outline" onClick={() => toast('Warning: Your session expires in 5 minutes.', 'warning')}>
          Warning Toast
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button 
          variant="primary" 
          onClick={() => toast('This toast has an action button', 'info', {
            action: { label: 'Undo', onClick: () => alert('Undo clicked!') }
          })}
        >
          Toast with Action
        </Button>
        <Button variant="ghost" onClick={() => dismissAll()}>
          Dismiss All
        </Button>
      </div>

      <ToastContainer maxToasts={5} position="top-right" />
    </section>
  );
};

// Main Demo Page
export const UIComponentsDemo: React.FC = () => {
  return (
    <div className="p-6 space-y-12 max-w-6xl mx-auto">
      <header className="border-b border-slate pb-6">
        <h1 className="font-heading text-2xl font-bold text-ink">Athena Shared Components Demo</h1>
        <p className="font-body text-body text-text-secondary mt-2">
          Visual verification of all AI Studio v2.4.0 shared components per DESIGN_SYSTEM.md
        </p>
      </header>

      <GaugeDemo />
      <MetricCardDemo />
      <BadgeDemo />
      <ButtonDemo />
      <ModalDemo />
      <ToastDemo />
    </div>
  );
};

export default UIComponentsDemo;