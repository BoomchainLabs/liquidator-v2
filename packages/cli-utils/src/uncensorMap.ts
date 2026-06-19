export interface IValue<V extends string = string> {
  value: V;
}

export function uncensorMap<V extends string = string>(
  map: Record<string, IValue<V>>,
): Record<string, V> {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.value]));
}
