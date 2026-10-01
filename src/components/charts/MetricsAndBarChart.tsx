import React from "react";
import { Sparkles, FileText, CheckCircle2, AlertTriangle, Send, Clock, Layers } from "lucide-react";
import { Opportunity } from "../../types";

interface MetricsAndBarChartProps {
  opportunities: Opportunity[];
  onCardClick?: (filterType: string) => void;
  stats?: StatsData;
}

interface StatsData {
  discovered: number;
  critical_matches: number;
  flagged_matches: number;
  awaiting_signoff: number;
  submitted: number;
  skills_distribution: Array<{ label: string; count: number; percentage: number; color: string }>;
  pipeline_trend: Array<{ stage: string; count: number }>;
}

export const MetricsAndBarChart: React.FC<MetricsAndBarChartProps> = ({
  opportunities,
  onCardClick,
  stats,
}) => {
  const total = opportunities.length;
  const criticalMatches = opportunities.filter((o) => o.atsScore >= 90).length;
  const flaggedMatches = opportunities.filter((o) => o.atsScore >= 80 && o.atsScore < 90).length;
  const awaitingSignoff = opportunities.filter((o) => o.status === "awaiting_signoff").length;
  const submitted = opportunities.filter((o) => o.status === "submitted" || Boolean(o.receipt)).length;

  // Use provided stats data, fall back to defaults if not available
  const statsDiscovered = stats?.discovered ?? total;
  const statsCritical = stats?.critical_matches ?? criticalMatches;
  const statsFlagged = stats?.flagged_matches ?? flaggedMatches;
  const statsAwaitingSignoff = stats?.awaiting_signoff ?? awaitingSignoff;
  const statsSubmitted = stats?.submitted ?? submitted;

  // Skills distribution from stats or default data
  const skillsDistribution = stats?.skills_distribution ?? [
    { label: "Systems Architecture & MIS", count: 18, percentage: 92, color: "bg-[#F97316]" },
    { label: "n8n & Workflow Automation", count: 14, percentage: 88, color: "bg-[#18181B]" },
    { label: "Lilongwe Public Sector & USAID", count: 16, percentage: 95, color: "bg-emerald-600" },
    { label: "Full-Stack Development (React/TS)", count: 12, percentage: 84, color: "bg-[#475569]" },
    { label: "Consultancy Advisory & Proposals", count: 15, percentage: 90, color: "bg-[#DC2626]" },
  ];

  // Pipeline stage trend points from stats or default data
  const trendPoints = stats?.pipeline_trend ?? [
    { stage: "Scraped", count: 32 },
    { stage: "Evaluated", count: 28 },
    { stage: "≥90 Tailored", count: 19 },
    { stage: "Authorized", count: 12 },
    { stage: "Submitted", count: 8 },
  ];

  const maxTrend = 35;
  const graphWidth = 260;
  const graphHeight = 70;
  const padding = 15;

  const getTrendX = (index: number) => {
    return padding + (index / (trendPoints.length - 1)) * (graphWidth - padding * 2);
  };

  const getTrendY = (val: number) => {
    return graphHeight - padding - (val / maxTrend) * (graphHeight - padding * 2);
  };

  const trendPath = trendPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${getTrendX(i)},${getTrendY(p.count)}`)
    .join(" ");

  return (
    <div className="space-y-4">
      {/* Numerical Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Metric 1 */}
        <div
          onClick={() => onCardClick?.("all")}
          className="bg-white border border-[#E2E8F0] p-3.5 rounded-xl hover:border-[#CBD5E1] transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-[#64748B] text-xs font-medium mb-1">
            <span>Discovered</span>
            <Layers className="w-3.5 h-3.5 text-[#64748B]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#18181B] tracking-tight">{total}</div>
          <div className="text-[11px] text-[#64748B] mt-0.5">Across 4 platforms</div>
        </div>

        {/* Metric 2: ATS >= 90 */}
        <div
          onClick={() => onCardClick?.("critical")}
          className="bg-white border-l-4 border-l-[#F97316] border border-[#E2E8F0] p-3.5 rounded-xl hover:border-[#CBD5E1] transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-[#EA580C] text-xs font-semibold mb-1">
            <span>ATS ≥ 90 Match</span>
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#18181B] tracking-tight">{criticalMatches}</div>
          <div className="text-[11px] text-[#EA580C] mt-0.5 font-medium">Auto-Document Ready</div>
        </div>

        {/* Metric 3: ATS 80-89 Flagged */}
        <div
          onClick={() => onCardClick?.("flagged")}
          className="bg-white border-l-4 border-l-amber-500 border border-[#E2E8F0] p-3.5 rounded-xl hover:border-[#CBD5E1] transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold mb-1">
            <span>ATS 80-89 Flagged</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#18181B] tracking-tight">{flaggedMatches}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Review Queue</div>
        </div>

        {/* Metric 4: Awaiting Sign-off */}
        <div
          onClick={() => onCardClick?.("awaiting_signoff")}
          className="bg-white border-l-4 border-l-[#DC2626] border border-[#E2E8F0] p-3.5 rounded-xl hover:border-[#CBD5E1] transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-[#DC2626] text-xs font-semibold mb-1">
            <span>Human Sign-Off</span>
            <Clock className="w-3.5 h-3.5 text-[#DC2626]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#18181B] tracking-tight">{awaitingSignoff}</div>
          <div className="text-[11px] text-[#DC2626] mt-0.5 font-medium">Authorization Gate</div>
        </div>

        {/* Metric 5: Submitted Receipts */}
        <div
          onClick={() => onCardClick?.("submitted")}
          className="bg-white border-l-4 border-l-emerald-600 border border-[#E2E8F0] p-3.5 rounded-xl hover:border-[#CBD5E1] transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1">
            <span>Submitted Proofs</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#18181B] tracking-tight">{submitted}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Receipts Archived</div>
        </div>
      </div>

      {/* Secondary Graphs: Bar Chart & Line Graph with Data Point Markers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Skills Compatibility Bar Chart (2 columns span) */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Applicant Skills Compatibility (Semantic Fit)
              </h4>
              <p className="text-[11px] text-[#94A3B8]">Compared against Lilongwe & International requirements</p>
            </div>
            <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
              91.8% Average Match
            </span>
          </div>

          <div className="space-y-2.5">
            {skillsDistribution.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[#18181B]">{item.label}</span>
                  <span className="font-mono text-[#64748B] text-[11px]">
                    {item.percentage}% ({item.count} matched roles)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Line Graph with Data Point Markers: Pipeline Throughput */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Funnel Throughput
              </h4>
              <span className="text-[10px] font-mono text-[#F97316] bg-orange-50 px-1.5 py-0.5 rounded-sm">
                Live Conversion
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">Stage drop-off & sign-off velocity</p>
          </div>

          {/* SVG Line with Markers */}
          <div className="my-2 select-none">
            <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-18">
              <defs>
                <linearGradient id="lineOrangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F97316" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area under line */}
              <path
                d={`${trendPath} L ${getTrendX(trendPoints.length - 1)},${graphHeight - padding} L ${getTrendX(0)},${graphHeight - padding} Z`}
                fill="url(#lineOrangeGrad)"
              />

              {/* Main Line */}
              <path d={trendPath} fill="none" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />

              {/* Data Point Markers */}
              {trendPoints.map((pt, idx) => {
                const x = getTrendX(idx);
                const y = getTrendY(pt.count);
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r={4} fill="#FFFFFF" stroke="#F97316" strokeWidth={2} />
                    <text x={x} y={graphHeight - 2} textAnchor="middle" fontSize="8" fill="#64748B">
                      {pt.stage}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="pt-2 border-t border-[#F1F5F9] flex justify-between items-center text-[11px]">
            <span className="text-[#64748B]">Scraped to Submit Ratio</span>
            <span className="font-mono font-bold text-[#18181B]">25.0% Conversion</span>
          </div>
        </div>
      </div>
    </div>
  );
};
