import React, { useState } from 'react';
import { Plus, GripVertical, Trash2, Edit, ChevronRight } from 'lucide-react';
import { JobCard } from './JobCard';
import { cn } from '@/lib/athena/utils';
import type { Job, JobStatus, PipelineColumnProps } from '@/lib/athena/types';

const STATUS_COLORS: Record<JobStatus, { chip: string; header: string }> = {
  new: {
    chip: 'bg-ls-red/15 text-ls-red border border-ls-red/40 glow-amber',
    header: 'bg-ls-red/10 border-b border-ls-red/40',
  },
  fetched: {
    chip: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    header: 'bg-blue-500/10 border-b border-blue-500/20',
  },
  matched: {
    chip: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    header: 'bg-purple-500/10 border-b border-purple-500/20',
  },
  scored: {
    chip: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
    header: 'bg-orange-500/10 border-b border-orange-500/20',
  },
  applied: {
    chip: 'bg-red-500/15 text-red-300 border border-red-500/30',
    header: 'bg-red-500/10 border-b border-red-500/20',
  },
  flagged: {
    chip: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    header: 'bg-amber-500/10 border-b border-amber-500/20',
  },
  interview: {
    chip: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    header: 'bg-emerald-500/10 border-b border-emerald-500/20',
  },
  offer: {
    chip: 'bg-green-500/15 text-green-300 border border-green-500/30',
    header: 'bg-green-500/10 border-b border-green-500/20',
  },
  rejected: {
    chip: 'bg-gray-500/15 text-gray-300 border border-gray-500/30',
    header: 'bg-gray-500/10 border-b border-gray-500/20',
  },
  archived: {
    chip: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
    header: 'bg-slate-500/10 border-b border-slate-500/20',
  },
};

const STATUS_LABELS: Record<JobStatus, string> = {
  new: 'New',
  fetched: 'Fetched',
  matched: 'Matched',
  scored: 'Scored',
  applied: 'Applied',
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
  onDragStart,
  onDragOver,
  onDrop,
  isDraggingOver = false,
}) => {
  const colors = STATUS_COLORS[status];
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

    // In a real app, this would call an API
    const newJob: Job = {
      id: `temp-${Date.now()}`,
      source: 'other',
      title: newJobTitle,
      company: 'New Company',
      location: 'Remote',
      job_type: 'full_time',
      description: '',
      requirements: [],
      responsibilities: [],
      keywords: [],
      application_url: '#',
      benefits: [],
      status,
      scraped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {},
    };

    // This would typically be handled by parent state
    console.log('Add job:', newJob);
    setNewJobTitle('');
    setShowAddForm(false);
  };

  return (
    <div
      className={cn(
        'flex flex-col min-w-[320px] max-w-[360px] flex-shrink-0',
        'bg-ls-grey-light/60 rounded-xl border-2 border-white/7 transition-all duration-200',
        isDraggingOver && 'border-ls-red bg-ls-red/5 ring-2 ring-ls-red/20'
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
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider',
              colors.chip
            )}
          >
            {label}
          </span>
          <span className="font-display font-bold text-sm text-ls-navy">
            {title}
          </span>
        </div>
        <span className="readout font-bold text-lg text-ls-grey-dark">
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
              <GripVertical className="w-4 h-4 text-ls-grey-light-text cursor-grab" aria-hidden="true" />
            </div>
          </div>
        ))}

        {/* Empty state / Add job trigger */}
        {(jobs ?? []).length === 0 && !showAddForm && (
          <div role="listitem">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-8 border-2 border-dashed border-white/15 rounded-lg text-ls-grey-dark hover:border-ls-red hover:text-ls-red hover:bg-ls-red/5 transition-all flex flex-col items-center gap-2 tactile disabled:opacity-40"
            >
              <Plus className="w-6 h-6" aria-hidden="true" />
              <span className="font-body text-sm">Add job to {label.toLowerCase()}</span>
            </button>
          </div>
        )}

        {/* Add job form */}
        {showAddForm && (
          <div role="listitem">
            <form onSubmit={handleAddJob} className="p-3 space-y-3 border border-white/7 rounded-lg bg-ls-white raised">
            <input
              type="text"
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
              placeholder="Job title"
              className="w-full px-3 py-2 sunken rounded-lg border border-white/8 text-sm text-ls-navy placeholder:text-ls-grey-light-text focus:ring-2 focus:ring-ls-red"
              autoFocus
              aria-label="Job title"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-ls-red text-[#14161A] font-bold text-sm rounded-lg hover:brightness-110 transition-all tactile disabled:opacity-40"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewJobTitle(''); }}
                className="flex-1 py-2 px-3 border border-white/10 bg-ls-white text-ls-grey-dark font-bold text-sm rounded-lg hover:border-ls-red/40 hover:text-ls-red transition-all tactile disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
            </form>
          </div>
        )}
      </div>

      {/* Column footer actions */}
      <div className="px-4 py-3 border-t border-white/7 flex items-center justify-between">
        <span className="font-body text-xs text-ls-grey-light-text">
          {(jobs ?? []).length} job{(jobs ?? []).length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

// Column header with drag indicator
export const PipelineColumnHeader: React.FC<{
  status: JobStatus;
  title: string;
  count: number;
  onAddClick?: () => void;
}> = ({ status, title, count, onAddClick }) => {
  const colors = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <div className={cn('flex items-center justify-between px-4 py-3', colors.header)}>
      <div className="flex items-center gap-3">
        <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider', colors.chip)}>
          {label}
        </span>
        <span className="font-display font-bold text-sm text-ls-navy">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="readout font-bold text-lg text-ls-grey-dark">{count}</span>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="p-1.5 rounded-lg text-ls-grey-dark hover:text-ls-red hover:bg-ls-red/10 transition-colors tactile disabled:opacity-40"
            aria-label={`Add job to ${label}`}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
