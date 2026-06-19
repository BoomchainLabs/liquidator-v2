import { LRUCache } from "lru-cache";
import type { ThrottleFn } from "./types.js";

interface ThrottleState {
  lastAlertTime: number;
  currentWait: number;
}

export function defaultBackoffFn(prevWait: number): number {
  return Math.min(
    prevWait ? prevWait * 2 : 10 * 60 * 1000, // 10 minutes
    24 * 60 * 60 * 1000, // 24 hours
  );
}

/**
 * Manages per-feed throttling with exponential backoff.
 * Each dedupe key has its own independent throttle timer.
 */
export class ThrottleManager {
  #state = new LRUCache<string, ThrottleState>({ max: 5000 });

  /**
   * Checks if it's permitted to send a message for the given dedupe key
   * @returns
   */
  public canSend(dedupeKey?: string): boolean {
    if (!dedupeKey) {
      return true;
    }
    const state = this.#getState(dedupeKey);
    const timeSinceLastAlert = Date.now() - state.lastAlertTime;
    return timeSinceLastAlert >= state.currentWait;
  }

  /**
   * Records that notification was sent for the given dedupe key
   */
  public onSent(
    dedupeKey?: string,
    throttleFn: ThrottleFn = defaultBackoffFn,
  ): void {
    if (!dedupeKey) {
      return;
    }
    const state = this.#getState(dedupeKey);
    this.#state.set(dedupeKey, {
      lastAlertTime: Date.now(),
      currentWait: throttleFn(state.currentWait),
    });
  }

  #getState(dedupeKey: string): ThrottleState {
    return this.#state.get(dedupeKey) ?? { lastAlertTime: 0, currentWait: 0 };
  }
}
