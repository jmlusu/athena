import React, { useState } from 'react';
import { Plus, GripVertical, Trash2, Edit, ChevronRight, Clock, MapPin, Briefcase, DollarSign, Building2, Globe, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react';
import { JobCard } from '../JobCard';
import { MiniATSGauge } from '../ATSGauge';
import { cn, formatSalary, formatDate, getJobTypeLabel, getJobSourceLabel } from '@/lib/athena/utils';
import type { JobStatus, PipelineColumnProps } from '@/lib/athena/types';

// AI Studio 6-stage Kanban: Discovered, ATS Evaluated, Tailored / Ready, Awaiting Sign-Off, Submitted, Interview & Award
export const KANBAN_STAGES: Array<{ status: JobStatus; title: string; order: number }> = [
  { status: 'new', title: '1. Discovered', order: 1 },
  { status: 'fetched', title: '2. ATS Evaluated', order: 2 },
  { status: 'matched', title: '3. Tailored / Ready', order: 3 },
  { status: 'scored', title: '4. Awaiting Sign-Off', order: 4 },
  { status: 'applied', title: '5. Submitted', order: 5 },
  { status: 'interview', title: '6. Interview & Award', order: 6 },
];

const STAGE_COLORS: Record<JobStatus, { chip: string; header: string }> = {
  new: {
    chip: 'bg-brand-orange/15 text-brand-orange border border-brand-orange/30',
    header: 'bg-brand-orange/5 border-b border-brand-orange/20',
  },
  fetched: {
    chip: 'bg-linkedin-blue/15 text-linkedin-blue border border-linkedin-blue/30',
    header: 'bg-linkedin-blue/5 border-b border-linkedin-blue/20',
  },
  matched: {
    chip: 'bg-amber-led/15 text-amber-led border border-amber-led/30',
    header: 'bg-amber-led/5 border-b border-amber-led/20',
  },
  scored: {
    chip: 'bg-signoff-red/15 text-signoff-red border border-signoff-red/30',
    header: 'bg-signoff-red/5 border-b border-signoff-red/20',
  },
  applied: {
    chip: 'bg-success-emerald/15 text-success-emerald border border-success-emerald/30',
    header: 'bg-success-emerald/5 border-b border-success-emerald/20',
  },
  interview: {
    chip: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    header: 'bg-emerald-500/5 border-b border-emerald-500/20',
  },
  offer: {
    chip: 'bg-success-emerald/15 text-success-emerald border border-success-emerald/30',
    header: 'bg-success-emerald/5 border-b border-success-emerald/20',
  },
  rejected: {
    chip: 'bg-text-secondary/15 text-text-secondary border border-text-secondary/30',
    header: 'bg-text-secondary/5 border-b border-text-secondary/20',
  },
  archived: {
    chip: 'bg-text-subtle/15 text-text-subtle border border-text-subtle/30',
    header: 'bg-text-subtle/5 border-b border-text-subtle/20',
  },
  flagged: {
    chip: 'bg-amber-led/15 text-amber-led border border-amber-led/30',
    header: 'bg-amber-led/5 border-b border-amber-led/20',
  },
};

const STATUS_LABELS: Record<JobStatus, string> = {
  new: 'Discovered',
  fetched: 'ATS Evaluated',
  matched: 'Tailored / Ready',
  scored: 'Awaiting Sign-Off',
  applied: 'Submitted',
  flagged: 'Flagged',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  archived: 'Archived',
};

interface PipelineColumnInternalProps extends PipelineColumnProps {
  isDraggingOver?: boolean;
}

export const PipelineColumn: React.FC<PipelineColumnInternalProps> = ({
  status,
  title,
  jobs,
  onJobClick,
  onFormFiller,
  onDragStart,
  onDragOver,
  onDrop,
  isDraggingOver = false,
}) => {
  const colors = STAGE_COLORS[status];
  const label = STATUS_LABELS[status];
  const [showAddForm, setShowAddForm] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(e, status);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.(e, status);
  };

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim()) return;

    setNewJobTitle('');
    setShowAddForm(false);
  };

  return (
    <div
      data-testid="pipeline-column"
      data-status={status}
      className={cn(
        'flex flex-col min-w-[320px] max-w-[360px] flex-shrink-0',
        'bg-surface-muted rounded-xl border border-slate transition-all duration-200',
        isDraggingOver && 'border-brand-orange bg-brand-orange/5 ring-2 ring-brand-orange/20'
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 rounded-t-xl',
          colors.header
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider font-mono flex-shrink-0',
              colors.chip
            )}
          >
            {label}
          </span>
          <span className="font-heading font-bold text-sm text-ink truncate">
            {title}
          </span>
        </div>
        <span className="readout font-bold text-lg font-mono tabular-nums text-text-secondary flex-shrink-0 ml-2">
          {(jobs ?? []).length}
        </span>
      </div>

      {/* Job Cards */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[400px]"
        role="list"
        aria-label={`${label} column`}
      >
        {(jobs ?? []).map((job, index) => (
          <div
            key={job.id}
            className="relative"
            role="listitem"
          >
            <JobCard
              job={job}
              onClick={() => onJobClick(job)}
              onFormFiller={onFormFiller}
              compact
              showActions
            />
            {/* Drag handle */}
            <div
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity tactile rounded"
              draggable
              onDragStart={(e) => onDragStart?.(job)}
              tabIndex={0}
              role="button"
              aria-label={`Drag ${job.title} to reorder`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onDragStart?.(job);
                }
              }}
            >
              <GripVertical className="w-4 h-4 text-text-subtle cursor-grab" aria-hidden="true" />
            </div>
          </div>
        ))}

        {/* Empty state / Add job trigger */}
        {(jobs ?? []).length === 0 && !showAddForm && (
          <div role="listitem">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-8 border-2 border-dashed border-slate rounded-lg text-text-secondary hover:border-brand-orange hover:text-brand-orange hover:bg-brand-orange/5 transition-all flex flex-col items-center gap-2 tactile disabled:opacity-40"
            >
              <Plus className="w-6 h-6" aria-hidden="true" />
              <span className="font-body text-sm">Add job to {label.toLowerCase()}</span>
            </button>
          </div>
        )}

        {/* Add job form */}
        {showAddForm && (
          <div role="listitem">
            <form onSubmit={handleAddJob} className="p-3 space-y-3 border border-slate rounded-lg bg-surface-white raised">
            <input
              type="text"
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
              placeholder="Job title"
              className="w-full px-3 py-2 input-chassis rounded-lg text-sm text-chassis-primary placeholder:text-chassis-low focus:ring-2 focus:ring-brand-orange"
              autoFocus
              aria-label="Job title"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-brand-orange text-white font-bold text-sm rounded-lg hover:bg-brand-orange-hover transition-all tactile disabled:opacity-40"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewJobTitle(''); }}
                className="flex-1 py-2 px-3 border border-slate bg-surface-white text-text-secondary font-bold text-sm rounded-lg hover:border-brand-orange/40 hover:text-brand-orange transition-all tactile disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
            </form>
          </div>
        )}
      </div>

      {/* Column footer actions */}
      <div className="px-4 py-3 border-t border-slate flex items-center justify-between">
        <span className="font-body text-xs text-text-secondary">
          {(jobs ?? []).length} job{(jobs ?? []).length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

// Column header with drag indicator (exported for standalone use)
export const PipelineColumnHeader: React.FC<{
  status: JobStatus;
  title: string;
  count: number;
  onAddClick?: () => void;
}> = ({ status, title, count, onAddClick }) => {
  const colors = STAGE_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <div className={cn('flex items-center justify-between px-4 py-3', colors.header)}>
      <div className="flex items-center gap-3">
        <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider font-mono', colors.chip)}>
          {label}
        </span>
        <span className="font-heading font-bold text-sm text-ink">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="readout font-bold text-lg font-mono tabular-nums text-text-secondary">{count}</span>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="p-1.5 rounded-lg text-text-secondary hover:text-brand-orange hover:bg-brand-orange/10 transition-colors tactile disabled:opacity-40"
            aria-label={`Add job to ${label}`}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export { STATUS_LABELS, STAGE_COLORS };