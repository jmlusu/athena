import React, { useState, useCallback, useMemo } from 'react';
import { Search, Filter, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { PipelineColumn, KANBAN_STAGES } from './PipelineColumn';
import { cn, formatRelativeTime } from '@/lib/athena/utils';
import type { Job, JobStatus } from '@/lib/athena/types';

interface PipelineKanbanBoardProps {
  jobs: Job[];
  onJobClick: (job: Job) => void;
  onJobStatusChange: (jobId: string, newStatus: JobStatus) => Promise<void>;
  onDragStart?: (job: Job) => void;
  className?: string;
}

// Searchable fields for the search filter
const SEARCH_FIELDS: Array<keyof Job> = ['title', 'company', 'location', 'source', 'job_type'];

const STAGE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Stages' },
  { value: 'new', label: 'Discovered' },
  { value: 'fetched', label: 'ATS Evaluated' },
  { value: 'matched', label: 'Tailored / Ready' },
  { value: 'scored', label: 'Awaiting Sign-Off' },
  { value: 'applied', label: 'Submitted' },
  { value: 'interview', label: 'Interview & Award' },
  { value: 'offer', label: 'Offer' },
] as const;

type StageFilterValue = typeof STAGE_FILTER_OPTIONS[number]['value'];

export const PipelineKanbanBoard: React.FC<PipelineKanbanBoardProps> = ({
  jobs,
  onJobClick,
  onJobStatusChange,
  onDragStart,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilterValue>('all');
  const [draggedJob, setDraggedJob] = useState<Job | null>(null);
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);

  // Flagged jobs are those with ATS score 80-89% (flagged review) or status 'flagged'
  const isJobFlagged = (job: Job) => job.status === 'flagged' || ((job.ats_score || 0) >= 80 && (job.ats_score || 0) < 90);

  // Filter jobs based on search, stage, and flagged status
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = SEARCH_FIELDS.some((field) => {
          const value = job[field];
          return typeof value === 'string' && value.toLowerCase().includes(query);
        });
        if (!matchesSearch) return false;
      }

      // Stage filter
      if (stageFilter !== 'all' && job.status !== stageFilter) {
        return false;
      }

      // Flagged filter
      if (showOnlyFlagged && !isJobFlagged(job)) {
        return false;
      }

      return true;
    });
  }, [jobs, searchQuery, stageFilter, showOnlyFlagged]);

  // Group filtered jobs by status
  const jobsByStatus = useMemo(() => {
    const grouped: Record<JobStatus, Job[]> = {
      new: [],
      fetched: [],
      matched: [],
      scored: [],
      applied: [],
      flagged: [],
      interview: [],
      offer: [],
      rejected: [],
      archived: [],
    };

    filteredJobs.forEach((job) => {
      grouped[job.status].push(job);
    });

    return grouped;
  }, [filteredJobs]);

  const handleDragStart = useCallback((job: Job) => {
    setDraggedJob(job);
    onDragStart?.(job);
  }, [onDragStart]);

  const handleDragOver = useCallback((e: React.DragEvent, targetStatus: JobStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetStatus: JobStatus) => {
    e.preventDefault();
    if (!draggedJob || draggedJob.status === targetStatus) {
      setDraggedJob(null);
      return;
    }

    try {
      await onJobStatusChange(draggedJob.id, targetStatus);
    } catch (error) {
      console.error('Failed to update job status:', error);
    } finally {
      setDraggedJob(null);
    }
  }, [draggedJob, onJobStatusChange]);

  const handleStageFilterClick = (value: StageFilterValue) => {
    setStageFilter(value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
    setShowOnlyFlagged(false);
  };

  const hasActiveFilters = searchQuery || stageFilter !== 'all' || showOnlyFlagged;

  // Calculate total jobs per stage for the header pills
  const stageTotals = useMemo(() => {
    const totals: Record<JobStatus, number> = {
      new: 0,
      fetched: 0,
      matched: 0,
      scored: 0,
      applied: 0,
      flagged: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      archived: 0,
    };
    jobs.forEach((job) => {
      totals[job.status]++;
    });
    return totals;
  }, [jobs]);

  return (
    <div className={cn('bg-surface-white raised border border-slate rounded-xl overflow-hidden flex flex-col h-full', className)}>
      {/* Board Header */}
      <div className="px-4 py-3 border-b border-slate flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-heading font-bold text-lg text-ink">Job Pipeline</h2>

          {/* Stage filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Filter by pipeline stage">
            {STAGE_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStageFilterClick(option.value)}
                className={cn(
                  'tactile px-3 py-1.5 rounded-full text-[11px] font-bold font-mono uppercase tracking-wider transition-all',
                  stageFilter === option.value
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'bg-surface-muted text-text-secondary hover:bg-brand-orange/10 hover:text-brand-orange border border-slate'
                )}
                aria-pressed={stageFilter === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Flagged toggle */}
          <label className="flex items-center gap-2 tactile cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyFlagged}
              onChange={(e) => setShowOnlyFlagged(e.target.checked)}
              className="w-4 h-4 rounded border-slate text-brand-orange focus:ring-brand-orange"
              aria-label="Show only flagged jobs"
            />
            <span className="font-body text-xs font-medium text-text-secondary">Flagged only</span>
          </label>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, company, location..."
              className="input-chassis pl-10 pr-9 py-1.5 w-56 sm:w-72 text-sm text-ink placeholder:text-text-subtle focus:ring-2 focus:ring-brand-orange"
              aria-label="Search jobs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-subtle hover:text-text-secondary tactile"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="tactile px-3 py-1.5 text-xs font-bold text-brand-orange hover:bg-brand-orange/10 rounded-lg border border-brand-orange/30 transition-all"
            >
              <Filter className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active filters summary */}
      {(searchQuery || stageFilter !== 'all') && (
        <div className="px-4 py-2 border-b border-slate bg-surface-muted flex items-center gap-2 flex-wrap text-xs">
          <span className="font-body text-text-secondary">Active filters:</span>
          {searchQuery && (
            <span className="badge-job px-2 py-0.5 flex items-center gap-1">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="tactile p-0.5" aria-label="Remove search filter">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {stageFilter !== 'all' && (
            <span className="badge-flagged px-2 py-0.5 flex items-center gap-1">
              Stage: {STAGE_FILTER_OPTIONS.find(o => o.value === stageFilter)?.label}
              <button onClick={() => setStageFilter('all')} className="tactile p-0.5" aria-label="Remove stage filter">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {showOnlyFlagged && (
            <span className="badge-signoff px-2 py-0.5 flex items-center gap-1">
              Flagged only
              <button onClick={() => setShowOnlyFlagged(false)} className="tactile p-0.5" aria-label="Remove flagged filter">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Pipeline Columns */}
      <div className="flex-1 min-h-0 overflow-x-auto pb-4" role="region" aria-label="Job pipeline kanban board">
        <div className="flex gap-4 min-w-max p-4" style={{ minWidth: KANBAN_STAGES.length * 340 }}>
          {KANBAN_STAGES.map((stage) => {
            const stageJobs = jobsByStatus[stage.status] || [];
            const totalInStage = stageTotals[stage.status] || 0;

            return (
              <PipelineColumn
                key={stage.status}
                status={stage.status}
                title={stage.title}
                jobs={stageJobs}
                onJobClick={onJobClick}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDraggingOver={draggedJob !== null && draggedJob.status !== stage.status}
              />
            );
          })}
        </div>
      </div>

      {/* Empty state when no jobs match filters */}
      {filteredJobs.length === 0 && jobs.length > 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Search className="w-12 h-12 mx-auto text-text-subtle mb-3" aria-hidden="true" />
            <p className="font-body text-text-secondary">
              {searchQuery
                ? `No jobs found matching "${searchQuery}"`
                : `No jobs in ${STAGE_FILTER_OPTIONS.find(o => o.value === stageFilter)?.label.toLowerCase()}`}
            </p>
            <p className="font-body text-sm text-text-subtle mt-1">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 tactile px-4 py-2 bg-brand-orange text-white font-bold text-sm rounded-lg hover:bg-brand-orange-hover transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineKanbanBoard;