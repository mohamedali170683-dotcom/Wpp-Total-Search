/**
 * Client-side opportunity analyzer replicating backend logic.
 * Detects platform gaps, classifies uniqueness, and scores opportunities.
 */
import type {
  CrossPlatformKeyword,
  PlatformGapOpportunity,
  OpportunityAnalysis,
  BrandCoverageAudit,
  BrandSummary,
} from "./types";
import { formatVolume } from "./platform-config";
import { getBrandAdsLocal, getAdKeywords, findKeyword } from "./demo-data";

// ── Strategic pairs: (high_platform, low_platform) ────────────────────────────

const STRATEGIC_PAIRS: [string, string][] = [
  ["tiktok", "google"],
  ["instagram", "google"],
  ["youtube", "google"],
  ["tiktok", "youtube"],
  ["amazon", "google"],
  ["pinterest", "google"],
];

const MIN_VOLUME = 1000;
const GAP_RATIO = 5.0;

// ── Gap detection ─────────────────────────────────────────────────────────────

function findGaps(kw: CrossPlatformKeyword): PlatformGapOpportunity[] {
  const gaps: PlatformGapOpportunity[] = [];

  for (const [highKey, lowKey] of STRATEGIC_PAIRS) {
    const highData = kw.platforms[highKey];
    const lowData = kw.platforms[lowKey];
    if (!highData) continue;

    const highVol = highData.volume;
    const lowVol = lowData?.volume ?? 0;

    if (highVol < MIN_VOLUME) continue;

    let ratio: number;
    let score: number;

    if (lowVol === 0) {
      ratio = 999;
      score = 95;
    } else if (highVol / Math.max(lowVol, 1) >= GAP_RATIO) {
      ratio = highVol / lowVol;
      score = Math.min(90, 50 + ratio * 2);
    } else {
      continue;
    }

    const recommendation =
      lowVol === 0
        ? `'${kw.keyword}' has ${highVol.toLocaleString()} monthly searches on ${highKey} but ZERO on ${lowKey}. Create ${lowKey} content to capture this untapped demand.`
        : `'${kw.keyword}' has ${ratio.toFixed(1)}x more searches on ${highKey} (${formatVolume(highVol)}) vs ${lowKey} (${formatVolume(lowVol)}). Opportunity to expand ${lowKey} presence.`;

    gaps.push({
      keyword: kw.keyword,
      opportunity_type: "platform_gap",
      high_volume_platform: highKey as PlatformGapOpportunity["high_volume_platform"],
      high_volume: highVol,
      low_volume_platform: lowKey as PlatformGapOpportunity["low_volume_platform"],
      low_volume: lowVol,
      volume_ratio: ratio,
      opportunity_score: score,
      recommendation,
    });
  }

  return gaps.sort((a, b) => b.opportunity_score - a.opportunity_score);
}

// ── Opportunity score ─────────────────────────────────────────────────────────

function calcScore(
  kw: CrossPlatformKeyword,
  gaps: PlatformGapOpportunity[]
): number {
  let score = 0;

  if (kw.total_volume > 1_000_000) score += 30;
  else if (kw.total_volume > 100_000) score += 20;
  else if (kw.total_volume > 10_000) score += 10;

  if (gaps.length) {
    score += Math.max(...gaps.map((g) => g.opportunity_score)) * 0.5;
  }

  for (const pd of Object.values(kw.platforms)) {
    if (pd.trend.length >= 12 && pd.trend[11] > pd.trend[0] * 1.2) {
      score += 10;
      break;
    }
  }

  return Math.min(100, score);
}

// ── Public: analyze a keyword ─────────────────────────────────────────────────

export function analyzeKeyword(kw: CrossPlatformKeyword): OpportunityAnalysis {
  const gaps = findGaps(kw);
  const score = calcScore(kw, gaps);

  return {
    keyword: kw.keyword,
    total_volume: kw.total_volume,
    primary_platform: kw.primary_platform,
    platforms: kw.platforms,
    platform_gaps: gaps,
    opportunity_score: score,
  };
}

// ── Brand audit helpers ───────────────────────────────────────────────────────

export function runBrandCoverage(
  domain: string,
  keywords: string[]
): BrandCoverageAudit[] {
  const brandAds = getBrandAdsLocal(domain);
  const adKeywords = getAdKeywords();
  const hasMeta = brandAds.ads.some((a) => a.platform === "meta");
  const hasGoogle = brandAds.ads.some((a) => a.platform === "google");
  const hasTiktok = brandAds.ads.some((a) => a.platform === "tiktok");

  return keywords.map((keyword) => {
    const kwData = findKeyword(keyword);
    const demand: Record<string, number> = {};
    let totalDemand = 0;

    if (kwData) {
      for (const [p, pd] of Object.entries(kwData.platforms)) {
        demand[p] = pd.volume;
        totalDemand += pd.volume;
      }
    }

    const kwLower = keyword.toLowerCase();
    const inAdKeywords = adKeywords.some((ak) =>
      kwLower.includes(ak) || ak.includes(kwLower)
    );

    const coverage: Record<string, boolean> = {
      meta_ads: hasMeta,
      google_ads: hasGoogle,
      tiktok_ads: hasTiktok,
      keyword_in_meta: inAdKeywords && hasMeta,
      keyword_in_google: inAdKeywords && hasGoogle,
    };

    const uncovered: string[] = [];
    if (!hasTiktok && (demand["tiktok"] ?? 0) > 0) uncovered.push("TikTok");
    if (!hasMeta && (demand["instagram"] ?? 0) > 0) uncovered.push("Instagram");
    if (!inAdKeywords) {
      if ((demand["google"] ?? 0) > 0) uncovered.push("Google (keyword gap)");
    }

    const coveredDemand = Object.entries(demand).reduce((sum, [p, v]) => {
      if (p === "google" && hasGoogle) return sum + v;
      if (p === "tiktok" && hasTiktok) return sum + v;
      if ((p === "instagram" || p === "facebook") && hasMeta) return sum + v;
      return sum;
    }, 0);

    const gapScore =
      totalDemand > 0
        ? ((totalDemand - coveredDemand) / totalDemand) * 100
        : 0;

    const recommendation =
      uncovered.length > 0
        ? `High demand on ${uncovered.join(", ")} but limited ad presence. Consider expanding paid coverage.`
        : "Good coverage across active platforms.";

    return {
      brand_name: domain,
      keyword,
      demand,
      coverage,
      gap_score: Math.round(gapScore * 10) / 10,
      recommendation,
      total_demand: totalDemand,
      covered_demand: coveredDemand,
      uncovered_platforms: uncovered,
    };
  });
}

export function runBrandSummary(
  domain: string,
  keywords: string[]
): BrandSummary {
  const brandAds = getBrandAdsLocal(domain);

  const adPresence: Record<string, number> = {};
  for (const ad of brandAds.ads) {
    adPresence[ad.platform] = (adPresence[ad.platform] ?? 0) + 1;
  }

  const totalDemand: Record<string, number> = {};
  for (const kw of keywords) {
    const kwData = findKeyword(kw);
    if (kwData) {
      for (const [p, pd] of Object.entries(kwData.platforms)) {
        totalDemand[p] = (totalDemand[p] ?? 0) + pd.volume;
      }
    }
  }

  const topPlatform = Object.entries(totalDemand).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] ?? "unknown";

  const coverageStatus: Record<string, string> = {};
  for (const p of ["meta", "google", "tiktok"]) {
    coverageStatus[p] = (adPresence[p] ?? 0) > 0 ? "active" : "inactive";
  }

  return {
    brand_domain: domain,
    keywords_analyzed: keywords.length,
    ad_presence: adPresence,
    total_demand_by_platform: totalDemand,
    coverage_status: coverageStatus,
    top_demand_platform: topPlatform,
  };
}
