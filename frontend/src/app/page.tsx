"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import StatsRow from "@/components/StatsRow";
import PlatformVolumeChart from "@/components/PlatformVolumeChart";
import OpportunityCards from "@/components/OpportunityCards";
import BrandAudit from "@/components/BrandAudit";
import { getCrossPlatformKeyword } from "@/lib/api";
import { analyzeKeyword } from "@/lib/analyzer";
import { PLATFORM_LABELS, formatVolume, trendDirection } from "@/lib/platform-config";
import type { CrossPlatformKeyword, OpportunityAnalysis } from "@/lib/types";

type ActiveSection = "keywords" | "demand" | "compare" | "brand-audit";

export default function Home() {
  const [activeSection, setActiveSection] =
    useState<ActiveSection>("keywords");
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

  // Compute insight banner data
  const platformCount = keywordData
    ? Object.keys(keywordData.platforms).length
    : 0;
  const primaryName = keywordData?.primary_platform
    ? PLATFORM_LABELS[keywordData.primary_platform] ||
      keywordData.primary_platform
    : "";
  const primaryVolume =
    keywordData?.primary_platform
      ? keywordData.platforms[keywordData.primary_platform]?.volume ?? 0
      : 0;
  const primaryShare =
    keywordData && keywordData.total_volume > 0
      ? ((primaryVolume / keywordData.total_volume) * 100).toFixed(1)
      : "0";
  const primaryTrend =
    keywordData?.primary_platform
      ? keywordData.platforms[keywordData.primary_platform]?.trend ?? []
      : [];
  const trendInfo =
    primaryTrend.length >= 6 ? trendDirection(primaryTrend) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <svg
                  className="h-4 w-4 text-white"
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
              <span className="text-base font-semibold text-slate-900">
                Total Search
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Cross-Platform Search Intelligence
              </span>
            </div>

            {/* Nav — underline tabs */}
            <nav className="flex items-center gap-1">
              {([
                { key: "keywords", label: "Keywords", enabled: true },
                { key: "demand", label: "Demand", enabled: false },
                { key: "compare", label: "Compare", enabled: false },
                { key: "brand-audit", label: "Brand Audit", enabled: true },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => tab.enabled && setActiveSection(tab.key)}
                  disabled={!tab.enabled}
                  className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeSection === tab.key
                      ? "border-indigo-600 text-indigo-600"
                      : tab.enabled
                        ? "border-transparent text-slate-500 hover:text-slate-700"
                        : "border-transparent text-slate-300 cursor-not-allowed"
                  }`}
                >
                  {tab.label}
                  {!tab.enabled && (
                    <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                      Soon
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {activeSection === "keywords" && (
          <>
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
                <div className="rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 p-5 text-white">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider mb-1">
                        WHERE
                      </p>
                      <p className="text-sm text-white/90">
                        {formatVolume(keywordData.total_volume)} monthly volume
                        across {platformCount} platforms.{" "}
                        {primaryName} leads with {primaryShare}%.
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider mb-1">
                        WHAT DRIVES IT
                      </p>
                      <p className="text-sm text-white/90">
                        {trendInfo
                          ? `${primaryName} trend is ${trendInfo.label.toLowerCase()}. ${
                              trendInfo.label === "Growing"
                                ? "Rising demand signals across platforms."
                                : trendInfo.label === "Declining"
                                  ? "Decreasing search interest detected."
                                  : "Consistent search demand over time."
                            }`
                          : "Trend and competitive data loading..."}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider mb-1">
                        PLATFORMS
                      </p>
                      <p className="text-sm text-white/90">
                        {platformCount} active platforms with search demand
                        signals detected for this keyword.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 1: Where are users searching? */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Where are users searching?
                    </h2>
                    <p className="text-sm text-slate-500">
                      Total search volume across platforms — where the demand
                      actually lives
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <StatsRow data={keywordData} />

                {/* Search Distribution (donut + list + volume overview) */}
                <PlatformVolumeChart data={keywordData} />

                {/* Section 2: Growth Opportunities */}
                {opportunities && opportunities.platform_gaps.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold">
                        2
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          Growth Opportunities
                        </h2>
                        <p className="text-sm text-slate-500">
                          Platform gaps and expansion potential
                        </p>
                      </div>
                    </div>
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
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <svg
                  className="h-12 w-12 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605"
                  />
                </svg>
                <p className="text-sm">
                  Enter a keyword above to see cross-platform search analysis
                </p>
              </div>
            )}
          </>
        )}

        {/* Placeholder for future tabs */}
        {(activeSection === "demand" || activeSection === "compare") && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="rounded-full bg-slate-100 p-4 mb-4">
              <svg
                className="h-8 w-8 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-500">Coming Soon</p>
            <p className="text-xs text-slate-400 mt-1">
              This feature is under development
            </p>
          </div>
        )}

        {activeSection === "brand-audit" && <BrandAudit />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-sm font-medium text-slate-900">Total Search</p>
          <p className="text-xs text-slate-400 mt-1">
            Cross-Platform Search Intelligence
          </p>
        </div>
      </footer>
    </div>
  );
}
