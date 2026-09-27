import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/athena/utils';

export interface LayeredMountainChartDataPoint {
  name: string;
  globalRemote: number;
  lilongweHub: number;
  consultancies: number;
}

interface LayeredMountainChartProps {
  data: LayeredMountainChartDataPoint[];
  height?: number;
  className?: string;
  onDataPointClick?: (point: LayeredMountainChartDataPoint, layer: string) => void;
}

const LAYER_CONFIG = [
  {
    id: 'globalRemote',
    label: 'Global Remote',
    color: '#F97316',
    gradient: 'url(#gradient-global-remote)',
    strokeWidth: 3,
    fillOpacity: 0.25,
    strokeDasharray: 'none',
  },
  {
    id: 'lilongweHub',
    label: 'Lilongwe Hub',
    color: '#1E2024',
    gradient: 'url(#gradient-lilongwe-hub)',
    strokeWidth: 2,
    fillOpacity: 0.2,
    strokeDasharray: 'none',
  },
  {
    id: 'consultancies',
    label: 'Consultancies',
    color: '#DC2626',
    gradient: 'url(#gradient-consultancies)',
    strokeWidth: 3,
    fillOpacity: 0.15,
    strokeDasharray: '8 6',
  },
] as const;

type LayerId = 'globalRemote' | 'lilongweHub' | 'consultancies';

export const LayeredMountainChart: React.FC<LayeredMountainChartProps> = ({
  data,
  height = 300,
  className,
  onDataPointClick,
}) => {
  const [visibleLayers, setVisibleLayers] = useState<Set<LayerId>>(new Set(['globalRemote', 'lilongweHub', 'consultancies']));
  const [hoveredPoint, setHoveredPoint] = useState<{ point: LayeredMountainChartDataPoint; layer: LayerId; x: number; y: number } | null>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 800, height: 300 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Update dimensions on resize
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setChartDimensions({ width, height });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [height]);

  const toggleLayer = (layerId: LayerId) => {
    setVisibleLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  const maxValue = useMemo(() => {
    let max = 0;
    for (const point of data) {
      for (const layer of LAYER_CONFIG) {
        max = Math.max(max, point[layer.id]);
      }
    }
    return max || 100;
  }, [data]);

  const padding = { top: 40, right: 60, bottom: 60, left: 60 };
  const innerWidth = chartDimensions.width - padding.left - padding.right;
  const innerHeight = chartDimensions.height - padding.top - padding.bottom;

  const xScale = (index: number) => padding.left + (index / Math.max(1, data.length - 1)) * innerWidth;
  const yScale = (value: number) => padding.top + innerHeight - (value / maxValue) * innerHeight * 0.85;

  const generateMountainPath = (layerId: LayerId, fillToBottom = false): string => {
    if (data.length === 0) return '';

    const points: string[] = [];

    // Start from bottom-left if filling
    if (fillToBottom) {
      points.push(`${xScale(0)},${padding.top + innerHeight}`);
    }

    // Add data points
    data.forEach((point, i) => {
      const x = xScale(i);
      const y = yScale(point[layerId]);
      points.push(`${x},${y}`);
    });

    // Close to bottom-right if filling
    if (fillToBottom) {
      points.push(`${xScale(data.length - 1)},${padding.top + innerHeight}`);
      points.push(`${xScale(0)},${padding.top + innerHeight}`);
    }

    return points.join(' ');
  };

  const generateTopographicLines = () => {
    const lines: React.ReactNode[] = [];
    const numLines = 8;
    for (let i = 1; i < numLines; i++) {
      const y = padding.top + innerHeight - (i / numLines) * innerHeight * 0.85;
      lines.push(
        <line
          key={`topo-${i}`}
          x1={padding.left}
          x2={padding.left + innerWidth}
          y1={y}
          y2={y}
          stroke="#E2E8F0"
          strokeWidth={0.5}
          strokeDasharray="4 8"
          opacity={0.4}
        />
      );
    }
    return lines;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find closest data point
    let closestIndex = 0;
    let closestDistance = Infinity;

    data.forEach((_, i) => {
      const x = xScale(i);
      const distance = Math.abs(mouseX - x);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    });

    const point = data[closestIndex];
    const x = xScale(closestIndex);

    // Find which layer is closest to mouse Y
    let closestLayer: LayerId = 'globalRemote';
    let closestLayerDistance = Infinity;

    for (const layer of LAYER_CONFIG) {
      if (!visibleLayers.has(layer.id)) continue;
      const y = yScale(point[layer.id]);
      const distance = Math.abs(mouseY - y);
      if (distance < closestLayerDistance) {
        closestLayerDistance = distance;
        closestLayer = layer.id;
      }
    }

    if (closestLayerDistance < 30) {
      const y = yScale(point[closestLayer]);
      setHoveredPoint({ point, layer: closestLayer, x, y });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handlePointClick = (point: LayeredMountainChartDataPoint, layer: LayerId) => {
    onDataPointClick?.(point, layer);
  };

  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center bg-surface-white raised border border-slate rounded-xl', className)} style={{ height }}>
        <p className="font-body text-text-secondary">No pipeline source data available</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-surface-white raised border border-slate rounded-xl overflow-hidden', className)} style={{ height }} ref={containerRef}>
      {/* Layer Toggles */}
      <div className="px-4 py-3 border-b border-slate flex flex-wrap items-center gap-3">
        <span className="font-heading font-bold text-sm text-ink">Pipeline Sources</span>
        <div className="flex items-center gap-3 flex-wrap">
          {LAYER_CONFIG.map((layer) => (
            <label key={layer.id} className="flex items-center gap-2 cursor-pointer tactile">
              <input
                type="checkbox"
                checked={visibleLayers.has(layer.id)}
                onChange={() => toggleLayer(layer.id)}
                className="w-4 h-4 rounded border-slate text-brand-orange focus:ring-brand-orange accent-brand-orange"
                aria-label={`Show ${layer.label} layer`}
              />
              <span
                className="flex items-center gap-1.5 font-body text-sm text-text-secondary"
                style={{ color: visibleLayers.has(layer.id) ? layer.color : '#94A3B8' }}
              >
                <span
                  className="w-3 h-0.5 rounded"
                  style={{
                    background: layer.id === 'consultancies'
                      ? `repeating-linear-gradient(90deg, ${layer.color}, ${layer.color} 4px, transparent 4px, transparent 8px)`
                      : layer.color,
                    opacity: visibleLayers.has(layer.id) ? 1 : 0.4,
                  }}
                />
                {layer.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Chart SVG */}
      <svg
        width="100%"
        height={chartDimensions.height}
        viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full"
        role="img"
        aria-label="Pipeline sources mountain chart"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="gradient-global-remote" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F97316" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#F97316" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradient-lilongwe-hub" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E2024" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#1E2024" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradient-consultancies" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DC2626" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#DC2626" stopOpacity={0.01} />
          </linearGradient>

          {/* Topographic pattern */}
          <pattern id="topo-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
            <circle cx="10" cy="10" r="0.5" fill="#E2E8F0" opacity="0.3" />
          </pattern>
        </defs>

        {/* Background grid */}
        <rect
          x={padding.left}
          y={padding.top}
          width={innerWidth}
          height={innerHeight * 0.85}
          fill="url(#topo-pattern)"
          opacity="0.5"
        />

        {/* Topographic contour lines */}
        <g stroke="#E2E8F0" strokeWidth={0.5} strokeDasharray="4 8" opacity="0.3">
          {generateTopographicLines()}
        </g>

        {/* Y-axis labels */}
        <g fontFamily="Arial, sans-serif" fontSize={11} fill="#64748B" fontWeight={500}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <text
              key={`y-${ratio}`}
              x={padding.left - 12}
              y={padding.top + innerHeight - ratio * innerHeight * 0.85 + 4}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {Math.round(maxValue * ratio * 0.85).toLocaleString()}
            </text>
          ))}
        </g>

        {/* X-axis labels */}
        <g fontFamily="Arial, sans-serif" fontSize={11} fill="#64748B" fontWeight={500}>
          {data.map((point, i) => (
            <text
              key={`x-${i}`}
              x={xScale(i)}
              y={padding.top + innerHeight * 0.85 + padding.bottom - 10}
              textAnchor="middle"
              dominantBaseline="hanging"
              transform={`rotate(-20 ${xScale(i)} ${padding.top + innerHeight * 0.85 + padding.bottom - 10})`}
            >
              {point.name}
            </text>
          ))}
        </g>

        {/* Mountain layers (filled areas) - drawn back to front */}
        {LAYER_CONFIG.slice().reverse().map((layer) => {
          if (!visibleLayers.has(layer.id)) return null;
          return (
            <g key={layer.id}>
              {/* Filled polygon */}
              <polygon
                points={generateMountainPath(layer.id, true)}
                fill={layer.gradient}
                opacity={layer.fillOpacity}
                filter="drop-shadow(0 4px 8px rgba(0,0,0,0.1))"
                onClick={() => handlePointClick(data[data.length - 1], layer.id)}
              />
              {/* Mountain peak line */}
              <polyline
                points={generateMountainPath(layer.id, false)}
                fill="none"
                stroke={layer.color}
                strokeWidth={layer.strokeWidth}
                strokeDasharray={layer.strokeDasharray || 'none'}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                onClick={() => handlePointClick(data[data.length - 1], layer.id)}
              />
            </g>
          );
        })}

        {/* Data point circles and hover effects */}
        {visibleLayers.size > 0 && data.map((point, i) => (
          <g key={`points-${i}`}>
            {LAYER_CONFIG.map((layer) => {
              if (!visibleLayers.has(layer.id)) return null;
              const y = yScale(point[layer.id]);
              const x = xScale(i);
              const isHovered = hoveredPoint?.point === point && hoveredPoint?.layer === layer.id;

              return (
                <g
                  key={`${layer.id}-${i}`}
                  onClick={() => handlePointClick(point, layer.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Circle - expands on hover */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 7 : 4}
                    fill={layer.color}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    className={cn('transition-all duration-200 ease-out', isHovered && 'filter-drop-shadow-[0_0_8px_currentColor]')}
                    style={{ filter: isHovered ? 'drop-shadow(0 0 8px currentColor)' : 'none' }}
                  />
                  {/* Hover ring */}
                  {isHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r={10}
                      fill="none"
                      stroke={layer.color}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      opacity={0.6}
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}
          </g>
        ))}

        {/* Hover tooltip */}
        {hoveredPoint && (
          <g>
            <foreignObject
              x={Math.min(hoveredPoint.x + 20, chartDimensions.width - 220)}
              y={Math.max(hoveredPoint.y - 100, padding.top + 10)}
              width={200}
              height={90}
              pointerEvents="none"
            >
              <div className="bg-ink text-white rounded-lg p-3 shadow-2xl raised border border-slate-minimal text-xs font-body leading-tight min-w-[180px]">
                <div className="font-bold text-brand-orange mb-1">{hoveredPoint.point.name}</div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LAYER_CONFIG.find(l => l.id === hoveredPoint!.layer)!.color }} />
                  <span className="font-medium">{LAYER_CONFIG.find(l => l.id === hoveredPoint!.layer)!.label}</span>
                </div>
                <div className="font-mono font-bold text-lg tabular-nums">
                  {hoveredPoint.point[hoveredPoint.layer].toLocaleString()}
                </div>
              </div>
            </foreignObject>
{/* Tooltip pointer */}
            <polygon
              points={ `${hoveredPoint.x + 10},${hoveredPoint.y - 20} ${hoveredPoint.x + 20},${hoveredPoint.y - 10} ${hoveredPoint.x + 10},${hoveredPoint.y}` }
              fill="#18181B"
              pointerEvents="none"
            />
          </g>
        )}
      </svg>
    </div>
  );
};

export default LayeredMountainChart;