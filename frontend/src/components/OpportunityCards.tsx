"use client";

import type { PlatformGapOpportunity } from "@/lib/types";
import {
  PLATFORM_LABELS,
  PLATFORM_COLORS,
  formatVolume,
  scoreColor,
  scoreBg,
} from "@/lib/platform-config";

interface Props {
  gaps: PlatformGapOpportunity[];
  overallScore: number;
}

export default function OpportunityCards({ gaps, overallScore }: Props) {
  if (!gaps.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center text-zinc-500">
        No platform gaps detected for this keyword.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div
        className={`rounded-2xl border p-5 flex items-center justify-between ${scoreBg(overallScore)}`}
      >
        <div>
          <p className="text-sm text-zinc-400">Overall Opportunity Score</p>
          <p className="text-xs text-zinc-500 mt-1">
            {gaps.length} gap{gaps.length !== 1 ? "s" : ""} detected across
            platforms
          </p>
        </div>
        <span className={`text-4xl font-bold ${scoreColor(overallScore)}`}>
          {overallScore.toFixed(0)}
        </span>
      </div>

      {/* Gap Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gaps.map((gap, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {gap.opportunity_type.replace(/_/g, " ")}
              </span>
              <span
                className={`text-sm font-bold ${scoreColor(gap.opportunity_score)}`}
              >
                {gap.opportunity_score.toFixed(0)}
              </span>
            </div>

            {/* Volume comparison */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        PLATFORM_COLORS[gap.high_volume_platform] || "#6366f1",
                    }}
                  />
                  <span className="text-xs text-zinc-400">
                    {PLATFORM_LABELS[gap.high_volume_platform]}
                  </span>
                </div>
                <p className="text-lg font-semibold text-zinc-100">
                  {formatVolume(gap.high_volume)}
                </p>
              </div>

              <svg
                className="h-5 w-5 text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>

              <div className="flex-1 text-right">
                <div className="flex items-center justify-end gap-1.5 mb-1">
                  <span className="text-xs text-zinc-400">
                    {PLATFORM_LABELS[gap.low_volume_platform]}
                  </span>
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        PLATFORM_COLORS[gap.low_volume_platform] || "#6366f1",
                    }}
                  />
                </div>
                <p className="text-lg font-semibold text-zinc-100">
                  {formatVolume(gap.low_volume)}
                </p>
              </div>
            </div>

            <div className="text-xs text-zinc-500 mb-3">
              {gap.volume_ratio.toFixed(1)}x volume ratio
            </div>

            <p className="text-sm text-zinc-400 leading-relaxed">
              {gap.recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
