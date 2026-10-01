import React from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export const RouteError: React.FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const routeError = isRouteErrorResponse(error) ? error : null;
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div role="alert" className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 sunken rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-signoff-red" aria-hidden="true" />
      </div>

      <h2 className="font-display font-bold text-lg text-ls-navy mb-2">Something went wrong</h2>

      {routeError && (
        <p className="font-body text-sm font-bold text-ls-red mb-3">
          {routeError.status} {routeError.statusText}
        </p>
      )}

      <pre className="sunken w-full max-w-xl rounded-lg px-4 py-3 mb-4 font-mono text-xs text-white text-left whitespace-pre-wrap break-words">
        {message}
      </pre>

      <p className="font-body text-sm text-ls-grey-dark max-w-sm">
        Athena is still running. Head back to the dashboard and try again.
      </p>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="tactile mt-4 px-6 py-2.5 rounded-lg bg-signoff-red text-white font-bold text-sm hover:bg-signoff-red-hover transition-colors"
      >
        Retry
      </button>
    </div>
  );
};

export default RouteError;
