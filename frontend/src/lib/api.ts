/**
 * Hybrid API client:
 * - Google, Bing, Amazon → real DataForSEO data via Next.js API route
 * - YouTube, TikTok, Instagram, Pinterest → demo data (until KeywordTool.io)
 * - Brand audit → local demo data
 */
import type {
  CrossPlatformKeyword,
  PlatformData,
  OpportunityAnalysis,
  BrandAdLibrary,
  BrandCoverageAudit,
  BrandSummary,
} from "./types";
import { findKeyword, searchKeywords, getBrandAdsLocal } from "./demo-data";
import {
  analyzeKeyword,
  runBrandCoverage,
  runBrandSummary,
} from "./analyzer";

// ── Social platform demo data (estimated) ─────────────────────────────────────

const SOCIAL_DEMO: Record<string, Record<string, Omit<PlatformData, "platform">>> = {};

// Pre-build social demo index from existing demo data
for (const kw of searchKeywords("")) {
  const social: Record<string, Omit<PlatformData, "platform">> = {};
  for (const [key, pd] of Object.entries(kw.platforms)) {
    if (["youtube", "tiktok", "instagram", "pinterest"].includes(key)) {
      social[key] = {
        volume: pd.volume,
        cpc: pd.cpc,
        competition: pd.competition,
        trend: pd.trend,
        is_estimated: true,
      };
    }
  }
  if (Object.keys(social).length > 0) {
    SOCIAL_DEMO[kw.keyword.toLowerCase()] = social;
  }
}

// ── Keywords (hybrid) ─────────────────────────────────────────────────────────

export async function getCrossPlatformKeyword(
  keyword: string
): Promise<CrossPlatformKeyword> {
  // Try fetching real data from DataForSEO via our API route
  let realData: Record<string, PlatformData> = {};
  let realFetched = false;

  try {
    const res = await fetch(`/api/keywords?keyword=${encodeURIComponent(keyword)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.platforms && Object.keys(json.platforms).length > 0) {
        realData = json.platforms;
        realFetched = true;
      }
    }
  } catch {
    // API route not available or errored — fall through to demo
  }

  // Merge with social demo data
  const socialData = SOCIAL_DEMO[keyword.toLowerCase()] ?? {};
  const platforms: Record<string, PlatformData> = {};
  let totalVolume = 0;
  let maxVolume = 0;
  let primaryPlatform: string | null = null;

  // Add real platforms (Google, Bing, Amazon)
  for (const [key, pd] of Object.entries(realData)) {
    const platformData: PlatformData = {
      platform: key as PlatformData["platform"],
      volume: pd.volume,
      cpc: pd.cpc ?? null,
      competition: pd.competition ?? null,
      trend: pd.trend ?? [],
      is_estimated: false,
    };
    platforms[key] = platformData;
    totalVolume += pd.volume;
    if (pd.volume > maxVolume) {
      maxVolume = pd.volume;
      primaryPlatform = key;
    }
  }

  // Add social platforms from demo data
  for (const [key, pd] of Object.entries(socialData)) {
    if (!platforms[key]) {
      const platformData: PlatformData = {
        platform: key as PlatformData["platform"],
        volume: pd.volume,
        cpc: pd.cpc ?? null,
        competition: pd.competition ?? null,
        trend: pd.trend ?? [],
        is_estimated: true,
      };
      platforms[key] = platformData;
      totalVolume += pd.volume;
      if (pd.volume > maxVolume) {
        maxVolume = pd.volume;
        primaryPlatform = key;
      }
    }
  }

  // If we got real data for at least some platforms but no demo social data,
  // still return what we have
  if (Object.keys(platforms).length > 0) {
    return {
      keyword,
      platforms,
      total_volume: totalVolume,
      primary_platform: primaryPlatform as CrossPlatformKeyword["primary_platform"],
    };
  }

  // Full fallback to demo data if no real data at all
  if (!realFetched) {
    const demoResult = findKeyword(keyword);
    if (demoResult) return demoResult;
  }

  throw new Error(
    `No data found for "${keyword}". Try: ${searchKeywords("")
      .map((k) => k.keyword)
      .join(", ")}`
  );
}

export async function getAllKeywords(): Promise<CrossPlatformKeyword[]> {
  return searchKeywords("");
}

// ── Opportunities ─────────────────────────────────────────────────────────────

export async function analyzeOpportunity(
  keyword: string
): Promise<OpportunityAnalysis> {
  // Use the cross-platform data we already fetched
  const kw = await getCrossPlatformKeyword(keyword);
  return analyzeKeyword(kw);
}

// ── Brand Audit ───────────────────────────────────────────────────────────────

export async function getAllBrandAds(
  domain: string
): Promise<BrandAdLibrary> {
  return getBrandAdsLocal(domain);
}

export async function getBrandCoverage(
  domain: string,
  keywords: string[]
): Promise<BrandCoverageAudit[]> {
  return runBrandCoverage(domain, keywords);
}

export async function getBrandSummary(
  domain: string,
  keywords: string[]
): Promise<BrandSummary> {
  return runBrandSummary(domain, keywords);
}
