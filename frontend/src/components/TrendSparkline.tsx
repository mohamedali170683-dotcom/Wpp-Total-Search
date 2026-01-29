"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: number[];
  color?: string;
  height?: number;
}

export default function TrendSparkline({
  data,
  color = "#6366f1",
  height = 40,
}: Props) {
  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${color})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
