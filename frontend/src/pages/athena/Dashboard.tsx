import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus, Target, Users, DollarSign, Clock, Award, RefreshCw, Download, FileText } from 'lucide-react';
import { MetricCardLarge, StatCounter } from '@/components/athena/MetricCard';
import { LayeredMountainChart } from '@/components/athena/charts/LayeredMountainChart';
import { MetricsAndBarChart } from '@/components/athena/charts/MetricsAndBarChart';
import { PipelineKanbanBoard } from '@/components/athena/pipeline/PipelineKanbanBoard';
import { cn, formatRelativeTime, groupBy, sortBy } from '@/lib/athena/utils';
import { listJobs, getPipelineStats, getScrapingStats, triggerScrape, listProfiles, submitApplication } from '@/lib/athena/api';
import { jobToOpportunity, userProfileToApplicantProfile } from '@/lib/athena/mappers';
import { buildStatsShapeFromJobs } from '@/lib/athena/metrics-registry';
import { DEFAULT_AUTOMATION_SETTINGS, FALLBACK_APPLICANT_PROFILE } from '@/lib/athena/settings';
import type { Job, JobStatus, PipelineStatsResponse, AutomationSettings, UserProfile } from '@/lib/athena/types';
import { OpportunityDetailModal } from './OpportunityDetailModal';
import { LinkedInExportModal } from './LinkedInExportModal';
import { SignOffModal } from './SignOffModal';
import { FormFillerModal } from './FormFillerModal';
import { AutomationControls } from '@/components/athena/AutomationControls';

export const AthenaDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PipelineStatsResponse | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [atsDistribution, setAtsDistribution] = useState<Array<{ range: string; count: number }>>([]);
  const [matchTierDistribution, setMatchTierDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [pipelineSources, setPipelineSources] = useState<Array<{ name: string; globalRemote: number; lilongweHub: number; consultancies: number }>>([]);
  const [skillsData, setSkillsData] = useState<Array<{ skill: string; compatibility: number; category: 'technical' | 'soft' | 'language' }>>([]);
  const [applicantName, setApplicantName] = useState('Applicant');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>(DEFAULT_AUTOMATION_SETTINGS);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [signOffOpen, setSignOffOpen] = useState(false);
  const [formFillerOpen, setFormFillerOpen] = useState(false);
  const [signOffSubmitting, setSignOffSubmitting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, jobsData, scrapeData, profiles] = await Promise.all([
        getPipelineStats(),
        listJobs({ limit: 100 }),
        getScrapingStats(),
        listProfiles().catch(() => []),
      ]);

      const jobsList = Array.isArray(jobsData?.jobs) ? jobsData.jobs : [];

      setStats(statsData);
      setJobs(jobsList);
      setRecentJobs(jobsList.slice(0, 5));
      setProfiles(profiles);
      if (profiles.length > 0 && profiles[0].full_name) {
        setApplicantName(profiles[0].full_name);
      }

      // ATS score distribution
      const atsScores = jobsList.filter(j => j.ats_score !== undefined).map(j => j.ats_score!);
      if (atsScores.length > 0) {
        const distribution = calculateATSDistribution(atsScores);
        setAtsDistribution(distribution);
      }

      // Match tier distribution
      const tierDist: Record<string, number> = {};
      jobsList.forEach(job => {
        if (job.match_tier) {
          tierDist[job.match_tier] = (tierDist[job.match_tier] || 0) + 1;
        }
      });
      setMatchTierDistribution(tierDist);

      // Pipeline sources data for LayeredMountainChart
      const sourceGroups = groupBy(jobsList, 'source');
      const sourceData = Object.entries(sourceGroups).map(([source, sourceJobs]) => {
        const types = groupBy(sourceJobs, 'job_type');
        return {
          name: source,
          globalRemote: (types.remote_ok?.length || 0) + (types.we_work_remotely?.length || 0) + (types.remote_co?.length || 0),
          lilongweHub: (types.malawi_jobs?.length || 0) + (types.malawi_work?.length || 0) + (types.jobs_malawi?.length || 0),
          consultancies: types.consultancy?.length || 0,
        };
      });
      setPipelineSources(sourceData);

      // Skills data from job requirements
      const allSkills: Record<string, { count: number; category: 'technical' | 'soft' | 'language' }> = {};
      jobsList.forEach(job => {
        job.requirements?.forEach(req => {
          const lowerReq = req.toLowerCase();
          let category: 'technical' | 'soft' | 'language' = 'technical';
          if (['communication', 'leadership', 'teamwork', 'problem solving', 'adaptability'].some(s => lowerReq.includes(s))) {
            category = 'soft';
          } else if (['english', 'spanish', 'french', 'chichewa', 'portuguese', 'arabic'].some(s => lowerReq.includes(s))) {
            category = 'language';
          }
          allSkills[req] = {
            count: (allSkills[req]?.count || 0) + 1,
            category,
          };
        });
      });

      const topSkills = Object.entries(allSkills)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 8)
        .map(([skill, data]) => ({
          skill,
          compatibility: Math.min(95, Math.max(40, data.count * 12 + Math.random() * 20)),
          category: data.category,
        }));
      setSkillsData(topSkills);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateATSDistribution = (scores: number[]): Array<{ range: string; count: number }> => {
    const bins = 10;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const binSize = Math.max(1, (max - min) / bins);

    const distribution: Array<{ range: string; count: number }> = [];
    for (let i = 0; i < bins; i++) {
      const binMin = Math.floor(min + i * binSize);
      const binMax = Math.floor(min + (i + 1) * binSize);
      const count = scores.filter(s => s >= binMin && s < binMax).length;
      distribution.push({ range: `${binMin}-${binMax}`, count });
    }
    return distribution;
  };

  const handleJobStatusChange = async (jobId: string, newStatus: JobStatus) => {
    try {
      setJobs(prev => prev.map(job =>
        job.id === jobId ? { ...job, status: newStatus } : job
      ));
      const newStats = await getPipelineStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to update job status:', error);
      throw error;
    }
  };

  const handleJobClick = (job: Job) => {
    setActiveJob(job);
    setDetailOpen(true);
  };

  const handleSignOff = async (signature: string) => {
    if (!activeJob) return;
    setSignOffSubmitting(true);
    try {
      await submitApplication({
        application_id: activeJob.id,
        job_title: activeJob.title,
        company: activeJob.company,
        applicant_name: applicantName,
        authorization_signature: signature,
        authorized_at: new Date().toISOString(),
      });
      await handleJobStatusChange(activeJob.id, 'applied');
      setSignOffOpen(false);
    } catch (error) {
      console.error('Application sign-off failed:', error);
    } finally {
      setSignOffSubmitting(false);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      await triggerScrape({ query: 'software engineer', max_results: 50 });
      await loadDashboardData();
    } catch (error) {
      console.error('Scrape failed:', error);
    } finally {
      setScraping(false);
    }
  };

  const handleFormFiller = (job: Job) => {
    setActiveJob(job);
    setFormFillerOpen(true);
  };

  const handleMetricFilter = (_metric: string) => {
    // Could integrate with PipelineKanbanBoard filter logic
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" aria-hidden="true" />
          <p className="font-body text-text-secondary">Loading Athena dashboard...</p>
        </div>
      </div>
    );
  }

  // Derived stats for MetricsAndBarChart — canonical derivation via metrics
  // registry (criticalMatch/flaggedReview/signOffPending/submitted computed
  // once in buildStatsShapeFromJobs, not hand-rolled here)
  const statsShape = buildStatsShapeFromJobs(jobs, stats);

  return (
    <div className="h-full flex flex-col">
      {/* Dashboard Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink">Pipeline Dashboard</h1>
            <p className="font-body text-sm text-text-secondary mt-1">
              Track your job applications from discovery to offer
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleScrape}
              disabled={scraping}
              data-testid="trigger-scrape"
              className="tactile flex items-center gap-2 px-4 py-2 rounded-lg border border-slate bg-surface-white text-text-secondary font-medium text-sm hover:border-brand-orange/40 hover:text-brand-orange transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', scraping && 'animate-spin')} aria-hidden="true" />
              <span className="font-body font-medium text-sm">Scrape Jobs</span>
            </button>
            <button className="tactile flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-orange text-white font-bold text-sm hover:bg-brand-orange-hover transition-colors">
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Metrics & Charts Section - Replaces old metric cards + MountainAreaChart */}
        <MetricsAndBarChart
          stats={statsShape}
          skillsData={skillsData}
          onMetricClick={handleMetricFilter}
        />
      </div>

      {/* Main Content: Pipeline Board + Right Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Pipeline Kanban Board - Full width on mobile, 2/3 on desktop */}
        <div className="flex-1 min-w-0 lg:w-2/3">
          <PipelineKanbanBoard
            jobs={jobs}
            onJobClick={handleJobClick}
            onFormFiller={handleFormFiller}
            onJobStatusChange={handleJobStatusChange}
          />
        </div>

        {/* Right Sidebar - Analytics & Insights */}
        <div className="lg:w-1/3 flex-shrink-0 hidden lg:block">
          <div className="space-y-6">
            {/* Autonomous Controls */}
            <AutomationControls
              settings={automationSettings}
              onUpdateSettings={patch =>
                setAutomationSettings(prev => ({ ...prev, ...patch }))
              }
              pendingCount={jobs.filter(j => j.status === 'scored').length}
              onTriggerCron={handleScrape}
            />

            {/* Pipeline Sources - Layered Mountain Chart */}
            <div className="bg-surface-white raised border border-slate rounded-xl p-5">
              <h3 className="font-heading font-bold text-base text-ink mb-4">Pipeline Sources</h3>
              <LayeredMountainChart
                data={pipelineSources}
                height={260}
              />
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ background: 'linear-gradient(90deg, #F97316, #EA580C)' }} />
                  <span className="font-body text-text-secondary">Global Remote</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ background: '#1E2024' }} />
                  <span className="font-body text-text-secondary">Lilongwe Hub</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ background: 'repeating-linear-gradient(90deg, #DC2626, #DC2626 4px, transparent 4px, transparent 8px)' }} />
                  <span className="font-body text-text-secondary">Consultancies</span>
                </div>
              </div>
            </div>

            {/* ATS Score Distribution - Using AreaChart for compatibility */}
            <div className="bg-surface-white raised border border-slate rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-base text-ink">ATS Score Distribution</h3>
              </div>
              {atsDistribution.length > 0 ? (
                <>
                  <div style={{ height: 200 }} className="mb-4">
                    <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="ats-gradient-1" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#FFA928" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#FFA928" stopOpacity="0.02" />
                        </linearGradient>
                        <linearGradient id="ats-gradient-2" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#E63946" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#E63946" stopOpacity="0.01" />
                        </linearGradient>
                        <linearGradient id="ats-gradient-3" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.01" />
                        </linearGradient>
                      </defs>
                      {/* Mountain layers */}
                      {['#67E8F9', '#E63946', '#FFA928'].map((color, idx) => (
                        <polygon
                          key={idx}
                          points={atsDistribution.map((d, i) => {
                            const x = 40 + i * 320 / Math.max(1, atsDistribution.length - 1);
                            const y = 180 - (d.count / Math.max(...atsDistribution.map(d => d.count), 1)) * 150 * (0.8 - idx * 0.2);
                            return `${x},${y}`;
                          }).join(' ') + ' 360,180 40,180'}
                          fill={`url(#ats-gradient-${idx + 1})`}
                        />
                      ))}
                    </svg>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ background: 'linear-gradient(90deg, #FFA928, #E63946)' }} />
                      <span className="font-body text-text-secondary">High Match</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ background: '#67E8F9' }} />
                      <span className="font-body text-text-secondary">Low Match</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center sunken rounded-xl border border-slate">
                  <span className="font-body text-sm text-white">No ATS score data</span>
                </div>
              )}
            </div>

            {/* Match Tier Breakdown */}
            <div className="bg-surface-white raised border border-slate rounded-xl p-5">
              <h3 className="font-heading font-bold text-base text-ink mb-4">Match Tier Breakdown</h3>
              <div className="space-y-3">
                {([
                  { tier: 'excellent', label: 'Excellent (90+)', color: '#10B981' },
                  { tier: 'good', label: 'Good (80-89)', color: '#60A5FA' },
                  { tier: 'fair', label: 'Fair (70-79)', color: '#FBBF24' },
                  { tier: 'poor', label: 'Poor (<70)', color: '#F87171' },
                ]).map(({ tier, label, color }) => {
                  const count = matchTierDistribution[tier] || 0;
                  const total = Object.values(matchTierDistribution).reduce((a, b) => a + b, 0) || 1;
                  const percentage = Math.round((count / total) * 100);
                  return (
                    <div key={tier} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-body text-text-secondary flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          {label}
                        </span>
                        <span className="font-heading font-bold text-ink">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-1.5 sunken rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-surface-white raised border border-slate rounded-xl p-5">
              <h3 className="font-heading font-bold text-base text-ink mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <StatCounter
                  value={stats?.by_source ? Object.values(stats.by_source).reduce((a, b) => a + b, 0) : 0}
                  label="Sources Tracked"
                  format="plain"
                  variant="discovered"
                  className="readout [&_span]:font-mono! [&_span]:tabular-nums"
                />
                <StatCounter
                  value={stats?.by_type ? Object.keys(stats.by_type).length : 0}
                  label="Job Types"
                  format="plain"
                  variant="flagged"
                  className="readout [&_span]:font-mono! [&_span]:tabular-nums"
                />
                <StatCounter
                  value={stats?.total_jobs || 0}
                  label="Total Tracked"
                  format="comma"
                  variant="discovered"
                  className="readout [&_span]:font-mono! [&_span]:tabular-nums"
                />
              </div>
            </div>

            {/* Recent Scrapes */}
            <div className="bg-surface-white raised border border-slate rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-base text-ink">Recent Scrapes</h3>
                <button onClick={handleScrape} disabled={scraping} className="tactile rounded-md px-2 py-0.5 text-xs text-linkedin-blue hover:text-signoff-red font-bold">
                  {scraping ? 'Scraping...' : 'Run Scrape'}
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-body text-text-secondary">Last scrape: {formatRelativeTime(new Date().toISOString())}</p>
                <p className="font-body text-text-secondary">Jobs found: {stats?.new || 0} new</p>
                <p className="font-body text-text-secondary">Avg match: {stats ? Math.round(stats.avg_match_score) : 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job detail + export + sign-off modals (stacked one at a time) */}
      {activeJob && (
        <>
          <OpportunityDetailModal
            isOpen={detailOpen}
            onClose={() => setDetailOpen(false)}
            opportunity={jobToOpportunity(activeJob)}
            onExportLinkedIn={() => {
              setDetailOpen(false);
              setExportOpen(true);
            }}
            onInspectDocuments={() => {
              setDetailOpen(false);
              navigate('/documents');
            }}
            onSignOff={() => {
              setDetailOpen(false);
              setSignOffOpen(true);
            }}
            onOpenFormFiller={() => {
              setDetailOpen(false);
              setFormFillerOpen(true);
            }}
          />
          <LinkedInExportModal
            isOpen={exportOpen}
            onClose={() => setExportOpen(false)}
            opportunity={jobToOpportunity(activeJob)}
            applicantName={applicantName}
            onOpenLinkedIn={() =>
              window.open(
                activeJob.application_url || 'https://www.linkedin.com/jobs/',
                '_blank',
                'noopener,noreferrer',
              )
            }
          />
          <SignOffModal
            isOpen={signOffOpen}
            onClose={() => setSignOffOpen(false)}
            onSubmit={handleSignOff}
            opportunityTitle={activeJob.title}
            opportunityCompany={activeJob.company}
            applicantName={applicantName}
            isSubmitting={signOffSubmitting}
          />
          <FormFillerModal
            isOpen={formFillerOpen}
            onClose={() => setFormFillerOpen(false)}
            opportunity={jobToOpportunity(activeJob)}
            applicantProfile={
              profiles.length > 0
                ? userProfileToApplicantProfile(profiles[0])
                : FALLBACK_APPLICANT_PROFILE
            }
            onSubmitSuccess={(oppId, receipt) => {
              setFormFillerOpen(false);
              console.log('Form submitted:', oppId, receipt);
            }}
          />
        </>
      )}
    </div>
  );
};

export default AthenaDashboard;