export const PLATFORM_COLORS: Record<string, string> = {
  google: "#4285F4",
  youtube: "#FF0000",
  tiktok: "#010101",
  instagram: "#E1306C",
  pinterest: "#E60023",
  amazon: "#FF9900",
  twitter: "#1DA1F2",
  bing: "#008373",
  ebay: "#E53238",
  app_store: "#0D96F6",
  play_store: "#34A853",
  etsy: "#F56400",
  naver: "#03CF5D",
  perplexity: "#7C3AED",
};

export const PLATFORM_LABELS: Record<string, string> = {
  google: "Google",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  pinterest: "Pinterest",
  amazon: "Amazon",
  twitter: "Twitter",
  bing: "Bing",
  ebay: "eBay",
  app_store: "App Store",
  play_store: "Play Store",
  etsy: "Etsy",
  naver: "Naver",
  perplexity: "Perplexity",
};

export const PLATFORM_ICONS: Record<string, string> = {
  google: "G",
  youtube: "YT",
  tiktok: "TT",
  instagram: "IG",
  pinterest: "P",
  amazon: "AZ",
  bing: "B",
};

/** Light-mode pill classes per platform */
export const PLATFORM_PILL: Record<string, string> = {
  google: "bg-blue-50 text-blue-700 border-blue-200",
  youtube: "bg-red-50 text-red-700 border-red-200",
  tiktok: "bg-slate-100 text-slate-800 border-slate-300",
  instagram: "bg-pink-50 text-pink-700 border-pink-200",
  pinterest: "bg-red-50 text-red-700 border-red-200",
  amazon: "bg-amber-50 text-amber-700 border-amber-200",
  twitter: "bg-sky-50 text-sky-700 border-sky-200",
  bing: "bg-teal-50 text-teal-700 border-teal-200",
};

export function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

export function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-50 border-emerald-200";
  if (score >= 60) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Moderate";
  return "Low";
}

export function trendDirection(trend: number[]): {
  label: string;
  color: string;
  arrow: string;
} {
  if (trend.length < 6) return { label: "No data", color: "text-slate-400", arrow: "" };
  const firstHalf = trend.slice(0, 6).reduce((a, b) => a + b, 0) / 6;
  const secondHalf = trend.slice(6).reduce((a, b) => a + b, 0) / Math.max(trend.slice(6).length, 1);
  if (secondHalf > firstHalf * 1.1) return { label: "Growing", color: "text-emerald-600", arrow: "↑" };
  if (secondHalf < firstHalf * 0.9) return { label: "Declining", color: "text-red-600", arrow: "↓" };
  return { label: "Stable", color: "text-slate-500", arrow: "→" };
}
