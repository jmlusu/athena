import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/athena/utils';
import { PipelineMetricCard } from '@/components/athena/MetricCard';
import { CheckCircle2, AlertTriangle, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { calculateFunnelData } from '@/lib/athena/metrics-registry';

interface MetricsAndBarChartProps {
  stats: {
    total_jobs: number;
    new: number;
    criticalMatch: number;      // ATS >= 90%
    flaggedReview: number;      // ATS 80-89%
    signOffPending: number;     // awaiting sign-off
    submitted: number;          // applied + interview + offer
    avg_ats_score: number;
  };
  skillsData?: Array<{ skill: string; compatibility: number; category: 'technical' | 'soft' | 'language' }>;
  funnelData?: Array<{ stage: string; count: number; conversionRate: number }>;
  onMetricClick?: (metric: string) => void;
  className?: string;
}

interface SkillBarProps {
  skill: string;
  compatibility: number;
  category: 'technical' | 'soft' | 'language';
  index: number;
  animated: boolean;
}

const SkillBar: React.FC<SkillBarProps> = ({ skill, compatibility, category, index, animated }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [displayWidth, setDisplayWidth] = useState(0);

  useEffect(() => {
    if (animated && barRef.current) {
      const targetWidth = compatibility;
      let currentWidth = 0;
      const duration = 700;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        currentWidth = targetWidth * easedProgress;
        setDisplayWidth(currentWidth);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayWidth(compatibility);
    }
  }, [animated, compatibility]);

  const categoryColors = {
    technical: '#F97316',
    soft: '#10B981',
    language: '#0A66C2',
  };

  const categoryLabels = {
    technical: 'Technical',
    soft: 'Soft Skills',
    language: 'Languages',
  };

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-body text-xs font-medium text-text-secondary truncate max-w-[140px]">{skill}</span>
        <span className="font-mono font-bold text-xs text-ink tabular-nums whitespace-nowrap">{compatibility}%</span>
      </div>
      <div className="relative h-2 rounded-full bg-surface-muted overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${displayWidth}%`,
            backgroundColor: categoryColors[category],
            transformOrigin: 'left center',
          }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: categoryColors[category] }}>
          {categoryLabels[category]}
        </span>
        <span className="font-body text-[10px] text-text-subtle">Match</span>
      </div>
    </div>
  );
};

interface FunnelChartProps {
  data: Array<{ stage: string; count: number; conversionRate: number }>;
  height?: number;
  width?: number;
}

const FunnelChart: React.FC<FunnelChartProps> = ({ data, height = 200, width = 300 }) => {
  if (!data.length) return null;

  const padding = { top: 20, right: 40, bottom: 40, left: 80 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxCount = Math.max(...data.map(d => d.count));
  const xScale = (value: number) => padding.left + innerWidth - (value / maxCount) * innerWidth;
  const yScale = (index: number) => padding.top + (index / Math.max(1, data.length - 1)) * innerHeight;

  const points = data.map((d, i) => ({
    x: xScale(d.count),
    y: yScale(i),
    ...d,
  }));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="funnel-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F97316" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
        </linearGradient>
      </defs>

      {/* Funnel shape background */}
      <polygon
        points={[
          `${padding.left},${padding.top}`,
          `${padding.left + innerWidth},${padding.top}`,
          `${xScale(0) + 20},${padding.top + innerHeight}`,
          `${xScale(0) - 20},${padding.top + innerHeight}`,
        ].join(' ')}
        fill="url(#funnel-gradient)"
        stroke="#E2E8F0"
        strokeWidth={1}
        strokeDasharray="4 4"
      />

      {/* Stage lines */}
      {data.map((d, i) => {
        const x = xScale(d.count);
        const y = yScale(i);
        return (
          <line
            key={`line-${i}`}
            x1={x}
            x2={padding.left + innerWidth}
            y1={y}
            y2={y}
            stroke="#E2E8F0"
            strokeWidth={1}
            strokeDasharray="2 4"
            opacity={0.5}
          />
        );
      })}

      {/* Connection line */}
      <polyline
        points={points.map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#F97316"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="drop-shadow(0 2px 4px rgba(249, 115, 22, 0.3))"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={`point-${i}`} className="tactile">
          {/* Outer ring */}
          <circle
            cx={p.x}
            cy={p.y}
            r={10}
            fill="none"
            stroke="#F97316"
            strokeWidth={3}
            opacity={0.3}
          />
          {/* Main circle */}
          <circle
            cx={p.x}
            cy={p.y}
            r={6}
            fill="#FFFFFF"
            stroke="#F97316"
            strokeWidth={3}
            filter="drop-shadow(0 2px 4px rgba(249, 115, 22, 0.4))"
          />
          {/* Inner dot */}
          <circle
            cx={p.x}
            cy={p.y}
            r={2}
            fill="#F97316"
          />
        </g>
      ))}

      {/* Labels */}
      {data.map((d, i) => {
        const x = xScale(d.count);
        const y = yScale(i);
        return (
          <g key={`labels-${i}`} fontFamily="Arial, sans-serif">
            {/* Stage name */}
            <text
              x={padding.left - 16}
              y={y + 4}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fontWeight={600}
              fill="#18181B"
              className="font-body"
            >
              {d.stage}
            </text>
            {/* Count */}
            <text
              x={x - 8}
              y={y - 16}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={700}
              fill="#18181B"
              fontFamily="'Cascadia Code', monospace"
              className="font-mono tabular-nums"
            >
              {d.count.toLocaleString()}
            </text>
            {/* Conversion rate */}
            {i > 0 && (
              <text
                x={x - 8}
                y={y + 18}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill="#10B981"
                fontWeight={600}
                className="font-body"
              >
                {d.conversionRate.toFixed(1)}% ↗
              </text>
            )}
          </g>
        );
      })}

      {/* Y-axis grid lines */}
      <g stroke="#E2E8F0" strokeWidth={0.5} opacity={0.3}>
        {data.map((_, i) => (
          <line
            key={`grid-${i}`}
            x1={padding.left}
            x2={padding.left + innerWidth}
            y1={yScale(i)}
            y2={yScale(i)}
            strokeDasharray="2 4"
          />
        ))}
      </g>
    </svg>
  );
};

export const MetricsAndBarChart: React.FC<MetricsAndBarChartProps> = ({
  stats,
  skillsData = [],
  funnelData = [],
  onMetricClick,
  className,
}) => {
  const [skillsAnimated, setSkillsAnimated] = useState(false);
  const skillsSectionRef = useRef<HTMLDivElement>(null);

  // Trigger animation when skills section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSkillsAnimated(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (skillsSectionRef.current) {
      observer.observe(skillsSectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const metrics = [
    {
      key: 'discovered',
      title: 'Discovered',
      value: stats.new,
      subtitle: 'new this week',
      description: 'Total new positions found',
      trend: 'up' as const,
      trendValue: stats.new > 0 ? `+${stats.new}` : '+0',
      variant: 'discovered' as const,
      icon: <Target className="w-5 h-5" />,
    },
    {
      key: 'critical',
      title: 'ATS ≥90%',
      value: stats.criticalMatch,
      subtitle: 'Critical Match',
      description: 'Auto-apply eligible',
      trend: 'up' as const,
      trendValue: `${stats.criticalMatch} jobs`,
      variant: 'critical' as const,
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      key: 'flagged',
      title: 'ATS 80-89%',
      value: stats.flaggedReview,
      subtitle: 'Flagged Review',
      description: 'Human review required',
      trend: 'stable' as const,
      trendValue: `${stats.flaggedReview} jobs`,
      variant: 'flagged' as const,
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      key: 'signoff',
      title: 'Sign-Off Pending',
      value: stats.signOffPending,
      subtitle: 'Awaiting Human',
      description: 'Mandatory authorization',
      trend: 'up' as const,
      trendValue: `${stats.signOffPending} pending`,
      variant: 'signoff' as const,
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      key: 'submitted',
      title: 'Submitted',
      value: stats.submitted,
      subtitle: 'Applications Sent',
      description: 'Active pipeline',
      trend: 'up' as const,
      trendValue: `${stats.submitted} active`,
      variant: 'submitted' as const,
      icon: <TrendingUp className="w-5 h-5" />,
    },
  ];

  const defaultFunnelData = calculateFunnelData(stats);

  const displayFunnelData = funnelData.length > 0 ? funnelData : defaultFunnelData;

  return (
    <div className={cn('space-y-6', className)}>
      {/* 5 Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" role="region" aria-label="Pipeline metrics">
        {metrics.map((metric) => (
          <PipelineMetricCard
            key={metric.key}
            title={metric.title}
            value={metric.value}
            subtitle={metric.subtitle}
            trend={metric.trend}
            trendValue={metric.trendValue}
            icon={metric.icon}
            variant={metric.variant}
            onClick={() => onMetricClick?.(metric.key)}
            className="tactile"
          />
        ))}
      </div>

      {/* Skills Compatibility & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Compatibility Bars */}
        <div ref={skillsSectionRef} className="bg-surface-white raised border border-slate rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading font-bold text-base text-ink">Skills Compatibility</h3>
            <span className="font-mono text-xs text-text-secondary badge-muted px-2 py-0.5 rounded">
              {skillsData.length} skills
            </span>
          </div>

          {skillsData.length > 0 ? (
            <div className="space-y-4" role="list" aria-label="Skills compatibility bars">
              {skillsData.map((skill, index) => (
                <SkillBar
                  key={skill.skill}
                  skill={skill.skill}
                  compatibility={skill.compatibility}
                  category={skill.category}
                  index={index}
                  animated={skillsAnimated}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              <p className="font-body text-sm">No skills data available</p>
              <p className="font-body text-xs text-text-subtle mt-1">Run ATS matching to populate</p>
            </div>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-surface-white raised border border-slate rounded-xl p-5">
          <h3 className="font-heading font-bold text-base text-ink mb-5">Conversion Funnel</h3>
          <div className="h-[200px] flex items-center justify-center">
            <FunnelChart data={displayFunnelData} height={200} width={340} />
          </div>

          {/* Funnel summary */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 bg-success-emerald/10 rounded-lg border border-success-emerald/20">
              <span className="w-2 h-2 rounded-full bg-success-emerald" />
              <span className="font-body text-success-emerald font-medium">Advancing</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-amber-led/10 rounded-lg border border-amber-led/20">
              <span className="w-2 h-2 rounded-full bg-amber-led" />
              <span className="font-body text-amber-led font-medium">Review Needed</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-signoff-red/10 rounded-lg border border-signoff-red/20">
              <span className="w-2 h-2 rounded-full bg-signoff-red" />
              <span className="font-body text-signoff-red font-medium">Awaiting Sign-Off</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-brand-orange/10 rounded-lg border border-brand-orange/20">
              <span className="w-2 h-2 rounded-full bg-brand-orange" />
              <span className="font-body text-brand-orange font-medium">New Discovery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsAndBarChart;