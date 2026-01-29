import { NextRequest, NextResponse } from "next/server";

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN ?? "";
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD ?? "";
const AUTH = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString("base64");

const DATAFORSEO_BASE = "https://api.dataforseo.com/v3";

interface MonthlySearch {
  year: number;
  month: number;
  search_volume: number;
}

interface GoogleKeywordResult {
  keyword: string;
  search_volume: number | null;
  cpc: number | null;
  competition: string | null;
  competition_index: number | null;
  monthly_searches: MonthlySearch[] | null;
}

interface BingKeywordResult {
  keyword: string;
  search_volume: number | null;
  cpc: number | null;
  competition: number | null;
  monthly_searches: MonthlySearch[] | null;
}

interface AmazonKeywordItem {
  keyword: string;
  search_volume: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function dataforseoPost<T>(path: string, body: unknown[]): Promise<T> {
  const res = await fetch(`${DATAFORSEO_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${AUTH}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DataForSEO ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

function extractTrend(monthly: MonthlySearch[] | null): number[] {
  if (!monthly || monthly.length === 0) return [];
  // Sort by year+month ascending and take last 12
  const sorted = [...monthly]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .slice(-12);
  return sorted.map((m) => m.search_volume ?? 0);
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchGoogle(keywords: string[], locationCode: number) {
  interface GoogleResponse {
    tasks?: Array<{
      result?: Array<{ items?: GoogleKeywordResult[] }>;
    }>;
  }

  const data = await dataforseoPost<GoogleResponse>(
    "/keywords_data/google_ads/search_volume/live",
    [{ keywords, location_code: locationCode, language_code: "en" }]
  );

  const items = data.tasks?.[0]?.result?.[0]?.items ?? [];
  const map: Record<string, { volume: number; cpc: number | null; competition: number | null; trend: number[] }> = {};

  for (const item of items) {
    map[item.keyword.toLowerCase()] = {
      volume: item.search_volume ?? 0,
      cpc: item.cpc ?? null,
      competition: item.competition_index != null ? item.competition_index / 100 : null,
      trend: extractTrend(item.monthly_searches ?? null),
    };
  }
  return map;
}

async function fetchBing(keywords: string[], locationCode: number) {
  interface BingResponse {
    tasks?: Array<{
      result?: Array<{ items?: BingKeywordResult[] }>;
    }>;
  }

  const data = await dataforseoPost<BingResponse>(
    "/keywords_data/bing/search_volume/live",
    [{ keywords, location_code: locationCode, language_code: "en" }]
  );

  const items = data.tasks?.[0]?.result?.[0]?.items ?? [];
  const map: Record<string, { volume: number; cpc: number | null; competition: number | null; trend: number[] }> = {};

  for (const item of items) {
    if (!item.keyword) continue;
    map[item.keyword.toLowerCase()] = {
      volume: item.search_volume ?? 0,
      cpc: item.cpc ?? null,
      competition: item.competition ?? null,
      trend: extractTrend(item.monthly_searches ?? null),
    };
  }
  return map;
}

async function fetchAmazon(keywords: string[], locationCode: number) {
  interface AmazonResponse {
    tasks?: Array<{
      result?: Array<{ items?: AmazonKeywordItem[] }>;
    }>;
  }

  const data = await dataforseoPost<AmazonResponse>(
    "/dataforseo_labs/amazon/bulk_search_volume/live",
    [{ keywords, location_code: locationCode, language_code: "en" }]
  );

  const items = data.tasks?.[0]?.result?.[0]?.items ?? [];
  const map: Record<string, { volume: number }> = {};

  for (const item of items) {
    map[item.keyword.toLowerCase()] = {
      volume: item.search_volume ?? 0,
    };
  }
  return map;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword");
  if (!keyword) {
    return NextResponse.json({ error: "keyword parameter required" }, { status: 400 });
  }

  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    return NextResponse.json(
      { error: "DataForSEO credentials not configured" },
      { status: 500 }
    );
  }

  const locationCode = parseInt(
    request.nextUrl.searchParams.get("location_code") ?? "2840" // US default
  );

  const keywords = [keyword];

  try {
    // Fetch all three in parallel
    const [google, bing, amazon] = await Promise.allSettled([
      fetchGoogle(keywords, locationCode),
      fetchBing(keywords, locationCode),
      fetchAmazon(keywords, locationCode),
    ]);

    const kw = keyword.toLowerCase();

    const googleData = google.status === "fulfilled" ? google.value[kw] : null;
    const bingData = bing.status === "fulfilled" ? bing.value[kw] : null;
    const amazonData = amazon.status === "fulfilled" ? amazon.value[kw] : null;

    // Build platform data
    const platforms: Record<string, unknown> = {};
    let totalVolume = 0;
    let maxVolume = 0;
    let primaryPlatform: string | null = null;

    if (googleData && googleData.volume > 0) {
      platforms.google = {
        platform: "google",
        volume: googleData.volume,
        cpc: googleData.cpc,
        competition: googleData.competition,
        trend: googleData.trend,
        is_estimated: false,
        source: "dataforseo",
      };
      totalVolume += googleData.volume;
      if (googleData.volume > maxVolume) {
        maxVolume = googleData.volume;
        primaryPlatform = "google";
      }
    }

    if (bingData && bingData.volume > 0) {
      platforms.bing = {
        platform: "bing",
        volume: bingData.volume,
        cpc: bingData.cpc,
        competition: bingData.competition,
        trend: bingData.trend,
        is_estimated: false,
        source: "dataforseo",
      };
      totalVolume += bingData.volume;
      if (bingData.volume > maxVolume) {
        maxVolume = bingData.volume;
        primaryPlatform = "bing";
      }
    }

    if (amazonData && amazonData.volume > 0) {
      platforms.amazon = {
        platform: "amazon",
        volume: amazonData.volume,
        cpc: null,
        competition: null,
        trend: [],
        is_estimated: false,
        source: "dataforseo",
      };
      totalVolume += amazonData.volume;
      if (amazonData.volume > maxVolume) {
        maxVolume = amazonData.volume;
        primaryPlatform = "amazon";
      }
    }

    // Report errors for failed fetches
    const errors: string[] = [];
    if (google.status === "rejected") errors.push(`Google: ${google.reason}`);
    if (bing.status === "rejected") errors.push(`Bing: ${bing.reason}`);
    if (amazon.status === "rejected") errors.push(`Amazon: ${amazon.reason}`);

    return NextResponse.json({
      keyword,
      platforms,
      total_volume: totalVolume,
      primary_platform: primaryPlatform,
      sources: { google: "dataforseo", bing: "dataforseo", amazon: "dataforseo" },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
