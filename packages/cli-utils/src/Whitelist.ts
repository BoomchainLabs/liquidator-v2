import { setInterval } from "node:timers";
import type { ILogger, NetworkType } from "@gearbox-protocol/sdk";
import { AddressMap } from "@gearbox-protocol/sdk";
import { z } from "zod/v4";
import { fetchRetry } from "./fetchRetry.js";
import { WhitelistItemSchema } from "./whitelist-schema.js";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

const WhitelistResponse = z.array(WhitelistItemSchema);

export interface WhitelistOptions {
  url: string;
  network: NetworkType;
  logger?: ILogger;
}

/**
 * Fetches a network-scoped whitelist from the deploy-tools backend and keeps
 * it in memory with a 10-minute refresh interval.
 *
 * On fetch failure the previous in-memory copy is retained; if no successful
 * fetch has occurred yet the whitelist is considered empty.
 */
export class Whitelist {
  readonly #url: string;
  readonly #network: NetworkType;
  readonly #logger?: ILogger;

  #items = new AddressMap<WhitelistItemSchema>();
  #refreshInterval?: NodeJS.Timeout;

  constructor({ url, network, logger }: WhitelistOptions) {
    this.#url = url;
    this.#network = network;
    this.#logger = logger?.child?.({ name: "whitelist" }) ?? logger;
  }

  /**
   * Performs the initial fetch and starts the periodic refresh timer.
   * Failure of the initial fetch is non-fatal: the whitelist stays empty.
   */
  public async start(): Promise<void> {
    this.#logger?.info(
      `loading ${this.#network} whitelist from ${this.#url}, refresh every ${REFRESH_INTERVAL_MS / 1000}s`,
    );
    await this.#refresh();
    this.#refreshInterval = setInterval(() => {
      this.#refresh().catch(e => {
        this.#logger?.warn(`unexpected whitelist refresh error: ${e}`);
      });
    }, REFRESH_INTERVAL_MS);
  }

  /** Stops the refresh timer. */
  public stop(): void {
    if (this.#refreshInterval) {
      clearInterval(this.#refreshInterval);
      this.#refreshInterval = undefined;
    }
  }

  /**
   * Fetches the whitelist from the backend, parses it and atomically
   * replaces the in-memory map. On any error logs a warning and retains
   * the previous map.
   */
  async #refresh(): Promise<void> {
    try {
      const resp = await fetchRetry(this.#url);
      if (!resp.ok) {
        throw new Error(
          `whitelist fetch failed: ${resp.status} ${resp.statusText}`,
        );
      }
      const data = await resp.json();
      const items = WhitelistResponse.parse(data).filter(
        i => i.network === this.#network,
      );
      const next = new AddressMap<WhitelistItemSchema>();
      for (const item of items) {
        next.upsert(item.address, item);
      }
      this.#items = next;
      this.#logger?.debug(
        `loaded ${items.length} whitelist entries for ${this.#network}`,
      );
    } catch (e) {
      this.#logger?.warn(
        `failed to refresh whitelist from ${this.#url}, keeping previous version: ${e}`,
      );
    }
  }

  /**
   * Returns the matching whitelist entry for the given address, or
   * `undefined` if absent or expired.
   */
  public has(address: string): WhitelistItemSchema | undefined {
    const item = this.#items.get(address);
    if (!item) {
      return undefined;
    }
    if (item.expiresAt !== undefined && Date.now() / 1000 >= item.expiresAt) {
      return undefined;
    }
    return item;
  }
}
