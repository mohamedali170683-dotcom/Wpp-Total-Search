"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { CrossPlatformKeyword } from "@/lib/types";
import {
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  formatVolume,
  trendDirection,
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
      share:
        data.total_volume > 0
          ? Number(((pd.volume / data.total_volume) * 100).toFixed(1))
          : 0,
      isEstimated: pd.is_estimated,
      trend: pd.trend.length >= 6 ? trendDirection(pd.trend) : null,
    }))
    .sort((a, b) => b.volume - a.volume);

  const maxVolume = chartData[0]?.volume || 1;

  const primaryLabel = data.primary_platform
    ? PLATFORM_LABELS[data.primary_platform] || data.primary_platform
    : "N/A";
  const primaryVolume = data.primary_platform
    ? data.platforms[data.primary_platform]?.volume ?? 0
    : 0;
  const primaryShare =
    data.total_volume > 0
      ? ((primaryVolume / data.total_volume) * 100).toFixed(1)
      : "0";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* LEFT: Search Distribution */}
      <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Search Distribution
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Volume share across platforms
        </p>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Donut chart with center label */}
          <div className="relative flex-shrink-0 w-44 h-44 mx-auto md:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="share"
                  nameKey="platform"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-900">
                {formatVolume(data.total_volume)}
              </span>
              <span className="text-[10px] text-slate-400">Total Volume</span>
            </div>
          </div>

          {/* Platform breakdown list */}
          <div className="flex-1 space-y-3 w-full">
            {chartData.map((entry) => (
              <div key={entry.key} className="flex items-center gap-2.5">
                {/* Color dot */}
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                {/* Platform name */}
                <span className="text-sm text-slate-700 w-20 flex-shrink-0">
                  {entry.platform}
                </span>
                {/* Percentage badge */}
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                >
                  {entry.share}%
                </span>
                {/* Volume bar */}
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden min-w-[40px]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(entry.volume / maxVolume) * 100}%`,
                      backgroundColor: entry.color,
                    }}
                  />
                </div>
                {/* Volume + trend */}
                <span className="text-xs text-slate-500 w-24 text-right flex-shrink-0">
                  {formatVolume(entry.volume)}
                  <span className="text-[10px] text-slate-400"> monthly</span>
                </span>
                {entry.trend && (
                  <span
                    className={`text-xs flex-shrink-0 ${entry.trend.color}`}
                  >
                    {entry.trend.arrow}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Volume Overview */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Volume Overview
        </h3>

        <p className="text-3xl font-bold text-slate-900 mt-4">
          {data.total_volume.toLocaleString()}
        </p>
        <p className="text-sm text-slate-500 mt-1">Total Monthly Volume</p>

        <p className="text-sm text-slate-600 mt-3 mb-6">
          <span className="font-semibold text-slate-900">{primaryLabel}</span>{" "}
          leads with{" "}
          <span className="font-semibold text-slate-900">{primaryShare}%</span>{" "}
          of total volume
        </p>

        <div className="border-t border-slate-100 pt-4 flex-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            VOLUME BY PLATFORM
          </p>
          <div className="space-y-3">
            {chartData.map((entry) => (
              <div
                key={entry.key}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-slate-700">
                    {entry.platform}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {entry.volume.toLocaleString()}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                      entry.isEstimated
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                    }`}
                  >
                    {entry.isEstimated ? "EST" : "LIVE"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Data aggregated from multiple sources
          </p>
        </div>
      </div>
    </div>
  );
}
