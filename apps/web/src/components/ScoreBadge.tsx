import type { ScoreLabel } from "../graphql/types";

const labelStyles: Record<ScoreLabel, string> = {
  EXCELLENT: "bg-green-100 text-green-800 border border-green-300",
  GOOD: "bg-sky-100 text-sky-800 border border-sky-300",
  FAIR: "bg-amber-100 text-amber-800 border border-amber-300",
  POOR: "bg-red-100 text-red-700 border border-red-300",
};

interface Props {
  label: ScoreLabel;
  score?: number;
}

export function ScoreBadge({ label, score }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${labelStyles[label]}`}
    >
      {score !== undefined && <span>{score}</span>}
      <span>{label}</span>
    </span>
  );
}
