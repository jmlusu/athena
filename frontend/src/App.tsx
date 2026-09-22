import React from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AthenaLayout } from '@/components/athena/AthenaLayout';
import { AthenaDashboard as Dashboard } from '@/pages/athena/Dashboard';
import { JobList } from '@/pages/athena/JobList';
import { JobDetail } from '@/pages/athena/JobDetail';
import { DocumentEditor } from '@/pages/athena/DocumentEditor';

const DashboardRoute = Dashboard;
const JobListRoute = JobList;
const JobDetailRoute = JobDetail;
const DocumentEditorRoute = DocumentEditor;

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
          { path: 'settings', element: <DashboardRoute /> },
          { path: 'documents', element: <DocumentEditorRoute documentType="resume" /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ])
  );

  return <RouterProvider router={router} />;
};

export default App;