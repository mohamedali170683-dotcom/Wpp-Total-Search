import type {
  CrossPlatformKeyword,
  OpportunityAnalysis,
  OpportunityReport,
  PlatformGapOpportunity,
  BrandAdLibrary,
  BrandCoverageAudit,
  BrandSummary,
  PlatformInfo,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// ── Keywords ──────────────────────────────────────────────────────────────────

export function getCrossPlatformKeyword(
  keyword: string,
  platforms?: string[]
): Promise<CrossPlatformKeyword> {
  const params = new URLSearchParams({ keyword });
  if (platforms?.length) params.set("platforms", platforms.join(","));
  return fetchJSON(`/api/keywords/cross-platform?${params}`);
}

export function getPlatforms(): Promise<Record<string, PlatformInfo>> {
  return fetchJSON("/api/keywords/platforms");
}

// ── Opportunities ─────────────────────────────────────────────────────────────

export function analyzeOpportunity(
  keyword: string
): Promise<OpportunityAnalysis> {
  return fetchJSON(`/api/opportunities/analyze?keyword=${encodeURIComponent(keyword)}`);
}

export function generateReport(
  seedKeywords: string[],
  country = "us"
): Promise<OpportunityReport> {
  return fetchJSON("/api/opportunities/report", {
    method: "POST",
    body: JSON.stringify({ seed_keywords: seedKeywords, country }),
  });
}

export function getGaps(
  keyword: string,
  highPlatform: string,
  lowPlatform: string
): Promise<PlatformGapOpportunity[]> {
  const params = new URLSearchParams({
    keyword,
    high_platform: highPlatform,
    low_platform: lowPlatform,
  });
  return fetchJSON(`/api/opportunities/gaps?${params}`);
}

// ── Brand Audit ───────────────────────────────────────────────────────────────

export function getBrandAds(
  platform: string,
  domain: string
): Promise<BrandAdLibrary> {
  return fetchJSON(`/api/brand-audit/ads/${platform}?domain=${encodeURIComponent(domain)}`);
}

export function getAllBrandAds(domain: string): Promise<BrandAdLibrary> {
  return fetchJSON(`/api/brand-audit/ads/all?domain=${encodeURIComponent(domain)}`);
}

export function getBrandCoverage(
  domain: string,
  keywords: string[]
): Promise<BrandCoverageAudit[]> {
  return fetchJSON("/api/brand-audit/coverage", {
    method: "POST",
    body: JSON.stringify({ domain, keywords }),
  });
}

export function getBrandSummary(
  domain: string,
  keywords: string[]
): Promise<BrandSummary> {
  const params = new URLSearchParams({ domain });
  keywords.forEach((k) => params.append("keywords", k));
  return fetchJSON(`/api/brand-audit/summary?${params}`);
}
