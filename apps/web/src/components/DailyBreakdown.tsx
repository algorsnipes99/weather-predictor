import type { DailyActivityScore } from "../graphql/types";
import { ScoreBadge } from "./ScoreBadge";

interface Props {
  days: DailyActivityScore[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function DailyBreakdown({ days }: Props) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-2 text-left">Day</th>
            <th className="px-4 py-2 text-left">Score</th>
            <th className="px-4 py-2 text-left">Conditions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {days.map((day) => (
            <tr key={day.date} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-700">
                {formatDate(day.date)}
              </td>
              <td className="px-4 py-2">
                <ScoreBadge label={day.label} score={day.score} />
              </td>
              <td className="px-4 py-2 text-gray-500">
                {day.reasons.slice(0, 2).join(" · ") || "No notable conditions"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
