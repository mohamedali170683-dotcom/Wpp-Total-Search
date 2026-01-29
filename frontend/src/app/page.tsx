"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import StatsRow from "@/components/StatsRow";
import PlatformVolumeChart from "@/components/PlatformVolumeChart";
import TrendChart from "@/components/TrendChart";
import OpportunityCards from "@/components/OpportunityCards";
import { getCrossPlatformKeyword } from "@/lib/api";
import { analyzeKeyword } from "@/lib/analyzer";
import { PLATFORM_LABELS, formatVolume, trendDirection } from "@/lib/platform-config";
import type { CrossPlatformKeyword, OpportunityAnalysis } from "@/lib/types";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywordData, setKeywordData] =
    useState<CrossPlatformKeyword | null>(null);
  const [opportunities, setOpportunities] =
    useState<OpportunityAnalysis | null>(null);

  async function handleSearch(keyword: string) {
    setLoading(true);
    setError(null);

    try {
      const kw = await getCrossPlatformKeyword(keyword);
      const opp = analyzeKeyword(kw);
      setKeywordData(kw);
      setOpportunities(opp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setKeywordData(null);
      setOpportunities(null);
    } finally {
      setLoading(false);
    }
  }

  // Insight banner computed values
  const platformCount = keywordData
    ? Object.keys(keywordData.platforms).length
    : 0;
  const primaryName = keywordData?.primary_platform
    ? PLATFORM_LABELS[keywordData.primary_platform] || keywordData.primary_platform
    : "";
  const primaryVolume = keywordData?.primary_platform
    ? keywordData.platforms[keywordData.primary_platform]?.volume ?? 0
    : 0;
  const primaryShare =
    keywordData && keywordData.total_volume > 0
      ? ((primaryVolume / keywordData.total_volume) * 100).toFixed(1)
      : "0";
  const primaryTrend = keywordData?.primary_platform
    ? keywordData.platforms[keywordData.primary_platform]?.trend ?? []
    : [];
  const trendInfo = primaryTrend.length >= 6 ? trendDirection(primaryTrend) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm">
                <svg
                  className="h-4.5 w-4.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-base font-bold text-slate-900">
                  Total Search
                </span>
                <span className="text-[10px] text-slate-400 ml-2 hidden sm:inline">
                  Cross-Platform Intelligence
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search Card */}
        <SearchBar onSearch={handleSearch} loading={loading} />

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {keywordData && (
          <>
            {/* Insight Banner */}
            <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 flex-shrink-0">
                    <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-1">
                      Where
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <span className="text-white font-semibold">{formatVolume(keywordData.total_volume)}</span> volume
                      across {platformCount} platforms.{" "}
                      <span className="text-white font-semibold">{primaryName}</span> leads
                      with {primaryShare}%.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 flex-shrink-0">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-1">
                      Momentum
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {trendInfo
                        ? `${primaryName} trend is ${trendInfo.label.toLowerCase()}. ${
                            trendInfo.label === "Growing"
                              ? "Rising demand signals detected."
                              : trendInfo.label === "Declining"
                                ? "Decreasing search interest."
                                : "Consistent demand over time."
                          }`
                        : "Analyzing trend data..."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 flex-shrink-0">
                    <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-1">
                      Coverage
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {platformCount} active platforms with search demand signals
                      detected for this keyword.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Search Distribution */}
            <SectionHeader number={1} title="Search Distribution" subtitle="Where the demand lives across platforms" />
            <StatsRow data={keywordData} />
            <PlatformVolumeChart data={keywordData} />

            {/* Section: 12-Month Trend */}
            <SectionHeader number={2} title="Monthly Trend" subtitle="How platform demand has changed over the past 12 months" />
            <TrendChart data={keywordData} />

            {/* Section: Growth Opportunities */}
            {opportunities && opportunities.platform_gaps.length > 0 && (
              <>
                <SectionHeader number={3} title="Growth Opportunities" subtitle="Platform gaps and untapped channels" />
                <OpportunityCards
                  gaps={opportunities.platform_gaps}
                  overallScore={opportunities.opportunity_score}
                />
              </>
            )}
          </>
        )}

        {/* Empty state */}
        {!keywordData && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="rounded-2xl bg-white border border-slate-200 p-8 shadow-sm text-center max-w-sm">
              <div className="mx-auto h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                No keyword selected
              </p>
              <p className="text-xs text-slate-400">
                Enter a keyword above to analyze cross-platform search demand
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 mt-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-xs font-medium text-slate-500">Total Search</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Cross-Platform Search Intelligence
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-4">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs font-bold shadow-sm">
        {number}
      </span>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
