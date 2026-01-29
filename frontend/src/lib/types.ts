export type Platform =
  | "google"
  | "youtube"
  | "tiktok"
  | "instagram"
  | "pinterest"
  | "amazon"
  | "twitter"
  | "bing"
  | "ebay"
  | "app_store"
  | "play_store"
  | "etsy"
  | "naver"
  | "perplexity";

export interface PlatformData {
  platform: Platform;
  volume: number;
  trend: number[];
  cpc: number | null;
  competition: number | null;
  is_estimated: boolean;
}

export interface CrossPlatformKeyword {
  keyword: string;
  platforms: Record<string, PlatformData>;
  total_volume: number;
  primary_platform: Platform | null;
}

export interface KeywordSuggestion {
  keyword: string;
  platform: Platform;
  volume: number | null;
  trend: number[];
  cpc: number | null;
  competition: number | null;
}

export type OpportunityType =
  | "platform_gap"
  | "trend_migration"
  | "platform_unique"
  | "volume_disparity"
  | "brand_coverage_gap";

export interface PlatformGapOpportunity {
  keyword: string;
  opportunity_type: OpportunityType;
  high_volume_platform: Platform;
  high_volume: number;
  low_volume_platform: Platform;
  low_volume: number;
  volume_ratio: number;
  opportunity_score: number;
  recommendation: string;
}

export interface UniqueKeyword {
  keyword: string;
  platform: Platform;
  volume: number;
  uniqueness_category: string;
  reason: string;
}

export interface OpportunityReport {
  seed_keyword: string;
  total_keywords_analyzed: number;
  platform_gaps: PlatformGapOpportunity[];
  unique_keywords: Record<string, UniqueKeyword[]>;
  summary: {
    total_search_volume_analyzed: number;
    gap_opportunities_found: number;
    top_gap_types: Record<string, number>;
    average_opportunity_score: number;
  };
}

export interface OpportunityAnalysis {
  keyword: string;
  total_volume: number;
  primary_platform: Platform | null;
  platforms: Record<string, PlatformData>;
  platform_gaps: PlatformGapOpportunity[];
  opportunity_score: number;
}

export type AdPlatform = "meta" | "tiktok" | "google";

export type AdFormat = "image" | "video" | "text" | "carousel";

export interface AdCreative {
  id: string;
  platform: AdPlatform;
  advertiser_name: string;
  advertiser_id: string | null;
  ad_format: AdFormat;
  first_shown: string | null;
  last_shown: string | null;
  status: string;
  headline: string | null;
  body_text: string | null;
  image_url: string | null;
  video_url: string | null;
  landing_url: string | null;
  impressions_range: string | null;
  spend_range: string | null;
  target_countries: string[];
  target_age_ranges: string[];
  target_genders: string[];
  keywords_detected: string[];
}

export interface BrandAdLibrary {
  brand_name: string;
  brand_domain: string;
  ads: AdCreative[];
}

export interface BrandCoverageAudit {
  brand_name: string;
  keyword: string;
  demand: Record<string, number>;
  coverage: Record<string, boolean>;
  gap_score: number;
  recommendation: string;
  total_demand: number;
  covered_demand: number;
  uncovered_platforms: string[];
}

export interface BrandSummary {
  brand_domain: string;
  keywords_analyzed: number;
  ad_presence: Record<string, number>;
  total_demand_by_platform: Record<string, number>;
  coverage_status: Record<string, string>;
  top_demand_platform: string;
}

export interface PlatformInfo {
  name: string;
  data_type: string;
  description: string;
}
