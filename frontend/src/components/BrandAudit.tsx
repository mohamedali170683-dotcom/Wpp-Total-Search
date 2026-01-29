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
  scoreLabel,
} from "@/lib/platform-config";

const TAB_LABELS: Record<string, string> = {
  summary: "Overview",
  coverage: "Coverage Analysis",
  ads: "Ad Intelligence",
};

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
      {/* Input Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Brand Coverage Audit
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Discover how well your brand covers search demand across platforms.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Domain (e.g. optimumnutrition.com)"
              className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            />
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Keywords (comma-separated)"
              className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            />
            <button
              onClick={handleAudit}
              disabled={loading || !domain.trim() || !keywords.trim()}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm whitespace-nowrap"
            >
              {loading ? "Auditing..." : "Run Audit"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {summary && (
        <div className="space-y-4">
          {/* Tabs — underline style */}
          <div className="border-b border-slate-200">
            <nav className="flex gap-6">
              {(["summary", "coverage", "ads"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </nav>
          </div>

          {/* Summary Tab */}
          {activeTab === "summary" && summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500 mb-1">Domain</p>
                <p className="text-lg font-semibold text-slate-900">
                  {summary.brand_domain}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500 mb-1">Keywords Analyzed</p>
                <p className="text-lg font-semibold text-slate-900">
                  {summary.keywords_analyzed}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500 mb-1">
                  Top Demand Platform
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {PLATFORM_LABELS[summary.top_demand_platform] ||
                    summary.top_demand_platform}
                </p>
              </div>

              {/* Ad Presence */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-3">
                <p className="text-sm text-slate-500 mb-3">
                  Ad Presence by Platform
                </p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(summary.ad_presence).map(
                    ([platform, count]) => (
                      <div
                        key={platform}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 bg-slate-50"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              PLATFORM_COLORS[platform] || "#6366f1",
                          }}
                        />
                        <span className="text-sm text-slate-600">
                          {PLATFORM_LABELS[platform] || platform}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Demand by Platform — horizontal bars */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-3">
                <p className="text-sm text-slate-500 mb-3">
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
                          <span className="text-sm text-slate-600 w-24">
                            {PLATFORM_LABELS[platform] || platform}
                          </span>
                          <div className="flex-1 h-6 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${(vol / maxVol) * 100}%`,
                                backgroundColor:
                                  PLATFORM_COLORS[platform] || "#6366f1",
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700 w-20 text-right">
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
              {coverage.map((c, i) => {
                const coveragePct =
                  c.total_demand > 0
                    ? ((c.covered_demand / c.total_demand) * 100).toFixed(0)
                    : "0";
                return (
                  <div
                    key={i}
                    className={`rounded-2xl border p-5 ${scoreBg(c.gap_score)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {c.keyword}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {c.brand_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Gap Score</p>
                        <p
                          className={`text-xl font-bold ${scoreColor(c.gap_score)}`}
                        >
                          {c.gap_score.toFixed(0)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {scoreLabel(c.gap_score)}
                        </p>
                      </div>
                    </div>

                    {/* Coverage meter */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Coverage</span>
                        <span>{coveragePct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${coveragePct}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">
                          Total Demand
                        </p>
                        <p className="font-semibold text-slate-800">
                          {formatVolume(c.total_demand)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Covered</p>
                        <p className="font-semibold text-slate-800">
                          {formatVolume(c.covered_demand)}
                        </p>
                      </div>
                    </div>

                    {c.uncovered_platforms.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-1.5">
                          Uncovered Platforms
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {c.uncovered_platforms.map((p) => (
                            <span
                              key={p}
                              className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs text-red-700"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-slate-600">{c.recommendation}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ads Tab */}
          {activeTab === "ads" && ads && (
            <div className="space-y-4">
              {ads.ads.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
                  No ads found for this brand.
                </div>
              ) : (
                ads.ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
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
                        <span className="text-sm font-medium text-slate-700">
                          {PLATFORM_LABELS[ad.platform] || ad.platform}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          {ad.ad_format}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${
                          ad.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {ad.status}
                      </span>
                    </div>

                    {ad.headline && (
                      <h4 className="text-sm font-semibold text-slate-800 mb-1">
                        {ad.headline}
                      </h4>
                    )}
                    {ad.body_text && (
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                        {ad.body_text}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-slate-400">
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
                            className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs text-indigo-700"
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
