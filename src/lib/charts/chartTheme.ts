// Chart colors resolve through the admin panel theme variables, so charts switch
// with light/dark mode without re-rendering. Recharts accepts CSS var() values.
export const chartTooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--line-strong)",
  borderRadius: "10px",
  color: "var(--ink)",
  fontSize: 12,
  boxShadow: "var(--shadow)",
} as const

export const chartAxisStyle = {
  stroke: "var(--muted)",
  fontSize: 12,
} as const

export const chartGridStyle = {
  strokeDasharray: "3 3",
  stroke: "var(--line)",
} as const

export const CHART_COLORS = {
  primary: "var(--chart-1)",
  violet: "var(--chart-6)",
  black: "var(--chart-2)",
  gray: "var(--chart-5)",
  rose: "var(--danger)",
  green: "var(--chart-3)",
  amber: "var(--chart-4)",
  blue: "var(--accent-strong)",
} as const

export const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.black,
  CHART_COLORS.green,
  CHART_COLORS.amber,
  CHART_COLORS.gray,
  CHART_COLORS.rose,
] as const
