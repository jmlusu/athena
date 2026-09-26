import React, { useState } from "react";
import { TrendingUp, Sparkles, Compass, Eye } from "lucide-react";
import { Opportunity } from "../../types";

interface DataPoint {
  timeLabel: string;
  lilongweOpportunities: number;
  remoteOpportunities: number;
  consultancies: number;
  atsAverage: number;
}

const defaultTimelineData: DataPoint[] = [
  { timeLabel: "00:00 (Run 1)", lilongweOpportunities: 12, remoteOpportunities: 18, consultancies: 8, atsAverage: 84 },
  { timeLabel: "04:00 (Run 2)", lilongweOpportunities: 16, remoteOpportunities: 25, consultancies: 11, atsAverage: 87 },
  { timeLabel: "08:00 (Run 3)", lilongweOpportunities: 22, remoteOpportunities: 34, consultancies: 17, atsAverage: 91 },
  { timeLabel: "12:00 (Run 4)", lilongweOpportunities: 29, remoteOpportunities: 42, consultancies: 21, atsAverage: 93 },
  { timeLabel: "16:00 (Run 5)", lilongweOpportunities: 36, remoteOpportunities: 53, consultancies: 28, atsAverage: 92 },
  { timeLabel: "20:00 (Current)", lilongweOpportunities: 44, remoteOpportunities: 65, consultancies: 34, atsAverage: 95 },
];

export const LayeredMountainChart: React.FC<{
  title?: string;
  subtitle?: string;
  opportunities?: Opportunity[];
  onSelectScope?: (scope: string) => void;
  onFilterClick?: (metric: string) => void;
}> = ({
  title = "Athena Opportunity Momentum & Market Dynamics",
  subtitle = "4-Hour Scheduled Scrapes • Lilongwe Local, Lilongwe Remote & Global International Hubs",
  opportunities,
  onSelectScope,
  onFilterClick,
}) => {
  const [activeLayer, setActiveLayer] = useState<"all" | "lilongwe" | "remote" | "consultancies">("all");
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  // SVG dimensions
  const width = 820;
  const height = 230;
  const paddingX = 40;
  const paddingY = 25;

  const maxVal = 70;
  const data = defaultTimelineData;

  const getX = (index: number) => {
    return paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    return height - paddingY - (val / maxVal) * (height - paddingY * 2);
  };

  // Build SVG polygon paths for mountain layers
  const buildAreaPath = (getter: (d: DataPoint) => number) => {
    const points = data.map((d, i) => `${getX(i)},${getY(getter(d))}`);
    const firstX = getX(0);
    const lastX = getX(data.length - 1);
    const bottomY = height - paddingY;
    return `M ${firstX},${bottomY} L ${points.join(" L ")} L ${lastX},${bottomY} Z`;
  };

  const buildLinePath = (getter: (d: DataPoint) => number) => {
    return data.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)},${getY(getter(d))}`).join(" ");
  };

  const pathRemote = buildAreaPath((d) => d.remoteOpportunities);
  const pathLilongwe = buildAreaPath((d) => d.lilongweOpportunities);
  const pathConsultancies = buildAreaPath((d) => d.consultancies);

  const lineRemote = buildLinePath((d) => d.remoteOpportunities);
  const lineLilongwe = buildLinePath((d) => d.lilongweOpportunities);
  const lineConsultancies = buildLinePath((d) => d.consultancies);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#F97316] animate-pulse" />
            <h3 className="font-serif-heading text-lg font-semibold text-[#18181B] tracking-tight">{title}</h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-1.5 bg-[#F4F5F7] p-1 rounded-lg border border-[#E2E8F0] text-xs">
          <button
            onClick={() => setActiveLayer("all")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeLayer === "all" ? "bg-[#18181B] text-white shadow-xs" : "text-[#64748B] hover:text-[#18181B]"
            }`}
          >
            All Streams
          </button>
          <button
            onClick={() => setActiveLayer("remote")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeLayer === "remote" ? "bg-[#F97316] text-white shadow-xs" : "text-[#64748B] hover:text-[#18181B]"
            }`}
          >
            Global Remote
          </button>
          <button
            onClick={() => setActiveLayer("lilongwe")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeLayer === "lilongwe" ? "bg-[#475569] text-white shadow-xs" : "text-[#64748B] hover:text-[#18181B]"
            }`}
          >
            Lilongwe Hub
          </button>
          <button
            onClick={() => setActiveLayer("consultancies")}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeLayer === "consultancies" ? "bg-[#DC2626] text-white shadow-xs" : "text-[#64748B] hover:text-[#18181B]"
            }`}
          >
            Consultancies
          </button>
        </div>
      </div>

      {/* Abstract Layered Mountain Area Chart */}
      <div className="relative w-full overflow-hidden bg-radial from-[#FFFBF7] via-white to-[#F8F9FA] rounded-lg border border-[#F1F5F9]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" preserveAspectRatio="none">
          <defs>
            {/* Mountain Layer 1: Warm Orange to Soft Amber gradient */}
            <linearGradient id="mountainOrange" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#FB923C" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.02" />
            </linearGradient>

            {/* Mountain Layer 2: Dark Charcoal / Slate gradient */}
            <linearGradient id="mountainCharcoal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E2024" stopOpacity="0.32" />
              <stop offset="70%" stopColor="#475569" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.01" />
            </linearGradient>

            {/* Mountain Layer 3: Red / Coral accent gradient */}
            <linearGradient id="mountainRed" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.25" />
              <stop offset="80%" stopColor="#EF4444" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>

            {/* Subtle Grid Pattern for mountain topographic texture */}
            <pattern id="mountainTexture" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 0 20 L 20 0 M 0 0 L 20 20" fill="none" stroke="#F1F5F9" strokeWidth="0.75" />
            </pattern>
          </defs>

          {/* Topographic background grid */}
          <rect width={width} height={height} fill="url(#mountainTexture)" opacity="0.4" />

          {/* Horizontal guideline levels */}
          {[15, 30, 45, 60].map((val) => (
            <g key={val}>
              <line
                x1={paddingX}
                y1={getY(val)}
                x2={width - paddingX}
                y2={getY(val)}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text x={paddingX - 10} y={getY(val) + 3} textAnchor="end" fontSize="10" fill="#94A3B8">
                {val}
              </text>
            </g>
          ))}

          {/* Layer 1 (Global Remote Mountains) */}
          {(activeLayer === "all" || activeLayer === "remote") && (
            <g className="transition-all duration-300">
              <path d={pathRemote} fill="url(#mountainOrange)" />
              <path d={lineRemote} fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* Layer 2 (Lilongwe Local & Remote Hub Mountains) */}
          {(activeLayer === "all" || activeLayer === "lilongwe") && (
            <g className="transition-all duration-300">
              <path d={pathLilongwe} fill="url(#mountainCharcoal)" />
              <path d={lineLilongwe} fill="none" stroke="#1E2024" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          )}

          {/* Layer 3 (High-Value Consultancies Mountains) */}
          {(activeLayer === "all" || activeLayer === "consultancies") && (
            <g className="transition-all duration-300">
              <path d={pathConsultancies} fill="url(#mountainRed)" />
              <path d={lineConsultancies} fill="none" stroke="#DC2626" strokeWidth="2" strokeDasharray="5 3" />
            </g>
          )}

          {/* Data Points on the primary line */}
          {data.map((pt, idx) => {
            const x = getX(idx);
            const y = getY(pt.remoteOpportunities);
            const isHovered = hoveredPoint?.timeLabel === pt.timeLabel;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#F97316"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all"
                />
                {/* Time Axis Labels */}
                <text x={x} y={height - 8} textAnchor="middle" fontSize="10.5" fill="#64748B" fontWeight="500">
                  {pt.timeLabel.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover inspection pill */}
        {hoveredPoint && (
          <div className="absolute top-3 right-4 bg-[#18181B] text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-neutral-700 flex items-center gap-3">
            <div>
              <span className="text-[#94A3B8] block text-[10px] uppercase font-mono">{hoveredPoint.timeLabel}</span>
              <span className="font-semibold text-white">Global: {hoveredPoint.remoteOpportunities}</span>
              <span className="text-[#CBD5E1] mx-1.5">•</span>
              <span className="text-[#FB923C]">Lilongwe: {hoveredPoint.lilongweOpportunities}</span>
              <span className="text-[#CBD5E1] mx-1.5">•</span>
              <span className="text-[#EF4444]">Consultancies: {hoveredPoint.consultancies}</span>
            </div>
            <div className="border-l border-neutral-700 pl-2 text-right">
              <span className="text-[10px] text-[#94A3B8] block">Avg ATS Match</span>
              <span className="text-emerald-400 font-bold">{hoveredPoint.atsAverage}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Telemetry stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-xs bg-[#F97316]" />
          <div>
            <div className="text-[11px] text-[#64748B]">Global Remote</div>
            <div className="text-sm font-semibold text-[#18181B]">65 Active</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-xs bg-[#1E2024]" />
          <div>
            <div className="text-[11px] text-[#64748B]">Lilongwe Local/Hub</div>
            <div className="text-sm font-semibold text-[#18181B]">44 Sourced</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-xs bg-[#DC2626]" />
          <div>
            <div className="text-[11px] text-[#64748B]">Consultancies (MW/Intl)</div>
            <div className="text-sm font-semibold text-[#18181B]">34 Sourced</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-xs bg-emerald-500" />
          <div>
            <div className="text-[11px] text-[#64748B]">Avg ATS Fit Index</div>
            <div className="text-sm font-semibold text-emerald-600">95% Qualified</div>
          </div>
        </div>
      </div>
    </div>
  );
};
