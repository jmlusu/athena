import React from 'react';
import { MapPin, Briefcase, DollarSign, Clock, ExternalLink, ChevronRight, Building2, Globe, Sparkles, AlertTriangle, FileText, PenSquare } from 'lucide-react';
import { MiniATSGauge } from './ATSGauge';
import { cn, formatSalary, formatDate, getJobTypeLabel, getJobSourceLabel } from '@/lib/athena/utils';
import type { Job, JobCardProps } from '@/lib/athena/types';

interface JobCardPropsExtended extends JobCardProps {
  compact?: boolean;
  showActions?: boolean;
  onTailorClick?: (job: Job) => void;
  onFormFiller?: (job: Job) => void;
}

export const JobCard: React.FC<JobCardPropsExtended> = ({
  job,
  onClick,
  matchScore,
  matchTier,
  compact = false,
  showActions = false,
  onTailorClick,
  onFormFiller,
}) => {
  const effectiveMatchScore = matchScore ?? job.match_score;
  const effectiveMatchTier = matchTier ?? job.match_tier;
  
  // Determine ATS tier for styling
  const atsScore = job.ats_score ?? 0;
  const atsTier = atsScore >= 90 ? 'critical' : atsScore >= 80 ? 'flagged' : 'standard';

  // Platform icon
  const getPlatformIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'linkedin': return <Building2 className="w-3 h-3" />;
      case 'upwork': return <Globe className="w-3 h-3" />;
      case 'reliefweb': return <Globe className="w-3 h-3" />;
      case 'corporate': return <Building2 className="w-3 h-3" />;
      case 'devex': return <Globe className="w-3 h-3" />;
      default: return <Globe className="w-3 h-3" />;
    }
  };

  // Category badge
  const isConsultancy = job.job_type === 'consultancy';
  const categoryBadge = isConsultancy 
    ? <span className="badge-consultancy">Consultancy</span>
    : <span className="badge-job">Job</span>;

  return (
    <article
      onClick={onClick}
      data-testid="job-card"
      data-job-id={job.id}
      className={cn(
        'relative group cursor-pointer transition-all duration-200 tactile',
        'bg-surface-white raised border border-slate rounded-xl p-4 sm:p-5',
        'hover:border-brand-orange/40 hover:shadow-md hover:-translate-y-0.5',
        'focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 disabled:opacity-40',
        compact && 'p-3'
      )}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      aria-label={`View job details: ${job.title} at ${job.company}`}
    >
      {/* Top row: Category + Platform badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {categoryBadge}
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider sunken border border-slate text-white">
              {getPlatformIcon(job.source)}
              {getJobSourceLabel(job.source)}
            </span>
          </div>
          <h3 data-testid="job-title" className="font-heading font-bold text-base sm:text-lg text-ink truncate group-hover:text-brand-orange transition-colors">
            {job.title}
          </h3>
        </div>

        {/* ATS Gauge */}
        <div className="flex-shrink-0 ml-3" data-testid="job-ats-score">
          <MiniATSGauge
            score={atsScore}
            size={48}
            tier={atsTier}
          />
        </div>
      </div>

      {/* Company & Meta info row */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-body text-text-secondary mb-3">
        <span data-testid="job-company" className="font-medium text-ink">{job.company}</span>
        <span data-testid="job-location" className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          {job.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
          {getJobTypeLabel(job.job_type)}
        </span>
        <span className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5" aria-hidden="true" />
          {formatSalary(job.salary_range)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          {formatDate(job.posted_date)}
        </span>
      </div>

      {/* Match Score & Status */}
      <div className="flex items-center justify-between gap-3 mb-3 text-xs">
        <span data-testid="job-match-score" className="text-text-secondary">
          {job.match_score !== undefined ? `Match: ${job.match_score}%` : 'Match: —'}
        </span>
        <span data-testid="job-status" className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono bg-surface-muted border border-slate text-text-secondary">
          {job.status}
        </span>
      </div>

      {/* Requirements badges (AI Studio spec) */}
      {(job.requirements && job.requirements.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.requirements.slice(0, 4).map((req, idx) => (
            <span key={idx} className="text-[10px] bg-surface-muted text-text-secondary px-2 py-0.5 rounded border border-slate font-medium">
              {req}
            </span>
          ))}
          {job.requirements.length > 4 && (
            <span className="text-[10px] bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded border border-brand-orange/20 font-medium">
              +{job.requirements.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-subtle">
        <div className="flex items-center gap-2">
          {atsTier === 'critical' && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-success-emerald">
              <Sparkles className="w-3 h-3" />
              Critical Match
            </span>
          )}
          {atsTier === 'flagged' && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-amber-led">
              <AlertTriangle className="w-3 h-3" />
              Flagged Review
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onTailorClick?.(job); }}
              data-testid="tailor-resume-btn"
              className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-colors tactile disabled:opacity-40"
              aria-label="Tailor resume"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onFormFiller?.(job); }}
              data-testid="form-filler-btn"
              className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-colors tactile disabled:opacity-40"
              aria-label="Open form filler"
            >
              <PenSquare className="w-4 h-4" aria-hidden="true" />
            </button>
            <a
              href={job.application_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              data-testid="apply-btn"
              className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-colors tactile disabled:opacity-40"
              aria-label={`Apply on ${getJobSourceLabel(job.source)}`}
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>

      {/* Click hint */}
      {!compact && (
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-5 h-5 text-text-subtle" aria-hidden="true" />
        </div>
      )}
    </article>
  );
};

// Compact job card for list views
export const JobCardCompact: React.FC<JobCardProps & { onApplyClick?: (e: React.MouseEvent) => void; onTailorClick?: (e: React.MouseEvent) => void; showActions?: boolean }> = ({
  job,
  onClick,
  matchScore,
  matchTier,
  onApplyClick,
  onTailorClick,
  showActions = false,
}) => {
  const effectiveMatchScore = matchScore ?? job.match_score;
  const effectiveMatchTier = matchTier ?? job.match_tier;
  const atsScore = job.ats_score ?? 0;
  const atsTier = atsScore >= 90 ? 'critical' : atsScore >= 80 ? 'flagged' : 'standard';

  return (
    <div
      onClick={onClick}
      data-testid="job-card"
      data-job-id={job.id}
      className="group cursor-pointer flex items-center gap-4 p-3 bg-surface-white raised border border-slate rounded-lg hover:border-brand-orange/40 hover:bg-brand-orange/5 transition-all tactile focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 disabled:opacity-40"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      aria-label={`View job: ${job.title} at ${job.company}`}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-lg sunken flex items-center justify-center">
        <span className="font-brand font-bold text-xl text-white">
          {job.company.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 data-testid="job-title" className="font-heading font-bold text-sm text-ink truncate group-hover:text-brand-orange transition-colors">
            {job.title}
          </h4>
          <span className={atsTier === 'critical' ? 'badge-critical' : atsTier === 'flagged' ? 'badge-flagged' : 'badge-muted'}>
            {atsTier === 'critical' ? 'Critical' : atsTier === 'flagged' ? 'Flagged' : 'Standard'}
          </span>
        </div>
        <p data-testid="job-company" className="font-body text-xs text-text-secondary truncate">{job.company}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-text-subtle">
          <span data-testid="job-location" className="flex items-center gap-1">
            <MapPin className="w-3 h-3" aria-hidden="true" />
            {job.location}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" aria-hidden="true" />
            {getJobTypeLabel(job.job_type)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div data-testid="job-ats-score">
          <MiniATSGauge score={atsScore} size={40} tier={atsTier} />
        </div>
        <span data-testid="job-match-score" className="text-[10px] text-text-secondary">
          {job.match_score !== undefined ? `${job.match_score}%` : '—'}
        </span>
        <span data-testid="job-status" className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono bg-surface-muted border border-slate text-text-secondary">
          {job.status}
        </span>
        {(showActions || onTailorClick) && (
          <button
            onClick={onTailorClick}
            data-testid="tailor-resume-btn"
            className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-colors tactile disabled:opacity-40"
            aria-label="Tailor resume"
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        {(showActions || onApplyClick) && (
          <button
            onClick={onApplyClick}
            data-testid="apply-btn"
            className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20 transition-colors tactile disabled:opacity-40"
            aria-label="Apply"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};