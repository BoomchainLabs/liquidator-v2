import type { Curator } from "@gearbox-protocol/sdk";
import type { Address } from "viem";
import type { INotification } from "../notifier";
import type { ExecutionReport, TrackReport } from "../types";

export interface ICheck {
  name: string;
  check: (
    report: ExecutionReport,
    curator?: Curator,
  ) => Promise<INotification | undefined>;
}

/**
 * LiquidatorInstance contains information about different liqudation service instances
 */
export interface LiquidatorInstance {
  /**
   * Configuration id, e.g. "partial" or "deleverage"
   */
  id: string;
  /**
   * Human-readable for this id
   */
  name: string;
  /**
   * Address of EOA that this instance uses to perform liquidations
   */
  address: Address;
}

export type TrackFilter = (track?: TrackReport) => boolean;
