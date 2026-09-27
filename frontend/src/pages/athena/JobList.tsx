import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Filter, X, ChevronDown, Download, Upload, Plus, Loader2, FileText, Globe, MapPin, Building, Briefcase, CheckCircle2, AlertCircle, Clock, Sparkles, Zap } from 'lucide-react';
import { JobCard } from '@/components/athena/JobCard';
import { ATSGauge, MiniATSGauge } from '@/components/athena/ATSGauge';
import { Badge, StatusPill } from '@/components/athena/ui/Badge';
import { Button, PrimaryButton, AccentButton, GhostButton, OutlineButton } from '@/components/athena/ui/Button';
import { cn, formatSalary, formatDate, getJobTypeLabel, getJobSourceLabel, getMatchTierColor, getMatchTierLabel, debounce } from '@/lib/athena/utils';
import { listJobs, triggerScrape, listProfiles, applyToJob, tailorResume, generateCoverLetter, flagJob } from '@/lib/athena/api';
import type { Job, JobFilter, JobSource, JobType, JobStatus, MatchTier, UserProfile } from '@/lib/athena/types';

const JOB_SOURCES: JobSource[] = ['linkedin', 'indeed', 'glassdoor', 'company_career', 'malawi_jobs', 'malawi_work', 'jobs_malawi', 'remote_ok', 'we_work_remotely', 'other'];
const JOB_TYPES: JobType[] = ['full_time', 'part_time', 'contract', 'consultancy', 'freelance', 'internship', 'temporary'];
const JOB_STATUSES: JobStatus[] = ['new', 'fetched', 'matched', 'scored', 'flagged', 'applied', 'interview', 'offer', 'rejected', 'archived'];
const MATCH_TIERS: MatchTier[] = ['excellent', 'good', 'fair', 'poor'];

const SCOPE_OPTIONS = [
  { id: 'all', label: 'All 3 Scopes', icon: Globe, description: 'Lilongwe Local + Remote Hub + International' },
  { id: 'lilongwe-local', label: 'Lilongwe Local (MW)', icon: MapPin, description: 'On-site opportunities in Lilongwe' },
  { id: 'lilongwe-remote', label: 'Lilongwe Remote Hub', icon: Building, description: 'Remote roles from Lilongwe base' },
  { id: 'international-remote', label: 'International Remote', icon: Globe, description: 'Global remote opportunities' },
] as const;

const PLATFORM_PILLS = [
  { id: 'all', label: 'All Platforms' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'upwork', label: 'Upwork' },
  { id: 'reliefweb', label: 'ReliefWeb' },
  { id: 'corporate', label: 'Corporate' },
] as const;

export const JobList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [scrapeSuccess, setScrapeSuccess] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<JobFilter>({
    search: '',
    status: undefined,
    source: undefined,
    job_type: undefined,
    location: '',
    min_ats_score: undefined,
    max_ats_score: undefined,
    min_match_score: undefined,
    max_match_score: undefined,
    limit: pageSize,
    offset: 0,
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedScope, setSelectedScope] = useState<'all' | 'lilongwe-local' | 'lilongwe-remote' | 'international-remote'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'linkedin' | 'upwork' | 'reliefweb' | 'corporate'>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; message: string; url?: string } | null>(null);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setFilters(prev => ({ ...prev, search: value, offset: 0 }));
      setPage(1);
    }, 300),
    []
  );

  // Load jobs
  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listJobs({ ...filters, offset: (page - 1) * pageSize });
      setJobs(response.jobs);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Handle filter changes
  const handleFilterChange = (key: keyof JobFilter, value: JobFilter[keyof JobFilter]) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: undefined,
      source: undefined,
      job_type: undefined,
      location: '',
      min_ats_score: undefined,
      max_ats_score: undefined,
      min_match_score: undefined,
      max_match_score: undefined,
      limit: pageSize,
      offset: 0,
    });
    setPage(1);
    setSelectedScope('all');
    setSelectedPlatform('all');
  };

  const hasActiveFilters = useMemo(() =>
    Object.entries(filters).some(([key, value]) =>
      key !== 'limit' && key !== 'offset' && value !== undefined && value !== '' && value !== null
    ) || selectedScope !== 'all' || selectedPlatform !== 'all', [filters, selectedScope, selectedPlatform]);

  const handleScrape = async () => {
    setScraping(true);
    setScrapeSuccess(false);
    try {
      await triggerScrape({ query: filters.search || 'software engineer', max_results: 50 });
      await loadJobs();
      setScrapeSuccess(true);
      setTimeout(() => setScrapeSuccess(false), 5000);
    } catch (error) {
      console.error('Scrape failed:', error);
    } finally {
      setScraping(false);
    }
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setModalFeedback(null);
    setModalAction(null);
  };

  const closeJobDetail = () => {
    setSelectedJob(null);
    setModalFeedback(null);
    setModalAction(null);
  };

  const resolveProfile = async (): Promise<{ profile: UserProfile; resume?: UserProfile['documents'][number] }> => {
    const list = await listProfiles();
    const profile = list?.[0];
    if (!profile) throw new Error('No user profile found. Create one first.');
    return { profile, resume: profile.documents?.find(d => d.type === 'resume') };
  };

  const updateJobStatus = (jobId: string, status: JobStatus) => {
    setSelectedJob(prev => (prev && prev.id === jobId ? { ...prev, status } : prev));
    setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status } : j)));
  };

  const handleModalAction = async (action: 'apply' | 'tailor' | 'cover' | 'flag') => {
    if (!selectedJob) return;
    setModalAction(action);
    setModalFeedback(null);
    try {
      if (action === 'apply') {
        const { profile, resume } = await resolveProfile();
        if (!resume) throw new Error('No resume found in your profile.');
        await applyToJob(selectedJob.id, { user_profile_id: profile.id, resume_id: resume.id });
        updateJobStatus(selectedJob.id, 'applied');
        setModalFeedback({
          type: 'success',
          message: 'Application recorded — this job is now marked as applied.',
          url: selectedJob.application_url,
        });
        return;
      }

      const { profile } = await resolveProfile();
      if (action === 'tailor') {
        const result = await tailorResume(selectedJob.id, { user_profile_id: profile.id });
        const warnings = result.warnings?.length ? ` Warnings: ${result.warnings.join('; ')}` : '';
        setModalFeedback({ type: 'success', message: `Resume tailored: ${result.filename}.${warnings}` });
        return;
      }
      if (action === 'cover') {
        const result = await generateCoverLetter(selectedJob.id, { user_profile_id: profile.id });
        const warnings = result.warnings?.length ? ` Warnings: ${result.warnings.join('; ')}` : '';
        setModalFeedback({ type: 'success', message: `Cover letter generated: ${result.filename}.${warnings}` });
        return;
      }
      if (action === 'flag') {
        await flagJob(selectedJob.id);
        updateJobStatus(selectedJob.id, 'flagged');
        setModalFeedback({ type: 'success', message: 'Job flagged for review.' });
      }
    } catch (error) {
      console.error(`Job action "${action}" failed:`, error);
      setModalFeedback({
        type: 'error',
        message: error instanceof Error && error.message
          ? error.message
          : 'Something went wrong. Please try again.',
      });
    } finally {
      setModalAction(null);
    }
  };

  // Filter jobs by scope and platform
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Scope filter
      if (selectedScope !== 'all' && job.scope !== selectedScope) {
        return false;
      }
      // Platform filter
      if (selectedPlatform !== 'all') {
        const jobPlatform = job.source.toLowerCase();
        if (selectedPlatform === 'linkedin' && !jobPlatform.includes('linkedin')) return false;
        if (selectedPlatform === 'upwork' && !jobPlatform.includes('upwork')) return false;
        if (selectedPlatform === 'reliefweb' && !jobPlatform.includes('reliefweb')) return false;
        if (selectedPlatform === 'corporate' && !['company_career', 'other'].includes(job.source)) return false;
      }
      return true;
    });
  }, [jobs, selectedScope, selectedPlatform]);

  return (
    <div className="h-full flex flex-col bg-canvas">
      {/* Scrape Success Banner */}
      {scrapeSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-3 animate-slide-in-from-top no-print" data-testid="scrape-success-banner">
          <CheckCircle2 className="w-5 h-5 text-success-emerald flex-shrink-0" aria-hidden="true" />
          <span className="font-body text-sm text-emerald-900 font-medium">Live semantic scrape completed — new opportunities loaded</span>
          <button onClick={() => setScrapeSuccess(false)} className="ml-auto p-1 text-emerald-600 hover:text-emerald-800 tactile" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">Scraper & Discovery</h1>
            <p className="font-body text-sm text-text-secondary mt-1">
              {total ?? 0} job{total !== 1 ? 's' : ''} found • Semantic search across Lilongwe & global feeds
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                showFilters && 'bg-brand-orange/10 text-brand-orange border-brand-orange/30'
              )}
            >
              <Filter className="w-4 h-4" aria-hidden="true" />
              <span className="font-body font-medium text-sm">Filters</span>
              {hasActiveFilters && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-orange text-white">
                  {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== null).length + (selectedScope !== 'all' ? 1 : 0) + (selectedPlatform !== 'all' ? 1 : 0)}
                </span>
              )}
            </Button>
            <AccentButton
              onClick={handleScrape}
              disabled={scraping}
              size="md"
            >
              <Loader2 className={cn('w-4 h-4', scraping && 'animate-spin')} aria-hidden="true" />
              <span className="font-body font-medium text-sm">Run Live Semantic Scrape</span>
              <Zap className="w-4 h-4" aria-hidden="true" />
            </AccentButton>
            <OutlineButton size="md">
              <Download className="w-4 h-4" aria-hidden="true" />
              <span className="font-body font-medium text-sm">Export</span>
            </OutlineButton>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4" data-testid="job-search">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-placeholder" aria-hidden="true" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder="Search by title, company, description, keywords..."
            className="w-full pl-12 pr-4 py-3 bg-surface-white border border-slate rounded-lg text-sm text-ink placeholder:text-text-placeholder focus:ring-2 focus:ring-brand-orange focus:border-transparent sunken"
            aria-label="Search jobs"
          />
          {filters.search && (
            <button
              onClick={() => handleFilterChange('search', '')}
              className="tactile rounded-full absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-placeholder hover:text-brand-orange"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scope Selector Cards (4 cards, not sidebar pills) */}
        <div className="mb-4" role="group" aria-label="Target scopes">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-body text-xs font-bold uppercase tracking-wider text-text-secondary">Target Scopes</h4>
            <span className="font-mono text-[10px] text-brand-orange">Lilongwe / Global</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SCOPE_OPTIONS.map(({ id, label, icon: Icon, description }) => {
              const isActive = selectedScope === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedScope(id)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all tactile relative overflow-hidden',
                    isActive
                      ? 'bg-brand-orange/10 border-brand-orange shadow-md'
                      : 'bg-surface-white border-slate hover:border-brand-orange/40 hover:shadow-lg'
                  )}
                  aria-pressed={isActive}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      isActive
                        ? 'bg-brand-orange text-white'
                        : 'bg-surface-muted text-text-secondary'
                    )}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-ink truncate">{label}</div>
                      <div className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">{description}</div>
                    </div>
                  </div>
                  {isActive && (
                    <div className="absolute inset-0 bg-brand-orange/5 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Platform Tag Pills */}
        <div className="mb-4" role="group" aria-label="Platform filters">
          <div className="flex flex-wrap gap-2">
            {PLATFORM_PILLS.map(({ id, label }) => {
              const isActive = selectedPlatform === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedPlatform(id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium font-mono uppercase tracking-wider transition-all tactile',
                    isActive
                      ? 'bg-brand-orange text-white shadow-sm'
                      : 'bg-surface-muted text-text-secondary hover:bg-brand-orange/10 hover:text-brand-orange border border-slate'
                  )}
                  aria-pressed={isActive}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filters Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Active filters">
            {(Object.entries(filters) as [keyof JobFilter, JobFilter[keyof JobFilter]][])
              .filter(([key, value]) => key !== 'limit' && key !== 'offset' && value !== undefined && value !== '' && value !== null)
              .map(([key, value]) => (
                <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full tint-job text-sm font-medium">
                  {key.replace(/_/g, ' ')}: {String(value)}
                  <button
                    onClick={() => handleFilterChange(key, undefined)}
                    className="tactile rounded-md hover:text-brand-orange/70"
                    aria-label={`Remove ${key} filter`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            {selectedScope !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full tint-job text-sm font-medium">
                Scope: {SCOPE_OPTIONS.find(o => o.id === selectedScope)?.label}
                <button
                  onClick={() => setSelectedScope('all')}
                  className="tactile rounded-md hover:text-brand-orange/70"
                  aria-label="Remove scope filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {selectedPlatform !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full tint-job text-sm font-medium">
                Platform: {PLATFORM_PILLS.find(o => o.id === selectedPlatform)?.label}
                <button
                  onClick={() => setSelectedPlatform('all')}
                  className="tactile rounded-md hover:text-brand-orange/70"
                  aria-label="Remove platform filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-surface-white raised border border-slate rounded-xl p-5 mb-6 animate-slide-in-from-top" role="region" aria-label="Advanced filters" data-testid="filter-panel">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="font-body text-xs font-bold tracking-wider uppercase text-text-secondary block mb-1.5">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 bg-surface-white border border-slate rounded-lg text-sm text-ink focus:ring-2 focus:ring-brand-orange focus:border-transparent sunken"
                >
                  <option value="">All statuses</option>
                  {JOB_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>

              <div>
                <label className="font-body text-xs font-bold tracking-wider uppercase text-text-secondary block mb-1.5">Job Type</label>
                <select
                  value={filters.job_type || ''}
                  onChange={(e) => handleFilterChange('job_type', e.target.value as JobType || undefined)}
                  className="w-full px-3 py-2 bg-surface-white border border-slate rounded-lg text-sm text-ink focus:ring-2 focus:ring-brand-orange focus:border-transparent sunken"
                >
                  <option value="">All types</option>
                  {JOB_TYPES.map(t => <option key={t} value={t}>{getJobTypeLabel(t)}</option>)}
                </select>
              </div>

              <div>
                <label className="font-body text-xs font-bold tracking-wider uppercase text-text-secondary block mb-1.5">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="e.g., Lilongwe, Remote"
                  className="w-full px-3 py-2 bg-surface-white border border-slate rounded-lg text-sm text-ink placeholder:text-text-placeholder focus:ring-2 focus:ring-brand-orange focus:border-transparent sunken"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="font-body text-xs font-bold tracking-wider uppercase text-text-secondary block mb-1.5">ATS Score Range</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.min_ats_score || ''}
                    onChange={(e) => handleFilterChange('min_ats_score', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Min"
                    className="w-full px-3 py-2 bg-surface-white border border-slate rounded-lg text-sm text-ink placeholder:text-text-placeholder focus:ring-2 focus:ring-brand-orange focus:border-transparent sunken"
                    aria-label="Minimum ATS score"
                  />
                  <span className="text-text-placeholder">–</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.max_ats_score || ''}
                    onChange={(e) => handleFilterChange('max_ats_score', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Max"
                    className="w-full px-3 py-2 bg-surface-white border border-slate rounded-lg text-sm text-ink placeholder:text-text-placeholder focus:ring-2 focus:ring-brand-orange focus:border-transparent sunken"
                    aria-label="Maximum ATS score"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="font-body text-xs font-bold tracking-wider uppercase text-text-secondary block mb-1.5">Match Score Range</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.min_match_score || ''}
                    onChange={(e) => handleFilterChange('min_match_score', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Min"
                    className="w-full px-3 py-2 bg-surface-white border border-slate rounded-lg text-sm text-ink placeholder:text-text-placeholder focus:ring-2 focus:ring-brand-orange focus:border-transparent sunken"
                    aria-label="Minimum match score"
                  />
                  <span className="text-text-placeholder">–</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.max_match_score || ''}
                    onChange={(e) => handleFilterChange('max_match_score', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Max"
                    className="w-full px-3 py-2 bg-surface-white border border-slate rounded-lg text-sm text-ink placeholder:text-text-placeholder focus:ring-2 focus:ring-brand-orange focus:border-transparent sunken"
                    aria-label="Maximum match score"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Job Results */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-orange" aria-hidden="true" />
            <span className="ml-3 font-body text-text-secondary">Loading opportunities...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-surface-muted rounded-full flex items-center justify-center mb-4 border border-slate">
              <Search className="w-8 h-8 text-text-placeholder" aria-hidden="true" />
            </div>
            <h3 className="font-heading font-bold text-lg text-ink mb-2">No opportunities found</h3>
            <p className="font-body text-sm text-text-secondary max-w-sm">
              Try adjusting your filters or search terms, or run a live semantic scrape.
            </p>
            <AccentButton
              onClick={handleScrape}
              disabled={scraping}
              className="mt-4"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Run Live Semantic Scrape
            </AccentButton>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate">
              <p className="font-body text-sm text-text-secondary">
                Showing <span className="font-bold text-ink">{((page - 1) * pageSize) + 1}</span>–
                <span className="font-bold text-ink">{Math.min(page * pageSize, total ?? 0)}</span>
                of <span className="font-bold text-ink">{(total ?? 0).toLocaleString()}</span> opportunities
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => { /* pageSize change would need state */ }}
                  className="px-3 py-1.5 bg-surface-white border border-slate rounded-lg text-sm text-ink focus:ring-2 focus:ring-brand-orange focus:border-transparent sunken"
                  aria-label="Items per page"
                >
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>

            {/* Job Listings Table */}
            <div className="bg-surface-white raised border border-slate rounded-xl overflow-hidden" role="list" aria-label="Job listings">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_80px] px-4 py-3 border-b border-slate bg-surface-muted text-xs font-bold uppercase tracking-wider text-text-secondary font-mono">
                <span>Opportunity</span>
                <span className="text-center">Platform</span>
                <span className="text-center">ATS</span>
                <span className="text-center">Compensation</span>
                <span className="text-center">Posted</span>
                <span className="text-center">Actions</span>
              </div>
              {/* Table Rows */}
              <div className="divide-y divide-slate">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="grid grid-cols-[1fr_auto_auto_auto_auto_80px] px-4 py-3 items-center gap-4 hover:bg-surface-muted transition-colors group"
                    role="listitem"
                    onClick={() => handleJobClick(job)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Opportunity Column */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono border',
                          job.category === 'consultancy' ? 'tint-consultancy' : 'tint-job'
                        )}>
                          {job.category.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono bg-surface-muted border border-slate text-text-secondary">
                          {getJobSourceLabel(job.source)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-ink truncate pr-4">{job.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary flex-wrap">
                        <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {job.company}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                      </div>
                    </div>

                    {/* Platform Column */}
                    <div className="text-center">
                      <Badge variant="job" size="micro">{getJobSourceLabel(job.source)}</Badge>
                    </div>

                    {/* ATS Column */}
                    <div className="text-center">
                      <MiniATSGauge score={job.ats_score || 0} size={48} tier={job.match_tier} />
                    </div>

                    {/* Compensation Column */}
                    <div className="text-center font-mono text-xs text-text-secondary">
                      {formatSalary(job.salary_range)}
                    </div>

                    {/* Posted Date Column */}
                    <div className="text-center font-mono text-[10px] text-text-secondary">
                      {formatDate(job.posted_date)}
                    </div>

                    {/* Actions Column */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <GhostButton size="sm" onClick={(e) => { e.stopPropagation(); handleModalAction('tailor'); }} aria-label="Tailor resume">
                          <FileText className="w-3.5 h-3.5" />
                        </GhostButton>
                        <GhostButton size="sm" onClick={(e) => { e.stopPropagation(); handleModalAction('cover'); }} aria-label="Cover letter">
                          <Upload className="w-3.5 h-3.5" />
                        </GhostButton>
                        <GhostButton size="sm" onClick={(e) => { e.stopPropagation(); handleModalAction('apply'); }} aria-label="Apply">
                          <Briefcase className="w-3.5 h-3.5" />
                        </GhostButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {total > pageSize && (
              <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination" data-testid="pagination">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">
                  <ChevronDown className="w-5 h-5 rotate-180" />
                </Button>
                <span className="font-body text-sm text-text-secondary px-3">
                  Page {page} of {Math.ceil(total / pageSize)}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))} disabled={page >= Math.ceil(total / pageSize)} aria-label="Next page">
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </nav>
            )}
          </>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="job-detail-title">
          <div className="bg-surface-white raised rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-zoom-in-95 animate-slide-in-from-bottom-2">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 border-b border-slate sticky top-0 bg-surface-white z-10">
              <div className="flex-1 mr-4 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-heading font-bold text-lg text-ink truncate">{selectedJob.company}</span>
                  <StatusPill variant={job.category === 'consultancy' ? 'consultancy' : 'job'} size="micro">
                    {getMatchTierLabel(selectedJob.match_tier)}
                  </StatusPill>
                </div>
                <h2 id="job-detail-title" className="font-heading font-bold text-xl text-ink">{selectedJob.title}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-secondary">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {selectedJob.location}</span>
                  <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {getJobTypeLabel(selectedJob.job_type)}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatSalary(selectedJob.salary_range)}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatDate(selectedJob.posted_date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <ATSGauge score={selectedJob.ats_score || 0} size={60} strokeWidth={6} showLabel tier={selectedJob.match_tier} />
                <button onClick={closeJobDetail} className="tactile p-2 rounded-lg text-text-secondary hover:text-ink hover:bg-surface-muted transition-colors" aria-label="Close job detail">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Description */}
              <section>
                <h3 className="font-heading font-bold text-base text-ink mb-3">Description</h3>
                <div className="prose prose-sm text-text-secondary max-w-none">
                  <p className="whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              </section>

              {/* Requirements & Responsibilities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(selectedJob.requirements?.length ?? 0) > 0 && (
                  <section>
                    <h3 className="font-heading font-bold text-base text-ink mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-brand-orange" />
                      Requirements
                    </h3>
                    <ul className="space-y-2">
                      {selectedJob.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1.5 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {(selectedJob.responsibilities?.length ?? 0) > 0 && (
                  <section>
                    <h3 className="font-heading font-bold text-base text-ink mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success-emerald" />
                      Responsibilities
                    </h3>
                    <ul className="space-y-2">
                      {selectedJob.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="w-1.5 h-1.5 rounded-full bg-success-emerald mt-1.5 flex-shrink-0" />
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              {/* ATS Score Breakdown */}
              {selectedJob.ats_score !== undefined && (
                <section>
                  <h3 className="font-heading font-bold text-base text-ink mb-3">ATS Score Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ATSGauge score={selectedJob.ats_score} size={80} tier={selectedJob.match_tier} label="Overall" />
                    <div className="md:col-span-3 space-y-3">
                      {[
                        { label: 'Keyword Match', value: 85, color: '#FFA928' },
                        { label: 'Semantic Similarity', value: 78, color: '#E63946' },
                        { label: 'Experience Relevance', value: 82, color: '#67E8F9' },
                        { label: 'Education Match', value: 75, color: '#34D399' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="w-36 font-body text-sm text-text-secondary">{item.label}</span>
                          <div className="flex-1 h-2 bg-surface-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                          </div>
                          <span className="w-10 text-right font-heading font-bold text-sm text-ink">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate space-y-3">
                <div className="flex flex-wrap gap-3">
                  <AccentButton
                    onClick={() => handleModalAction('apply')}
                    disabled={modalAction !== null}
                    data-testid="apply-btn"
                    className="flex-1 sm:flex-none"
                  >
                    {modalAction === 'apply' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {modalAction === 'apply' ? 'Applying...' : 'Apply Now'}
                  </AccentButton>
                  <OutlineButton
                    onClick={() => handleModalAction('tailor')}
                    disabled={modalAction !== null}
                    data-testid="tailor-resume-btn"
                    className="flex-1 sm:flex-none"
                  >
                    {modalAction === 'tailor' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {modalAction === 'tailor' ? 'Tailoring...' : 'Tailor Resume'}
                  </OutlineButton>
                  <OutlineButton
                    onClick={() => handleModalAction('cover')}
                    disabled={modalAction !== null}
                    data-testid="cover-letter-btn"
                    className="flex-1 sm:flex-none"
                  >
                    {modalAction === 'cover' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {modalAction === 'cover' ? 'Generating...' : 'Cover Letter'}
                  </OutlineButton>
                  <OutlineButton
                    onClick={() => handleModalAction('flag')}
                    disabled={modalAction !== null}
                    data-testid="flag-btn"
                    className="flex-1 sm:flex-none"
                  >
                    {modalAction === 'flag' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                    {modalAction === 'flag' ? 'Flagging...' : 'Flag'}
                  </OutlineButton>
                </div>
                {modalFeedback && (
                  <p
                    role={modalFeedback.type === 'success' ? 'status' : 'alert'}
                    className={cn(
                      'px-3 py-2 rounded-lg border font-body text-sm',
                      modalFeedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900'
                        : 'bg-red-500/10 border-red-500/30 text-red-900'
                    )}
                  >
                    {modalFeedback.message}
                    {modalFeedback.url && (
                      <a
                        href={modalFeedback.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 font-bold underline hover:opacity-80"
                      >
                        Open posting
                      </a>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Need to import Flag
import { Flag } from 'lucide-react';

export default JobList;