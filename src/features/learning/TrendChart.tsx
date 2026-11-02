import React from 'react';

interface TrendChartProps {
  title: string;
  data: number[];
  unit?: string;
  strokeColor?: string;
  height?: number;
  width?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  unit = '',
  strokeColor = 'var(--accent, #6366f1)',
  height = 100,
  width = 300,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="trend-chart-empty" aria-label={`${title}: no data`}>
        <small>—</small>
      </div>
    );
  }

  const padding = 16;
  const chartWidth = width;
  const chartHeight = height;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const points = data.map((val, idx) => {
    const x =
      data.length === 1
        ? chartWidth / 2
        : padding + (idx / (data.length - 1)) * (chartWidth - padding * 2);
    const y =
      chartHeight - padding - ((val - minVal) / range) * (chartHeight - padding * 2);
    return { x, y, val };
  });

  const pathD =
    points.length === 1
      ? `M ${points[0].x - 10} ${points[0].y} L ${points[0].x + 10} ${points[0].y}`
      : points.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

  const summaryText = `${title}: ${data.length} sessions recorded. Latest value: ${data[data.length - 1]}${unit}. Range: ${minVal} - ${maxVal}${unit}.`;

  return (
    <div className="trend-chart-container">
      <div className="chart-header">
        <span className="chart-title">{title}</span>
        <span className="chart-latest">
          {data[data.length - 1]}
          {unit}
        </span>
      </div>
      <svg
        className="trend-chart-svg"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label={summaryText}
      >
        <desc>{summaryText}</desc>
        {/* Baseline grid */}
        <line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeDasharray="4 4"
        />
        <line
          x1={padding}
          y1={padding}
          x2={chartWidth - padding}
          y2={padding}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeDasharray="4 4"
        />
        {/* Trend line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill={strokeColor}
            stroke="var(--bg-card, #1e1e24)"
            strokeWidth="1.5"
          >
            <title>{`Session ${idx + 1}: ${p.val}${unit}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

export default TrendChart;
