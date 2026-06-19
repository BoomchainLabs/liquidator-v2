import { CensoredString } from "./CensoredString.js";
import { CensoredURL } from "./CensoredURL.js";

/**
 * Raw values shorter than this are not censored, to avoid masking unrelated
 * substrings throughout the log output.
 */
const MIN_SECRET_LENGTH = 4;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectSecrets(value: unknown, out: Map<string, string>): void {
  if (value == null) {
    return;
  }
  if (value instanceof CensoredString || value instanceof CensoredURL) {
    const raw = value.value;
    if (raw.length >= MIN_SECRET_LENGTH) {
      out.set(raw, value.toString());
    }
    return;
  }
  if (typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectSecrets(item, out);
    }
    return;
  }
  for (const item of Object.values(value)) {
    collectSecrets(item, out);
  }
}

/**
 * Gathers known secrets from a config and returns a function that replaces each raw secret with its masked representation.
 * Intended for pino's `hooks.streamWrite`
 */
export function createPinoCensor(config: unknown): (s: string) => string {
  const map = new Map<string, string>();
  collectSecrets(config, map);
  if (map.size === 0) {
    return s => s;
  }
  // Longer secrets first so a secret that is a substring of another does not
  // shadow the longer match.
  const pattern = [...map.keys()]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");
  const re = new RegExp(pattern, "g");
  return s => s.replace(re, m => map.get(m) ?? m);
}
