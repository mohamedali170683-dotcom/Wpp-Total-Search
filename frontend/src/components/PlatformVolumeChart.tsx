"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
    }))
    .sort((a, b) => b.volume - a.volume);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">
          Platform Volume Comparison
        </h2>
        <span className="text-sm text-zinc-400">
          Total: {formatVolume(data.total_volume)}
        </span>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 8, left: 0 }}
          >
            <XAxis
              dataKey="platform"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatVolume}
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "12px",
                fontSize: "13px",
              }}
              labelStyle={{ color: "#e4e4e7" }}
              itemStyle={{ color: "#a1a1aa" }}
              formatter={(value) => [
                Number(value).toLocaleString(),
                "Monthly Volume",
              ]}
            />
            <Bar dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
