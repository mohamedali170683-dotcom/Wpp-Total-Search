"use client";

import type { CrossPlatformKeyword } from "@/lib/types";
import { PLATFORM_LABELS, formatVolume } from "@/lib/platform-config";

interface Props {
  data: CrossPlatformKeyword;
}

export default function StatsRow({ data }: Props) {
  const platformCount = Object.keys(data.platforms).length;

  const avgCpc =
    Object.values(data.platforms)
      .filter((p) => p.cpc !== null)
      .reduce((sum, p) => sum + (p.cpc ?? 0), 0) /
      (Object.values(data.platforms).filter((p) => p.cpc !== null).length || 1);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Stat label="Total Volume" value={formatVolume(data.total_volume)} />
      <Stat
        label="Primary Platform"
        value={
          data.primary_platform
            ? PLATFORM_LABELS[data.primary_platform] || data.primary_platform
            : "N/A"
        }
      />
      <Stat label="Platforms" value={platformCount.toString()} />
      <Stat label="Avg CPC" value={`$${avgCpc.toFixed(2)}`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}
