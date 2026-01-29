"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import StatsRow from "@/components/StatsRow";
import PlatformVolumeChart from "@/components/PlatformVolumeChart";
import PlatformCards from "@/components/PlatformCards";
import OpportunityCards from "@/components/OpportunityCards";
import BrandAudit from "@/components/BrandAudit";
import { getCrossPlatformKeyword, analyzeOpportunity } from "@/lib/api";
import type { CrossPlatformKeyword, OpportunityAnalysis } from "@/lib/types";

type ActiveSection = "dashboard" | "brand-audit";

export default function Home() {
  const [activeSection, setActiveSection] =
    useState<ActiveSection>("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywordData, setKeywordData] =
    useState<CrossPlatformKeyword | null>(null);
  const [opportunities, setOpportunities] =
    useState<OpportunityAnalysis | null>(null);
  const [searchedKeyword, setSearchedKeyword] = useState("");

  async function handleSearch(keyword: string) {
    setLoading(true);
    setError(null);
    setSearchedKeyword(keyword);

    try {
      const [kw, opp] = await Promise.all([
        getCrossPlatformKeyword(keyword),
        analyzeOpportunity(keyword),
      ]);
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

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
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
              <h1 className="text-lg font-semibold text-zinc-100">
                Wpp Total Search
              </h1>
            </div>

            <nav className="flex gap-1 rounded-xl bg-zinc-800/50 p-1">
              <button
                onClick={() => setActiveSection("dashboard")}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeSection === "dashboard"
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveSection("brand-audit")}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeSection === "brand-audit"
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                Brand Audit
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeSection === "dashboard" && (
          <>
            {/* Hero / Search */}
            <section className="flex flex-col items-center text-center pt-8 pb-4">
              <h2 className="text-3xl font-bold text-zinc-100 mb-2">
                Cross-Platform Keyword Intelligence
              </h2>
              <p className="text-zinc-400 mb-8 max-w-lg">
                Analyze keyword volume across Google, TikTok, YouTube,
                Instagram, Amazon and more. Discover platform gaps and untapped
                opportunities.
              </p>
              <SearchBar onSearch={handleSearch} loading={loading} />
            </section>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Results */}
            {keywordData && (
              <div className="space-y-8">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl font-semibold text-zinc-100">
                    Results for
                  </h2>
                  <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-sm font-medium text-indigo-400">
                    {searchedKeyword}
                  </span>
                </div>

                {/* Stats */}
                <StatsRow data={keywordData} />

                {/* Chart */}
                <PlatformVolumeChart data={keywordData} />

                {/* Platform Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                    Platform Breakdown
                  </h3>
                  <PlatformCards data={keywordData} />
                </div>

                {/* Opportunities */}
                {opportunities && (
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100 mb-4">
                      Opportunity Detection
                    </h3>
                    <OpportunityCards
                      gaps={opportunities.platform_gaps}
                      overallScore={opportunities.opportunity_score}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!keywordData && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                <svg
                  className="h-16 w-16 mb-4"
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
                  Search for a keyword to see cross-platform analysis
                </p>
              </div>
            )}
          </>
        )}

        {activeSection === "brand-audit" && <BrandAudit />}
      </main>
    </div>
  );
}
