/**
 * API client — uses local demo data for the prototype.
 * Swap to fetch-based calls when backend is deployed.
 */
import type {
  CrossPlatformKeyword,
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

// ── Keywords ──────────────────────────────────────────────────────────────────

export async function getCrossPlatformKeyword(
  keyword: string
): Promise<CrossPlatformKeyword> {
  const result = findKeyword(keyword);
  if (!result) {
    throw new Error(
      `No data found for "${keyword}". Try: ${searchKeywords("")
        .map((k) => k.keyword)
        .join(", ")}`
    );
  }
  return result;
}

export async function getAllKeywords(): Promise<CrossPlatformKeyword[]> {
  return searchKeywords("");
}

// ── Opportunities ─────────────────────────────────────────────────────────────

export async function analyzeOpportunity(
  keyword: string
): Promise<OpportunityAnalysis> {
  const kw = findKeyword(keyword);
  if (!kw) {
    throw new Error(`No data found for "${keyword}".`);
  }
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
