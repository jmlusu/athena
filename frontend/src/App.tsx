import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider, useLoaderData } from 'react-router-dom';
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
import { RouteError } from '@/components/athena/RouteError';
import { Opportunity } from '@/lib/athena/types';
import { ApplicantProfile as AIApplicantProfile } from '@/lib/athena/aiTypes';
import { getJob, listProfiles } from '@/lib/athena/api';

const DashboardRoute = Dashboard;
const JobListRoute = JobList;
const JobDetailRoute = JobDetail;
const DocumentEditorRoute = DocumentEditor;
const DocumentStudioRoute = DocumentStudio;
const ReceiptsRoute = Receipts;
const N8nIntegrationRoute = N8nIntegration;
const SettingsRoute = Settings;

const routeErrorElement = <RouteError />;

// Wrapper components that load required data
const FormFillerModalWrapper: React.FC = () => {
  const { jobId } = useLoaderData<{ jobId: string }>();
  // In a real app, this would load from context/state
  // For now, we'll use mock data matching the expected types
  const opportunity: Opportunity = {
    id: jobId,
    title: "Sample Position",
    company: "Sample Company",
    location: "Lilongwe, Malawi",
    category: "job",
    scope: "lilongwe-local",
    platform: "LinkedIn",
    description: "Sample description",
    requirements: [],
    salaryOrBudget: "$50,000/yr",
    deadline: "2026-12-31",
    atsScore: 90,
    postedDate: "2026-01-01",
    status: "awaiting_signoff",
    isFlagged: false,
  };
  const applicantProfile: AIApplicantProfile = {
    full_name: "Chifuniro Phiri",
    email: "chifuniro.phiri@consult-mw.com",
    phone: "+265 99 412 8890",
    location: "Area 10, Lilongwe, Malawi",
    headline: "Senior Technology & Operations Specialist",
    summary: "Experienced professional...",
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    hourly_rate_usd: 50,
    expected_monthly_mwk: 3500000,
    legal_authorized_signer: "Chifuniro Phiri",
    linkedin_url: "https://linkedin.com/in/chifuniro-phiri-mw",
    portfolio_url: "https://github.com/chifuniro-phiri-systems",
    github_url: "https://github.com/chifuniro-phiri-systems",
    preferences: {
      keywords: [],
      excluded_keywords: [],
      locations: [],
      job_types: [],
      min_salary: undefined,
      preferred_sources: [],
      remote_only: false,
      visa_sponsorship_required: false,
    },
  };
  
  return (
    <FormFillerModal
      opportunity={opportunity}
      applicantProfile={applicantProfile}
      onClose={() => window.history.back()}
      onSubmitSuccess={() => {}}
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
          { path: 'form-filler/:jobId', element: <FormFillerModalWrapper />, errorElement: routeErrorElement },
          { path: 'receipts', element: <ReceiptsRoute />, errorElement: routeErrorElement },
          { path: 'n8n', element: <N8nIntegrationRoute />, errorElement: routeErrorElement },
          { path: 'profile', element: <ApplicantProfileWrapper />, errorElement: routeErrorElement },
          { path: 'settings', element: <SettingsRoute />, errorElement: routeErrorElement },
          { path: '*', element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ])
  );

  return <RouterProvider router={router} />;
};

export default App;