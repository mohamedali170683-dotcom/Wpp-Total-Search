import type {
  CrossPlatformKeyword,
  PlatformData,
  AdCreative,
  BrandAdLibrary,
} from "./types";

interface RawPlatform {
  volume: number;
  cpc: number | null;
  competition: number | null;
  trend: number[];
}

interface RawKeyword {
  keyword: string;
  platforms: Record<string, RawPlatform>;
}

function toPlatformData(
  key: string,
  raw: RawPlatform
): PlatformData {
  return {
    platform: key as PlatformData["platform"],
    volume: raw.volume,
    cpc: raw.cpc,
    competition: raw.competition,
    trend: raw.trend,
    is_estimated: !["google", "bing"].includes(key),
  };
}

function buildCrossPlatform(raw: RawKeyword): CrossPlatformKeyword {
  const platforms: Record<string, PlatformData> = {};
  let totalVolume = 0;
  let primaryPlatform: string | null = null;
  let maxVol = 0;

  for (const [key, pd] of Object.entries(raw.platforms)) {
    platforms[key] = toPlatformData(key, pd);
    totalVolume += pd.volume;
    if (pd.volume > maxVol) {
      maxVol = pd.volume;
      primaryPlatform = key;
    }
  }

  return {
    keyword: raw.keyword,
    platforms,
    total_volume: totalVolume,
    primary_platform: primaryPlatform as CrossPlatformKeyword["primary_platform"],
  };
}

// ── Raw keyword data ──────────────────────────────────────────────────────────

const RAW_KEYWORDS: RawKeyword[] = [
  {
    keyword: "protein powder",
    platforms: {
      google: { volume: 450000, cpc: 1.85, competition: 0.72, trend: [420000,430000,445000,460000,470000,480000,475000,465000,450000,440000,445000,450000] },
      youtube: { volume: 320000, cpc: null, competition: null, trend: [300000,310000,315000,320000,325000,330000,328000,322000,318000,315000,318000,320000] },
      tiktok: { volume: 890000, cpc: null, competition: null, trend: [650000,700000,750000,800000,850000,880000,890000,895000,890000,885000,888000,890000] },
      instagram: { volume: 245000, cpc: null, competition: null, trend: [220000,225000,230000,235000,240000,242000,244000,245000,245000,244000,244000,245000] },
      amazon: { volume: 560000, cpc: 2.10, competition: 0.85, trend: [520000,530000,540000,550000,555000,560000,565000,562000,558000,555000,558000,560000] },
    },
  },
  {
    keyword: "grwm protein shake",
    platforms: {
      google: { volume: 2400, cpc: 0.45, competition: 0.15, trend: [800,1000,1200,1500,1800,2000,2100,2200,2300,2350,2380,2400] },
      youtube: { volume: 45000, cpc: null, competition: null, trend: [25000,28000,32000,36000,40000,42000,43500,44000,44500,44800,45000,45000] },
      tiktok: { volume: 340000, cpc: null, competition: null, trend: [180000,210000,250000,280000,300000,315000,325000,332000,336000,338000,339000,340000] },
      instagram: { volume: 89000, cpc: null, competition: null, trend: [45000,52000,60000,68000,75000,80000,83000,85000,87000,88000,88500,89000] },
      amazon: { volume: 0, cpc: null, competition: null, trend: [0,0,0,0,0,0,0,0,0,0,0,0] },
    },
  },
  {
    keyword: "best vegan protein 2024",
    platforms: {
      google: { volume: 74000, cpc: 2.40, competition: 0.68, trend: [55000,58000,62000,66000,70000,72000,73000,73500,74000,74000,74000,74000] },
      youtube: { volume: 89000, cpc: null, competition: null, trend: [65000,70000,75000,80000,84000,86000,87500,88000,88500,89000,89000,89000] },
      tiktok: { volume: 245000, cpc: null, competition: null, trend: [150000,170000,190000,210000,225000,235000,240000,242000,244000,245000,245000,245000] },
      instagram: { volume: 67000, cpc: null, competition: null, trend: [45000,50000,55000,58000,62000,64000,65500,66000,66500,67000,67000,67000] },
      amazon: { volume: 156000, cpc: 1.95, competition: 0.78, trend: [120000,128000,136000,142000,148000,152000,154000,155000,155500,156000,156000,156000] },
    },
  },
  {
    keyword: "gym aesthetic",
    platforms: {
      google: { volume: 8100, cpc: 0.35, competition: 0.22, trend: [5000,5500,6000,6500,7000,7400,7700,7900,8000,8050,8080,8100] },
      youtube: { volume: 125000, cpc: null, competition: null, trend: [80000,90000,98000,105000,112000,118000,121000,123000,124000,124500,125000,125000] },
      tiktok: { volume: 1200000, cpc: null, competition: null, trend: [700000,800000,900000,980000,1050000,1100000,1140000,1170000,1185000,1195000,1198000,1200000] },
      instagram: { volume: 890000, cpc: null, competition: null, trend: [600000,680000,750000,800000,840000,865000,878000,885000,888000,889500,890000,890000] },
      amazon: { volume: 0, cpc: null, competition: null, trend: [0,0,0,0,0,0,0,0,0,0,0,0] },
      pinterest: { volume: 340000, cpc: null, competition: null, trend: [220000,250000,280000,300000,315000,325000,332000,336000,338000,339000,340000,340000] },
    },
  },
  {
    keyword: "whey protein isolate",
    platforms: {
      google: { volume: 201000, cpc: 2.15, competition: 0.75, trend: [185000,188000,192000,195000,198000,200000,200500,201000,201000,201000,201000,201000] },
      youtube: { volume: 78000, cpc: null, competition: null, trend: [70000,72000,74000,75500,76500,77200,77600,77800,78000,78000,78000,78000] },
      tiktok: { volume: 56000, cpc: null, competition: null, trend: [40000,44000,48000,51000,53000,54500,55200,55600,55800,56000,56000,56000] },
      instagram: { volume: 34000, cpc: null, competition: null, trend: [28000,29500,31000,32000,33000,33400,33700,33850,33950,34000,34000,34000] },
      amazon: { volume: 445000, cpc: 2.50, competition: 0.88, trend: [400000,410000,420000,430000,438000,442000,444000,444500,445000,445000,445000,445000] },
    },
  },
  {
    keyword: "pre workout",
    platforms: {
      google: { volume: 673000, cpc: 1.45, competition: 0.65, trend: [620000,635000,650000,660000,668000,672000,673000,673000,673000,673000,673000,673000] },
      youtube: { volume: 445000, cpc: null, competition: null, trend: [380000,400000,420000,432000,440000,444000,445000,445000,445000,445000,445000,445000] },
      tiktok: { volume: 560000, cpc: null, competition: null, trend: [420000,460000,490000,520000,540000,550000,555000,558000,559000,560000,560000,560000] },
      instagram: { volume: 234000, cpc: null, competition: null, trend: [200000,210000,220000,226000,230000,232000,233000,233500,234000,234000,234000,234000] },
      amazon: { volume: 890000, cpc: 1.80, competition: 0.82, trend: [800000,830000,860000,875000,885000,888000,890000,890000,890000,890000,890000,890000] },
    },
  },
  {
    keyword: "creatine monohydrate",
    platforms: {
      google: { volume: 165000, cpc: 1.95, competition: 0.70, trend: [140000,148000,155000,160000,163000,164500,165000,165000,165000,165000,165000,165000] },
      youtube: { volume: 89000, cpc: null, competition: null, trend: [75000,80000,84000,86500,88000,88800,89000,89000,89000,89000,89000,89000] },
      tiktok: { volume: 234000, cpc: null, competition: null, trend: [150000,175000,195000,215000,225000,230000,232000,233000,234000,234000,234000,234000] },
      instagram: { volume: 67000, cpc: null, competition: null, trend: [55000,58000,62000,64500,66000,66800,67000,67000,67000,67000,67000,67000] },
      amazon: { volume: 320000, cpc: 2.20, competition: 0.85, trend: [280000,295000,308000,315000,318000,319500,320000,320000,320000,320000,320000,320000] },
    },
  },
  {
    keyword: "that girl morning routine",
    platforms: {
      google: { volume: 12000, cpc: 0.25, competition: 0.18, trend: [4000,5500,7000,8500,9800,10800,11400,11700,11900,12000,12000,12000] },
      youtube: { volume: 156000, cpc: null, competition: null, trend: [80000,100000,120000,135000,145000,152000,154500,155500,156000,156000,156000,156000] },
      tiktok: { volume: 890000, cpc: null, competition: null, trend: [400000,520000,640000,750000,820000,860000,880000,888000,890000,890000,890000,890000] },
      instagram: { volume: 445000, cpc: null, competition: null, trend: [200000,280000,350000,400000,425000,438000,443000,444500,445000,445000,445000,445000] },
      pinterest: { volume: 234000, cpc: null, competition: null, trend: [120000,155000,185000,210000,222000,230000,232500,233500,234000,234000,234000,234000] },
    },
  },
  {
    keyword: "fyp fitness tips",
    platforms: {
      google: { volume: 0, cpc: null, competition: null, trend: [0,0,0,0,0,0,0,0,0,0,0,0] },
      youtube: { volume: 8500, cpc: null, competition: null, trend: [3000,4200,5500,6500,7200,7800,8100,8300,8400,8500,8500,8500] },
      tiktok: { volume: 560000, cpc: null, competition: null, trend: [280000,350000,420000,480000,520000,545000,555000,558000,559500,560000,560000,560000] },
      instagram: { volume: 45000, cpc: null, competition: null, trend: [20000,26000,32000,37000,41000,43500,44500,44800,45000,45000,45000,45000] },
    },
  },
  {
    keyword: "amazon protein powder best seller",
    platforms: {
      google: { volume: 18000, cpc: 1.65, competition: 0.55, trend: [12000,13500,15000,16200,17000,17500,17800,17950,18000,18000,18000,18000] },
      youtube: { volume: 23000, cpc: null, competition: null, trend: [15000,17500,19500,21000,22000,22600,22900,23000,23000,23000,23000,23000] },
      tiktok: { volume: 34000, cpc: null, competition: null, trend: [18000,22000,26000,29500,32000,33200,33800,34000,34000,34000,34000,34000] },
      amazon: { volume: 245000, cpc: 2.30, competition: 0.90, trend: [200000,215000,228000,238000,243000,244500,245000,245000,245000,245000,245000,245000] },
    },
  },
];

// ── Exported keyword index ────────────────────────────────────────────────────

export const KEYWORDS: CrossPlatformKeyword[] = RAW_KEYWORDS.map(buildCrossPlatform);

export const KEYWORD_INDEX: Map<string, CrossPlatformKeyword> = new Map(
  KEYWORDS.map((k) => [k.keyword.toLowerCase(), k])
);

/** Fuzzy-match: exact first, then starts-with, then includes */
export function findKeyword(query: string): CrossPlatformKeyword | null {
  const q = query.toLowerCase().trim();
  const exact = KEYWORD_INDEX.get(q);
  if (exact) return exact;

  for (const kw of KEYWORDS) {
    if (kw.keyword.toLowerCase().startsWith(q)) return kw;
  }
  for (const kw of KEYWORDS) {
    if (kw.keyword.toLowerCase().includes(q)) return kw;
  }
  return null;
}

/** Return all keywords matching a partial query */
export function searchKeywords(query: string): CrossPlatformKeyword[] {
  const q = query.toLowerCase().trim();
  if (!q) return KEYWORDS;
  return KEYWORDS.filter((kw) => kw.keyword.toLowerCase().includes(q));
}

// ── Ads data ──────────────────────────────────────────────────────────────────

const ADS_DATA: AdCreative[] = [
  {
    id: "meta_001", platform: "meta", advertiser_name: "Optimum Nutrition", advertiser_id: null,
    ad_format: "video", first_shown: "2024-01-15", last_shown: "2024-03-01", status: "active",
    headline: "Gold Standard Whey - #1 Selling Protein",
    body_text: "Build muscle with 24g of protein per serving. Shop now and save 20%!",
    image_url: null, video_url: null, landing_url: "https://www.optimumnutrition.com/gold-standard-whey",
    impressions_range: "1M-5M", spend_range: null,
    target_countries: ["US","UK","DE"], target_age_ranges: ["18-24","25-34","35-44"], target_genders: [],
    keywords_detected: ["whey protein","gold standard","muscle building","protein powder"],
  },
  {
    id: "meta_002", platform: "meta", advertiser_name: "Optimum Nutrition", advertiser_id: null,
    ad_format: "image", first_shown: "2024-02-01", last_shown: "2024-03-01", status: "active",
    headline: "Plant-Based Protein That Tastes Amazing",
    body_text: "100% vegan, 20g protein. No compromise on taste.",
    image_url: null, video_url: null, landing_url: "https://www.optimumnutrition.com/plant-protein",
    impressions_range: "100K-500K", spend_range: null,
    target_countries: ["US"], target_age_ranges: ["18-24","25-34"], target_genders: [],
    keywords_detected: ["vegan protein","plant protein","plant-based"],
  },
  {
    id: "meta_003", platform: "meta", advertiser_name: "Optimum Nutrition", advertiser_id: null,
    ad_format: "carousel", first_shown: "2024-01-20", last_shown: "2024-02-28", status: "active",
    headline: "Pre-Workout Power Stack",
    body_text: "Fuel your workouts with our best-selling pre-workout formulas. Free shipping on orders $50+",
    image_url: null, video_url: null, landing_url: "https://www.optimumnutrition.com/pre-workout",
    impressions_range: "500K-1M", spend_range: null,
    target_countries: ["US","CA"], target_age_ranges: ["18-24","25-34","35-44"], target_genders: [],
    keywords_detected: ["pre workout","energy","workout supplement"],
  },
  {
    id: "tiktok_001", platform: "tiktok", advertiser_name: "Optimum Nutrition Official", advertiser_id: null,
    ad_format: "video", first_shown: "2024-02-15", last_shown: "2024-03-01", status: "active",
    headline: "POV: You finally found THE protein",
    body_text: "Gold Standard hits different. #fitness #protein #gym",
    image_url: null, video_url: null, landing_url: "https://www.optimumnutrition.com",
    impressions_range: "2M-5M", spend_range: null,
    target_countries: ["US"], target_age_ranges: ["18-24","25-34"], target_genders: [],
    keywords_detected: ["protein","fitness","gym","gold standard"],
  },
  {
    id: "google_001", platform: "google", advertiser_name: "Optimum Nutrition", advertiser_id: null,
    ad_format: "text", first_shown: "2024-01-01", last_shown: "2024-03-01", status: "active",
    headline: "Official ON Gold Standard Whey",
    body_text: "24g Protein, 5g BCAAs. Free Shipping on Orders $50+. Shop Now!",
    image_url: null, video_url: null, landing_url: "https://www.optimumnutrition.com/gold-standard-whey",
    impressions_range: null, spend_range: null,
    target_countries: [], target_age_ranges: [], target_genders: [],
    keywords_detected: ["whey protein","gold standard whey","protein powder","ON whey"],
  },
  {
    id: "google_002", platform: "google", advertiser_name: "Optimum Nutrition", advertiser_id: null,
    ad_format: "text", first_shown: "2024-01-15", last_shown: "2024-03-01", status: "active",
    headline: "Best Pre-Workout Supplement | Optimum Nutrition",
    body_text: "Clinically Dosed Ingredients. Energy + Focus + Performance. Shop Pre-Workout.",
    image_url: null, video_url: null, landing_url: "https://www.optimumnutrition.com/pre-workout",
    impressions_range: null, spend_range: null,
    target_countries: [], target_age_ranges: [], target_genders: [],
    keywords_detected: ["pre workout","best pre workout","workout supplement"],
  },
  {
    id: "google_003", platform: "google", advertiser_name: "Optimum Nutrition", advertiser_id: null,
    ad_format: "image", first_shown: "2024-02-01", last_shown: "2024-03-01", status: "active",
    headline: "Creatine Monohydrate - Pure & Micronized",
    body_text: "5g per serving. Supports strength & power. Lab tested quality.",
    image_url: null, video_url: null, landing_url: "https://www.optimumnutrition.com/creatine",
    impressions_range: null, spend_range: null,
    target_countries: [], target_age_ranges: [], target_genders: [],
    keywords_detected: ["creatine","creatine monohydrate","micronized creatine"],
  },
];

const ALL_AD_KEYWORDS = [
  "whey protein","gold standard","muscle building","protein powder",
  "vegan protein","plant protein","plant-based","ON whey",
  "pre workout","best pre workout","workout supplement",
  "creatine","creatine monohydrate","fitness","gym",
];

export function getBrandAdsLocal(domain: string): BrandAdLibrary {
  // Only "optimumnutrition.com" has demo data
  if (domain.toLowerCase().includes("optimumnutrition")) {
    return { brand_name: "Optimum Nutrition", brand_domain: domain, ads: ADS_DATA };
  }
  return { brand_name: domain, brand_domain: domain, ads: [] };
}

export function getAdKeywords(): string[] {
  return ALL_AD_KEYWORDS;
}
