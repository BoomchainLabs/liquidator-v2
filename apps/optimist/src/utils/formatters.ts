import { format, intervalToDuration } from "date-fns";

export function formatDuration(interval: { start: Date; end: Date }): string {
  const { hours, minutes, seconds } = intervalToDuration(interval);
  return Object.entries({ hours, minutes, seconds })
    .map(([k, v]) => (v ? `${v}${k.slice(0, 1)}` : undefined))
    .filter(Boolean)
    .join("");
}

/**
 * Formats block timestamp or something that contains it
 * @param t
 * @returns
 */
export function formatTs(
  t:
    | number
    | bigint
    | { timestamp: number | bigint }
    | { ts: number | bigint }
    | undefined
    | null,
): string {
  if (!t) {
    return "null";
  }
  const ts =
    typeof t === "number" || typeof t === "bigint"
      ? t
      : "ts" in t
        ? t.ts
        : t.timestamp;
  const d = new Date(Number(ts) * 1000);
  return `${format(d, "dd/MM/yy HH:mm:ss")} (${ts})`;
}
