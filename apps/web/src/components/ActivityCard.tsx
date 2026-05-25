import { useState } from "react";
import type { ActivityRanking, Activity } from "../graphql/types";
import { ScoreBadge } from "./ScoreBadge";
import { DailyBreakdown } from "./DailyBreakdown";

const activityMeta: Record<Activity, { label: string; icon: string }> = {
  SKIING: { label: "Skiing", icon: "🎿" },
  SURFING: { label: "Surfing", icon: "🏄" },
  OUTDOOR_SIGHTSEEING: { label: "Outdoor Sightseeing", icon: "🌤️" },
  INDOOR_SIGHTSEEING: { label: "Indoor Sightseeing", icon: "🏛️" },
};

const scoreBgColor: Record<string, string> = {
  EXCELLENT: "from-green-50 to-white border-green-200",
  GOOD: "from-sky-50 to-white border-sky-200",
  FAIR: "from-amber-50 to-white border-amber-200",
  POOR: "from-red-50 to-white border-red-200",
};

interface Props {
  ranking: ActivityRanking;
  rank: number;
}

export function ActivityCard({ ranking, rank }: Props) {
  const [expanded, setExpanded] = useState(false);
  const meta = activityMeta[ranking.activity];
  const bgGradient = scoreBgColor[ranking.label] ?? "from-gray-50 to-white border-gray-200";

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-5 shadow-sm transition-shadow hover:shadow-md ${bgGradient}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{meta.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                #{rank}
              </span>
              <h3 className="text-lg font-semibold text-gray-800">{meta.label}</h3>
            </div>
            <ScoreBadge label={ranking.label} score={ranking.score} />
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-expanded={expanded}
        >
          {expanded ? "▲ Hide days" : "▼ 7-day view"}
        </button>
      </div>

      <p className="mt-3 text-sm text-gray-600">{ranking.summary}</p>

      {expanded && <DailyBreakdown days={ranking.days} />}
    </div>
  );
}
