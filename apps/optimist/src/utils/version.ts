export function major(v: number): number {
  return v >= 100 ? Math.floor(v / 100) : v;
}
