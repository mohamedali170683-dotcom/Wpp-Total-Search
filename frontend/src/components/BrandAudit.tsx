"use client";

import { useState } from "react";
import type {
  BrandCoverageAudit,
  BrandSummary,
  BrandAdLibrary,
} from "@/lib/types";
import { getAllBrandAds, getBrandCoverage, getBrandSummary } from "@/lib/api";
import {
  PLATFORM_LABELS,
  PLATFORM_COLORS,
  formatVolume,
  scoreBg,
  scoreColor,
} from "@/lib/platform-config";

export default function BrandAudit() {
  const [domain, setDomain] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BrandSummary | null>(null);
  const [coverage, setCoverage] = useState<BrandCoverageAudit[]>([]);
  const [ads, setAds] = useState<BrandAdLibrary | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "coverage" | "ads">(
    "summary"
  );

  async function handleAudit() {
    if (!domain.trim() || !keywords.trim()) return;
    setLoading(true);
    setError(null);
    const kwList = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      const [s, c, a] = await Promise.all([
        getBrandSummary(domain.trim(), kwList),
        getBrandCoverage(domain.trim(), kwList),
        getAllBrandAds(domain.trim()),
      ]);
      setSummary(s);
      setCoverage(c);
      setAds(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run audit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      {/* Input */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          Brand Coverage Audit
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Domain (e.g. optimumnutrition.com)"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/50 py-2.5 px-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Keywords (comma-separated)"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/50 py-2.5 px-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleAudit}
            disabled={loading || !domain.trim() || !keywords.trim()}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {loading ? "Auditing..." : "Run Audit"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {summary && (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-zinc-800/50 p-1 w-fit">
            {(["summary", "coverage", "ads"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Summary Tab */}
          {activeTab === "summary" && summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <p className="text-sm text-zinc-500 mb-1">Domain</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {summary.brand_domain}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <p className="text-sm text-zinc-500 mb-1">Keywords Analyzed</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {summary.keywords_analyzed}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <p className="text-sm text-zinc-500 mb-1">
                  Top Demand Platform
                </p>
                <p className="text-lg font-semibold text-zinc-100">
                  {PLATFORM_LABELS[summary.top_demand_platform] ||
                    summary.top_demand_platform}
                </p>
              </div>

              {/* Ad Presence */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:col-span-2 lg:col-span-3">
                <p className="text-sm text-zinc-500 mb-3">
                  Ad Presence by Platform
                </p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(summary.ad_presence).map(
                    ([platform, count]) => (
                      <div
                        key={platform}
                        className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              PLATFORM_COLORS[platform] || "#6366f1",
                          }}
                        />
                        <span className="text-sm text-zinc-300">
                          {PLATFORM_LABELS[platform] || platform}
                        </span>
                        <span className="text-sm font-semibold text-zinc-100">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Demand by Platform */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:col-span-2 lg:col-span-3">
                <p className="text-sm text-zinc-500 mb-3">
                  Total Demand by Platform
                </p>
                <div className="space-y-2">
                  {Object.entries(summary.total_demand_by_platform)
                    .sort(([, a], [, b]) => b - a)
                    .map(([platform, vol]) => {
                      const maxVol = Math.max(
                        ...Object.values(summary.total_demand_by_platform)
                      );
                      return (
                        <div key={platform} className="flex items-center gap-3">
                          <span className="text-sm text-zinc-400 w-24">
                            {PLATFORM_LABELS[platform] || platform}
                          </span>
                          <div className="flex-1 h-6 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${(vol / maxVol) * 100}%`,
                                backgroundColor:
                                  PLATFORM_COLORS[platform] || "#6366f1",
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-zinc-300 w-20 text-right">
                            {formatVolume(vol)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Coverage Tab */}
          {activeTab === "coverage" && coverage.length > 0 && (
            <div className="space-y-4">
              {coverage.map((c, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border p-5 ${scoreBg(c.gap_score)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-100">
                        {c.keyword}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {c.brand_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Gap Score</p>
                      <p
                        className={`text-xl font-bold ${scoreColor(c.gap_score)}`}
                      >
                        {c.gap_score.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">
                        Total Demand
                      </p>
                      <p className="font-semibold text-zinc-200">
                        {formatVolume(c.total_demand)}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Covered</p>
                      <p className="font-semibold text-zinc-200">
                        {formatVolume(c.covered_demand)}
                      </p>
                    </div>
                  </div>

                  {c.uncovered_platforms.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-zinc-500 mb-1.5">
                        Uncovered Platforms
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {c.uncovered_platforms.map((p) => (
                          <span
                            key={p}
                            className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs text-red-400"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-zinc-400">{c.recommendation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Ads Tab */}
          {activeTab === "ads" && ads && (
            <div className="space-y-4">
              {ads.ads.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center text-zinc-500">
                  No ads found for this brand.
                </div>
              ) : (
                ads.ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              PLATFORM_COLORS[ad.platform] || "#6366f1",
                          }}
                        />
                        <span className="text-sm font-medium text-zinc-300">
                          {PLATFORM_LABELS[ad.platform] || ad.platform}
                        </span>
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                          {ad.ad_format}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          ad.status === "active"
                            ? "text-emerald-400"
                            : "text-zinc-500"
                        }`}
                      >
                        {ad.status}
                      </span>
                    </div>

                    {ad.headline && (
                      <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                        {ad.headline}
                      </h4>
                    )}
                    {ad.body_text && (
                      <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                        {ad.body_text}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                      {ad.impressions_range && (
                        <span>Impressions: {ad.impressions_range}</span>
                      )}
                      {ad.target_countries.length > 0 && (
                        <span>
                          Countries: {ad.target_countries.join(", ")}
                        </span>
                      )}
                      {ad.target_age_ranges.length > 0 && (
                        <span>
                          Ages: {ad.target_age_ranges.join(", ")}
                        </span>
                      )}
                    </div>

                    {ad.keywords_detected.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {ad.keywords_detected.map((kw) => (
                          <span
                            key={kw}
                            className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs text-indigo-400"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
