export type ScoreLabel = "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

export function labelForScore(score: number): ScoreLabel {
  if (score >= 85) return "EXCELLENT";
  if (score >= 65) return "GOOD";
  if (score >= 40) return "FAIR";
  return "POOR";
}
