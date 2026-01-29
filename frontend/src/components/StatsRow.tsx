"use client";

import type { CrossPlatformKeyword } from "@/lib/types";
import { PLATFORM_LABELS, formatVolume } from "@/lib/platform-config";

interface Props {
  data: CrossPlatformKeyword;
}

export default function StatsRow({ data }: Props) {
  const platformCount = Object.keys(data.platforms).length;

  const totalVolume = data.total_volume;
  const primaryPlatform = data.primary_platform
    ? PLATFORM_LABELS[data.primary_platform] || data.primary_platform
    : "N/A";

  const primaryVolume = data.primary_platform
    ? data.platforms[data.primary_platform]?.volume ?? 0
    : 0;
  const primaryShare =
    totalVolume > 0 ? ((primaryVolume / totalVolume) * 100).toFixed(0) : "0";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Stat
        label="Total Search Demand"
        value={formatVolume(totalVolume)}
        subtitle="Monthly searches"
      />
      <Stat
        label="Primary Channel"
        value={primaryPlatform}
        subtitle={`${primaryShare}% of total demand`}
      />
      <Stat
        label="Platforms Tracked"
        value={platformCount.toString()}
        subtitle="Active channels"
      />
      <Stat
        label="Opportunity Score"
        value={platformCount > 1 ? "See below" : "N/A"}
        subtitle="Platform gap analysis"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
    </div>
  );
}
