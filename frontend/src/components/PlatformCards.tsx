"use client";

import type { CrossPlatformKeyword } from "@/lib/types";
import {
  PLATFORM_COLORS,
  PLATFORM_LABELS,
  formatVolume,
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

        return (
          <div
            key={key}
            className={`relative rounded-2xl border p-5 transition-colors ${
              isPrimary
                ? "border-indigo-500/40 bg-indigo-500/5"
                : "border-zinc-800 bg-zinc-900/60"
            }`}
          >
            {isPrimary && (
              <span className="absolute top-3 right-3 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
                Primary
              </span>
            )}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <h3 className="text-sm font-medium text-zinc-300">
                {PLATFORM_LABELS[key] || key}
              </h3>
            </div>

            <p className="text-2xl font-bold text-zinc-100 mb-1">
              {formatVolume(pd.volume)}
            </p>

            <div className="flex gap-4 text-xs text-zinc-500 mb-3">
              {pd.cpc !== null && <span>CPC: ${pd.cpc.toFixed(2)}</span>}
              {pd.competition !== null && (
                <span>Competition: {(pd.competition * 100).toFixed(0)}%</span>
              )}
              {pd.is_estimated && <span className="text-amber-500">Est.</span>}
            </div>

            {pd.trend.length > 0 && (
              <TrendSparkline data={pd.trend} color={color} />
            )}
          </div>
        );
      })}
    </div>
  );
}
