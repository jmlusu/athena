import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AthenaLayout } from '@/components/athena/AthenaLayout';
import { AthenaDashboard as Dashboard } from '@/pages/athena/Dashboard';
import { JobList } from '@/pages/athena/JobList';
import { JobDetail } from '@/pages/athena/JobDetail';
import { DocumentEditor } from '@/pages/athena/DocumentEditor';
import { Settings } from '@/pages/athena/Settings';
import { RouteError } from '@/components/athena/RouteError';

const DashboardRoute = Dashboard;
const JobListRoute = JobList;
const JobDetailRoute = JobDetail;
const DocumentEditorRoute = DocumentEditor;
const SettingsRoute = Settings;

const routeErrorElement = <RouteError />;

export const App: React.FC = () => {
  const [router] = React.useState(() =>
    createBrowserRouter([
      {
        path: '/',
        element: <AthenaLayout />,
        children: [
          { index: true, element: <DashboardRoute />, errorElement: routeErrorElement },
          { path: 'jobs', element: <JobListRoute />, errorElement: routeErrorElement },
          { path: 'jobs/:id', element: <JobDetailRoute />, errorElement: routeErrorElement },
          { path: 'applications', element: <JobListRoute />, errorElement: routeErrorElement },
          { path: 'analytics', element: <DashboardRoute />, errorElement: routeErrorElement },
          { path: 'settings', element: <SettingsRoute />, errorElement: routeErrorElement },
          { path: 'documents', element: <DocumentEditorRoute documentType="resume" />, errorElement: routeErrorElement },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ])
  );

  return <RouterProvider router={router} />;
};

export default App;