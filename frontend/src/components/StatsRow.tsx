"use client";

import type { CrossPlatformKeyword } from "@/lib/types";
import { PLATFORM_LABELS, formatVolume } from "@/lib/platform-config";

interface Props {
  data: CrossPlatformKeyword;
}

export default function StatsRow({ data }: Props) {
  const totalPlatforms = Object.keys(data.platforms).length;
  const activePlatforms = Object.values(data.platforms).filter(
    (p) => p.volume > 0
  ).length;

  const primaryPlatform = data.primary_platform
    ? PLATFORM_LABELS[data.primary_platform] || data.primary_platform
    : "N/A";

  const primaryVolume = data.primary_platform
    ? data.platforms[data.primary_platform]?.volume ?? 0
    : 0;
  const primaryShare =
    data.total_volume > 0
      ? ((primaryVolume / data.total_volume) * 100).toFixed(1)
      : "0";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Stat
        label="TOTAL SEARCH VOLUME"
        value={formatVolume(data.total_volume)}
        subtitle="Monthly across all platforms"
        borderColor="border-l-4 border-l-indigo-500"
      />
      <Stat
        label="ACTIVE PLATFORMS"
        value={`${activePlatforms} / ${totalPlatforms}`}
        subtitle="Platforms with demand signals"
        borderColor="border-l-4 border-l-emerald-500"
      />
      <Stat
        label="TOP PLATFORM"
        value={primaryPlatform}
        subtitle={`${primaryShare}% of total volume`}
        borderColor="border-l-4 border-l-amber-500"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  subtitle,
  borderColor,
}: {
  label: string;
  value: string;
  subtitle: string;
  borderColor: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${borderColor}`}
    >
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}
