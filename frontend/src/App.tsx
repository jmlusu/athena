import React, { Suspense, useState, useEffect } from 'react';
import { createBrowserRouter, Navigate, RouterProvider, useLoaderData, useNavigate } from 'react-router-dom';
import { AthenaLayout } from '@/components/athena/AthenaLayout';
import { AthenaDashboard as Dashboard } from '@/pages/athena/Dashboard';
import { JobList } from '@/pages/athena/JobList';
import { JobDetail } from '@/pages/athena/JobDetail';
import { DocumentEditor } from '@/pages/athena/DocumentEditor';
import { DocumentStudio } from '@/pages/athena/DocumentStudio';
import { Receipts } from '@/pages/athena/Receipts';
import { N8nIntegration } from '@/pages/athena/N8nIntegration';
import { FormFillerModal } from '@/pages/athena/FormFillerModal';
import { ApplicantProfile } from '@/pages/athena/ApplicantProfile';
import { Settings } from '@/pages/athena/Settings';
import { DesignTokensTest } from '@/pages/athena/DesignTokensTest';
import { RouteError } from '@/components/athena/RouteError';
import { Opportunity, Job } from '@/lib/athena/types';
import { ApplicantProfile as AIApplicantProfile } from '@/lib/athena/aiTypes';
import { getJob, listJobs } from '@/lib/athena/api';
import { CheckSquare, Briefcase, Search, Filter, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/athena/utils';

const DashboardRoute = Dashboard;
const JobListRoute = JobList;
const JobDetailRoute = JobDetail;
const DocumentEditorRoute = DocumentEditor;
const DocumentStudioRoute = DocumentStudio;
const ReceiptsRoute = Receipts;
const N8nIntegrationRoute = N8nIntegration;
const SettingsRoute = Settings;

const routeErrorElement = <RouteError />;

// Landing page for /form-filler (no jobId) - shows list of jobs to apply to
const FormFillerLanding: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await listJobs({ limit: 100 });
        // Filter for jobs that are ready for application (scored, matched, evaluated, fetched)
        const filtered = res.jobs.filter(j => 
          ['scored', 'matched', 'evaluated', 'fetched', 'new'].includes(j.status)
        );
        setJobs(filtered);
      } catch (err: any) {
        setError(err.message || 'Failed to load opportunities');
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleSelectJob = (job: Job) => {
    navigate(`/form-filler/${job.id}`);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['all', 'scored', 'matched', 'fetched', 'new', 'applied', 'flagged', 'interview', 'offer', 'rejected', 'archived'];
  
  // Map Job to display-friendly format
  const getStatusLabel = (status: Job['status']) => 
    status.replace('_', ' ');
  
  const getJobTypeLabel = (type: Job['job_type']) =>
    type.replace('_', ' ');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold">Online Forms & Sign-Off</h2>
          <p className="text-muted mt-1">Select an opportunity to auto-fill forms and authorize submission</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-text focus:ring-1 focus:ring-accent focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-10 py-2 bg-muted border border-border rounded-lg text-text focus:ring-1 focus:ring-accent focus:outline-none appearance-none"
            >
              {statuses.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No opportunities found</p>
            <p className="text-sm mt-1">Run a scrape or adjust filters to find jobs to apply to</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {filteredJobs.map(job => (
              <button
                key={job.id}
                onClick={() => handleSelectJob(job)}
                className="w-full p-4 bg-muted/50 border border-border rounded-xl hover:border-accent/50 hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text truncate">{job.title}</h3>
                      <span className={cn(
                        'px-2 py-0.5 text-[10px] font-mono rounded',
                        job.status === 'scored' ? 'bg-emerald-100 text-emerald-700' :
                        job.status === 'matched' ? 'bg-purple-100 text-purple-700' :
                        job.status === 'fetched' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {getStatusLabel(job.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted truncate">{job.company} • {job.location}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3" /> ATS: {job.ats_score ?? '—'}%
                      </span>
                      <span>{getJobTypeLabel(job.job_type)}</span>
                      <span>{job.source}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrapper that shows either the landing page or the modal for a specific job
const FormFillerModalWrapper: React.FC = () => {
  const { jobId } = useLoaderData<{ jobId?: string }>();
  const navigate = useNavigate();

  if (!jobId) {
    return <FormFillerLanding />;
  }

  return (
    <FormFillerModal
      opportunity={{ id: jobId, title: "Position", company: "Company", location: "Lilongwe, Malawi", category: "job", scope: "lilongwe-local", platform: "LinkedIn", description: "", requirements: [], salaryOrBudget: "", deadline: "", atsScore: 0, postedDate: "", status: "awaiting_signoff", isFlagged: false }}
      applicantProfile={{ full_name: "", email: "", phone: "", location: "", headline: "", summary: "", skills: [], experience: [], education: [], certifications: [], hourly_rate_usd: 0, expected_monthly_mwk: 0, legal_authorized_signer: "", linkedin_url: "", portfolio_url: "", github_url: "", preferences: { keywords: [], excluded_keywords: [], locations: [], job_types: [], min_salary: undefined, preferred_sources: [], remote_only: false, visa_sponsorship_required: false } }}
      onClose={() => navigate('/form-filler')}
      onSubmitSuccess={() => navigate('/form-filler')}
    />
  );
};

const ApplicantProfileWrapper: React.FC = () => {
  const { profile } = useLoaderData<{ profile: AIApplicantProfile }>();
  
  return <ApplicantProfile profile={profile} onUpdateProfile={() => {}} />;
};

export const App: React.FC = () => {
  const [router] = React.useState(() =>
    createBrowserRouter([
      {
        path: '/',
        element: <AthenaLayout />,
        children: [
          { index: true, element: <DashboardRoute />, errorElement: routeErrorElement },
          { path: 'dashboard', element: <DashboardRoute />, errorElement: routeErrorElement },
          { path: 'jobs', element: <JobListRoute />, errorElement: routeErrorElement },
          { path: 'jobs/:id', element: <JobDetailRoute />, errorElement: routeErrorElement },
          { path: 'applications', element: <JobListRoute />, errorElement: routeErrorElement },
          { path: 'documents', element: <DocumentStudioRoute />, errorElement: routeErrorElement },
          { path: 'documents/:jobId', element: <DocumentStudioRoute />, errorElement: routeErrorElement },
          { path: 'form-filler/:jobId?', element: <FormFillerModalWrapper />, errorElement: routeErrorElement },
          { path: 'receipts', element: <ReceiptsRoute />, errorElement: routeErrorElement },
          { path: 'receipts/:id', element: <ReceiptsRoute />, errorElement: routeErrorElement },
          { path: 'n8n', element: <N8nIntegrationRoute />, errorElement: routeErrorElement },
          { path: 'profile', element: <ApplicantProfileWrapper />, errorElement: routeErrorElement },
          { path: 'settings', element: <SettingsRoute />, errorElement: routeErrorElement },
          { path: 'design-tokens-test', element: <DesignTokensTest />, errorElement: routeErrorElement },
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ])
  );

  return <RouterProvider router={router} />;
};

export default App;