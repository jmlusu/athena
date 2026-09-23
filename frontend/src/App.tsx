import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AthenaLayout } from '@/components/athena/AthenaLayout';
import { AthenaDashboard as Dashboard } from '@/pages/athena/Dashboard';
import { JobList } from '@/pages/athena/JobList';
import { JobDetail } from '@/pages/athena/JobDetail';
import { DocumentEditor } from '@/pages/athena/DocumentEditor';
import { Settings } from '@/pages/athena/Settings';

const DashboardRoute = Dashboard;
const JobListRoute = JobList;
const JobDetailRoute = JobDetail;
const DocumentEditorRoute = DocumentEditor;
const SettingsRoute = Settings;

export const App: React.FC = () => {
  const [router] = React.useState(() =>
    createBrowserRouter([
      {
        path: '/',
        element: <AthenaLayout />,
        children: [
          { index: true, element: <DashboardRoute /> },
          { path: 'jobs', element: <JobListRoute /> },
          { path: 'jobs/:id', element: <JobDetailRoute /> },
          { path: 'applications', element: <JobListRoute /> },
          { path: 'analytics', element: <DashboardRoute /> },
          { path: 'settings', element: <SettingsRoute /> },
          { path: 'documents', element: <DocumentEditorRoute documentType="resume" /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ])
  );

  return <RouterProvider router={router} />;
};

export default App;