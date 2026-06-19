import { createPinoCensor } from "@gearbox-protocol/cli-utils";

let censorFn: (s: string) => string = s => s;

export function initCensor(config: unknown): void {
  censorFn = createPinoCensor(config);
}

export function censor(s: string): string {
  return censorFn(s);
}
