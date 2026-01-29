"use client";

import type { PlatformGapOpportunity } from "@/lib/types";
import {
  PLATFORM_LABELS,
  PLATFORM_COLORS,
  formatVolume,
  scoreColor,
  scoreBg,
  scoreLabel,
} from "@/lib/platform-config";

interface Props {
  gaps: PlatformGapOpportunity[];
  overallScore: number;
}

export default function OpportunityCards({ gaps, overallScore }: Props) {
  if (!gaps.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        No platform gaps detected for this keyword.
      </div>
    );
  }

  const priorityLabel = (score: number) =>
    score >= 80 ? "High Priority" : score >= 60 ? "Medium Priority" : "Low Priority";
  const priorityBg = (score: number) =>
    score >= 80
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 60
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div
        className={`rounded-2xl border p-5 flex items-center justify-between ${scoreBg(overallScore)}`}
      >
        <div>
          <p className="text-sm font-medium text-slate-700">
            Overall Growth Potential
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {gaps.length} untapped channel{gaps.length !== 1 ? "s" : ""}{" "}
            detected — {scoreLabel(overallScore)} opportunity
          </p>
        </div>
        <span className={`text-4xl font-bold ${scoreColor(overallScore)}`}>
          {overallScore.toFixed(0)}
        </span>
      </div>

      {/* Gap Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gaps.map((gap, i) => {
          const actionVerb =
            gap.opportunity_type === "platform_gap" ||
            gap.opportunity_type === "volume_disparity"
              ? "Expand to"
              : "Grow on";
          const targetPlatform =
            PLATFORM_LABELS[gap.low_volume_platform] ||
            gap.low_volume_platform;

          return (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-800">
                  {actionVerb} {targetPlatform}
                </span>
                <span
                  className={`text-xs font-medium rounded-full border px-2.5 py-0.5 ${priorityBg(gap.opportunity_score)}`}
                >
                  {priorityLabel(gap.opportunity_score)}
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
                          PLATFORM_COLORS[gap.high_volume_platform] ||
                          "#6366f1",
                      }}
                    />
                    <span className="text-xs text-slate-500">
                      {PLATFORM_LABELS[gap.high_volume_platform]}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatVolume(gap.high_volume)}
                  </p>
                </div>

                <svg
                  className="h-5 w-5 text-slate-300"
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
                    <span className="text-xs text-slate-500">
                      {PLATFORM_LABELS[gap.low_volume_platform]}
                    </span>
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          PLATFORM_COLORS[gap.low_volume_platform] ||
                          "#6366f1",
                      }}
                    />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatVolume(gap.low_volume)}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-400 mb-3">
                {gap.volume_ratio.toFixed(1)}x volume gap
              </div>

              {/* Recommendation callout */}
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3">
                <p className="text-sm text-indigo-800 leading-relaxed">
                  {gap.recommendation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
