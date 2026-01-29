"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
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

export default function PlatformVolumeChart({ data }: Props) {
  const chartData = Object.entries(data.platforms)
    .map(([key, pd]) => ({
      platform: PLATFORM_LABELS[key] || key,
      volume: pd.volume,
      color: PLATFORM_COLORS[key] || "#6366f1",
      key,
      share: data.total_volume > 0
        ? Number(((pd.volume / data.total_volume) * 100).toFixed(1))
        : 0,
    }))
    .sort((a, b) => b.volume - a.volume);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Platform Demand Comparison
        </h2>
        <span className="text-sm text-slate-500">
          Total: {formatVolume(data.total_volume)}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Bar chart — left */}
        <div className="flex-[3] h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
            >
              <XAxis
                type="number"
                tickFormatter={formatVolume}
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="platform"
                tick={{ fill: "#334155", fontSize: 13 }}
                axisLine={false}
                tickLine={false}
                width={80}
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
                itemStyle={{ color: "#64748b" }}
                formatter={(value) => [
                  Number(value).toLocaleString(),
                  "Monthly Volume",
                ]}
              />
              <Bar dataKey="volume" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart — right */}
        <div className="flex-[2] flex flex-col items-center justify-center">
          <p className="text-sm font-medium text-slate-600 mb-2">
            Demand Share
          </p>
          <div className="h-52 w-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="share"
                  nameKey="platform"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "13px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value) => [`${value}%`, "Share"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
            {chartData.map((entry) => (
              <div key={entry.key} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-slate-600">
                  {entry.platform} ({entry.share}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
