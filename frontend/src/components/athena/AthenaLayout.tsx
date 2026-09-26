import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Briefcase,
  FileText,
  CheckSquare,
  Receipt,
  Workflow,
  User,
  BarChart2,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Globe,
  MapPin,
  Building,
  Clock,
  RotateCw,
  Zap,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { cn } from '@/lib/athena/utils';
import { ScopeFilter } from './ScopeFilter';
import { CronCountdown } from './CronCountdown';
import { AutomationControls } from './AutomationControls';

export type NavView =
  | 'dashboard'
  | 'jobs'
  | 'applications'
  | 'documents'
  | 'form_filler'
  | 'receipts'
  | 'n8n'
  | 'profile'
  | 'settings';

interface AthenaLayoutProps {
  userProfile?: {
    name: string;
    email: string;
    avatar?: string;
  } | null;
  cronState?: {
    jobSecondsRemaining: number;
    consultancySecondsRemaining: number;
    lastJobRun: string;
  };
  onTriggerCronNow?: () => void;
  automationSettings?: {
    autoCreateThreshold: number;
    flagThresholdMin: number;
    flagThresholdMax: number;
    autoCreateResumeCoverLetter: boolean;
    autoCreateProposalExecSummary: boolean;
    dehumanizeEnabled: boolean;
    n8nWebhookUrl: string;
    n8nActive: boolean;
    soundAlerts: boolean;
  };
  onUpdateAutomationSettings?: (settings: Partial<AthenaLayoutProps['automationSettings']>) => void;
  pendingAuthorizationsCount?: number;
}

const NAV_ITEMS: { id: NavView; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
  { id: 'dashboard', label: 'Pipeline & Command', icon: Compass },
  { id: 'jobs', label: 'Scraper & Discovery', icon: Briefcase, badge: 'Live' },
  { id: 'documents', label: 'Pristine Document Studio', icon: FileText, badge: '1/2 Col' },
  { id: 'form_filler', label: 'Online Forms & Sign-Off', icon: CheckSquare, badge: 'Auth' },
  { id: 'receipts', label: 'Receipts & Follow-ups', icon: Receipt },
  { id: 'n8n', label: 'n8n Workflow Nodes', icon: Workflow, badge: 'Plus' },
  { id: 'profile', label: 'Applicant Skills & Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AthenaLayout: React.FC<AthenaLayoutProps> = ({
  userProfile,
  cronState,
  onTriggerCronNow,
  automationSettings,
  onUpdateAutomationSettings,
  pendingAuthorizationsCount = 0,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [selectedScope, setSelectedScope] = useState<'all' | 'lilongwe-local' | 'lilongwe-remote' | 'international-remote'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'job' | 'consultancy'>('all');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [mobileRightOpen, setMobileRightOpen] = useState(false);

  // Sync currentView with route
  useEffect(() => {
    const path = location.pathname.replace('/athena', '') || '/dashboard';
    const routeMap: Record<string, NavView> = {
      '/dashboard': 'dashboard',
      '/jobs': 'jobs',
      '/applications': 'applications',
      '/documents': 'documents',
      '/form-filler': 'form_filler',
      '/receipts': 'receipts',
      '/n8n': 'n8n',
      '/profile': 'profile',
      '/settings': 'settings',
    };
    const view = routeMap[path] || 'dashboard';
    setCurrentView(view);
  }, [location.pathname]);

  // Close mobile sidebars on route change
  useEffect(() => {
    setMobileLeftOpen(false);
    setMobileRightOpen(false);
  }, [location.pathname]);

  const handleNavigate = (view: NavView) => {
    setCurrentView(view);
    const pathMap: Record<NavView, string> = {
      dashboard: '/athena/dashboard',
      jobs: '/athena/jobs',
      applications: '/athena/applications',
      documents: '/athena/documents',
      form_filler: '/athena/form-filler',
      receipts: '/athena/receipts',
      n8n: '/athena/n8n',
      profile: '/athena/profile',
      settings: '/athena/settings',
    };
    navigate(pathMap[view]);
  };

  const defaultCronState = {
    jobSecondsRemaining: 14400,
    consultancySecondsRemaining: 14400,
    lastJobRun: 'Never',
  };

  const defaultAutomationSettings = {
    autoCreateThreshold: 90,
    flagThresholdMin: 80,
    flagThresholdMax: 89,
    autoCreateResumeCoverLetter: true,
    autoCreateProposalExecSummary: true,
    dehumanizeEnabled: true,
    n8nWebhookUrl: 'https://n8n.athena-ops.internal/webhook/athena-pipeline-trigger',
    n8nActive: false,
    soundAlerts: false,
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col font-body text-text selection:bg-accent selection:text-white">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Toast Notification (placeholder) */}
      <div id="toast-container" className="fixed top-4 right-4 z-[800] flex flex-col gap-2" />

      {/* Main Structural Frame: Far-Left Sidebar + Fluid Center Body + Far-Right Sidebar */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Far-Left Vertical Sidebar */}
        <aside
          className={cn(
            'w-68 min-h-screen bg-primary text-white border-r border-border flex flex-col justify-between shrink-0 select-none transition-all duration-300 lg:translate-x-0',
            leftSidebarOpen ? 'w-68' : 'w-20 lg:w-20',
            !leftSidebarOpen && 'lg:w-20',
            mobileLeftOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            'z-40'
          )}
          aria-label="Main navigation"
        >
          <div className="flex-1 overflow-y-auto">
            {/* Brand Header */}
            <div className={cn('p-4 border-b border-border flex items-center justify-between', !leftSidebarOpen && 'justify-center')}>
              {leftSidebarOpen && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-red-600 flex items-center justify-center text-white shadow-md font-brand font-bold text-base">
                    A
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-brand font-bold tracking-wider text-white text-base leading-none truncate">
                      ATHENA
                    </h1>
                    <span className="text-[10px] tracking-widest text-subtle uppercase font-mono">
                      Auto Job & Consultancy
                    </span>
                  </div>
                </div>
              )}
              {!leftSidebarOpen && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-red-600 flex items-center justify-center text-white shadow-md font-brand font-bold text-base">
                  A
                </div>
              )}
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Engine Online" />
            </div>

            {/* Search Scopes Quick Filters */}
            {leftSidebarOpen && (
              <ScopeFilter
                selectedScope={selectedScope}
                onSelectScope={setSelectedScope}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            )}

            {/* Main Navigation */}
            <nav className={cn('p-3 space-y-1', leftSidebarOpen ? '' : 'hidden')} role="navigation" aria-label="System modules">
              <div className="text-[10px] font-semibold text-subtle uppercase tracking-wider mb-2 px-1">
                System Modules
              </div>
              {NAV_ITEMS.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      isActive
                        ? 'bg-accent text-white shadow-sm font-semibold'
                        : 'text-muted hover:bg-muted hover:text-text'
                    )}
                    title={!leftSidebarOpen ? item.label : undefined}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-muted')} />
                      {leftSidebarOpen && <span>{item.label}</span>}
                    </div>
                    {item.badge && leftSidebarOpen && (
                      <span
                        className={cn(
                          'text-[9px] font-mono px-1.5 py-0.2 rounded',
                          isActive ? 'bg-black/20 text-white' : 'bg-muted text-amber-500'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* 4-Hour Cron Schedules Status Widget */}
          {leftSidebarOpen && cronState && (
            <CronCountdown
              jobSecondsRemaining={cronState.jobSecondsRemaining}
              consultancySecondsRemaining={cronState.consultancySecondsRemaining}
              lastJobRun={cronState.lastJobRun}
              onTriggerNow={onTriggerCronNow || (() => {})}
            />
          )}

          {/* Collapsed brand footer */}
          {!leftSidebarOpen && (
            <div className="p-3 border-t border-border text-center text-[10px] text-subtle font-mono">
              ATHENA v2.4
            </div>
          )}
        </aside>

        {/* Mobile left sidebar overlay */}
        {mobileLeftOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setMobileLeftOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Center Fluid Application Canvas */}
        <main
          id="main-content"
          className={cn(
            'flex-1 min-w-0 overflow-y-auto min-h-screen flex flex-col transition-all duration-300',
            leftSidebarOpen ? 'lg:ml-68' : 'lg:ml-20'
          )}
          tabIndex={-1}
        >
          {/* Top Application Bar */}
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between shadow-xs">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileLeftOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted hover:text-text hover:bg-muted tactile disabled:opacity-40"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb & Scope Pill */}
            <div className="flex items-center gap-2 text-xs flex-1">
              <span className="font-brand font-bold text-sm tracking-wider text-text">
                ATHENA
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-subtle" />
              <span className="font-semibold text-muted capitalize">
                {NAV_ITEMS.find((i) => i.id === currentView)?.label || currentView}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-subtle" />
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-accent border border-orange-200 font-medium">
                Scope: {selectedScope === 'all' ? 'Lilongwe & Global' : selectedScope}
              </span>
            </div>

            {/* Quick Actions & Status */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted font-mono bg-muted px-2.5 py-1 rounded-md border border-border">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Lilongwe Gateway: Active</span>
              </div>

              <button
                onClick={() => handleNavigate('documents')}
                className="px-3 py-1.5 bg-primary hover:bg-navy text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span className="hidden sm:inline">Pristine Document Studio</span>
                <span className="sm:hidden">Studio</span>
              </button>

              {/* Right sidebar toggle */}
              <button
                onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                className={cn(
                  'p-2 rounded-lg transition-colors tactile disabled:opacity-40',
                  'text-muted hover:text-text hover:bg-muted',
                  rightSidebarOpen && 'bg-muted text-text'
                )}
                aria-label={rightSidebarOpen ? 'Close right panel' : 'Open right panel'}
                aria-expanded={rightSidebarOpen}
              >
                <Sliders className="w-5 h-5" />
              </button>

              {/* Mobile right sidebar toggle */}
              <button
                onClick={() => setMobileRightOpen(true)}
                className="lg:hidden p-2 rounded-lg text-muted hover:text-text hover:bg-muted tactile disabled:opacity-40"
                aria-label="Open automation panel"
              >
                <Sliders className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Body Content Container */}
          <div className="p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">
            <Outlet />
          </div>
        </main>

        {/* Far-Right Vertical Sidebar: Autonomous Rules, Sign-Off Gate, Aggregator Status */}
        <aside
          className={cn(
            'w-72 min-h-screen bg-primary text-white border-l border-border flex flex-col justify-between shrink-0 select-none overflow-y-auto transition-all duration-300 lg:translate-x-0',
            rightSidebarOpen ? 'w-72' : 'w-0 lg:w-0 overflow-hidden',
            !rightSidebarOpen && 'lg:w-0 overflow-hidden',
            mobileRightOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
            'z-40'
          )}
          aria-label="Autonomous controls"
        >
          {rightSidebarOpen && automationSettings && (
            <AutomationControls
              settings={automationSettings}
              onUpdateSettings={onUpdateAutomationSettings || (() => {})}
              pendingCount={pendingAuthorizationsCount}
            />
          )}
          {rightSidebarOpen && userProfile && (
            <div className="p-3 border-t border-border bg-muted/50 flex items-center justify-between text-[10px] text-subtle">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Human Protected
              </span>
              <span className="font-mono">ATHENA v2.4</span>
            </div>
          )}
        </aside>

        {/* Mobile right sidebar overlay */}
        {mobileRightOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setMobileRightOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};

export default AthenaLayout;