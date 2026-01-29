"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CrossPlatformKeyword } from "@/lib/types";
import {
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  formatVolume,
} from "@/lib/platform-config";

interface Props {
  data: CrossPlatformKeyword;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function TrendChart({ data }: Props) {
  const platforms = Object.entries(data.platforms)
    .filter(([, pd]) => pd.trend.length > 0)
    .sort(([, a], [, b]) => b.volume - a.volume);

  if (platforms.length === 0) return null;

  // Build chart data: each row is a month with a column per platform
  const maxLen = Math.max(...platforms.map(([, pd]) => pd.trend.length));
  const now = new Date();
  const chartData = Array.from({ length: maxLen }, (_, i) => {
    const monthIdx = (now.getMonth() - maxLen + 1 + i + 12) % 12;
    const row: Record<string, string | number> = {
      month: MONTH_LABELS[monthIdx],
    };
    for (const [key, pd] of platforms) {
      row[key] = pd.trend[i] ?? 0;
    }
    return row;
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-base font-semibold text-slate-900">
          12-Month Search Trend
        </h3>
        <span className="text-xs text-slate-400">
          Monthly volume by platform
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        How search demand has evolved across channels over the past year
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              {platforms.map(([key]) => (
                <linearGradient
                  key={key}
                  id={`trend-grad-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={PLATFORM_COLORS[key] || "#6366f1"}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="100%"
                    stopColor={PLATFORM_COLORS[key] || "#6366f1"}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              ))}
            </defs>
            <XAxis
              dataKey="month"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatVolume}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "13px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ color: "#0f172a", fontWeight: 600 }}
              formatter={(value, name) => [
                Number(value).toLocaleString(),
                PLATFORM_LABELS[String(name)] || String(name),
              ]}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", paddingBottom: "8px" }}
              formatter={(value: string) =>
                PLATFORM_LABELS[value] || value
              }
            />
            {platforms.map(([key]) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={PLATFORM_COLORS[key] || "#6366f1"}
                strokeWidth={2}
                fill={`url(#trend-grad-${key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
