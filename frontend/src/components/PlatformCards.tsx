"use client";

import type { CrossPlatformKeyword } from "@/lib/types";
import {
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  formatVolume,
  trendDirection,
} from "@/lib/platform-config";
import TrendSparkline from "./TrendSparkline";

interface Props {
  data: CrossPlatformKeyword;
}

export default function PlatformCards({ data }: Props) {
  const platforms = Object.entries(data.platforms).sort(
    ([, a], [, b]) => b.volume - a.volume
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {platforms.map(([key, pd]) => {
        const isPrimary = key === data.primary_platform;
        const color = PLATFORM_COLORS[key] || "#6366f1";
        const share =
          data.total_volume > 0
            ? ((pd.volume / data.total_volume) * 100).toFixed(1)
            : "0";
        const trend =
          pd.trend.length > 0 ? trendDirection(pd.trend) : null;

        return (
          <div
            key={key}
            className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            style={{ borderLeftWidth: "4px", borderLeftColor: color }}
          >
            {isPrimary && (
              <span className="absolute top-3 right-3 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                Primary
              </span>
            )}

            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="text-sm font-medium text-slate-700">
                {PLATFORM_LABELS[key] || key}
              </h3>
            </div>

            <p className="text-2xl font-bold text-slate-900 mb-0.5">
              {formatVolume(pd.volume)}
            </p>
            <p className="text-xs text-slate-400 mb-3">
              {share}% of total demand
            </p>

            <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
              {pd.cpc !== null && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  CPC: ${pd.cpc.toFixed(2)}
                </span>
              )}
              {pd.competition !== null && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  Competition: {(pd.competition * 100).toFixed(0)}%
                </span>
              )}
              {pd.is_estimated ? (
                <span className="rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5">
                  Estimated
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5">
                  Live Data
                </span>
              )}
            </div>

            {trend && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`text-xs font-medium ${trend.color}`}>
                  {trend.arrow} {trend.label}
                </span>
              </div>
            )}

            {pd.trend.length > 0 && (
              <TrendSparkline data={pd.trend} color={color} />
            )}
          </div>
        );
      })}
    </div>
  );
}
