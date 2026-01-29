export const PLATFORM_COLORS: Record<string, string> = {
  google: "#4285F4",
  youtube: "#FF0000",
  tiktok: "#000000",
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
};

export function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

export function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/20 border-emerald-500/30";
  if (score >= 60) return "bg-amber-500/20 border-amber-500/30";
  return "bg-red-500/20 border-red-500/30";
}
