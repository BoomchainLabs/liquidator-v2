import type { GearboxState } from "@gearbox-protocol/sdk";
import type { AccountsPlugin } from "@gearbox-protocol/sdk/plugins/accounts";
import type { Address } from "viem";

import type { OptimisticResult } from "./optimist.js";

export type TypedSDKState = GearboxState<{
  readonly accounts: AccountsPlugin;
}>;

export interface WhitelistEntry {
  address: Address;
  reason?: string;
}

export interface TrackReport {
  id: string;
  name: string;
  start: Date;
  end: Date;
  version: string;
  emergency: boolean;
}

export interface ExecutionReport {
  /**
   * execution_id to view logs in grafana
   */
  id: string;
  start: Date;
  end: Date;
  /**
   * Top-level error in optimistic runner execution (e.g. terminated early)
   */
  error?: string;
  /**
   * Executed tracks
   */
  tracks: TrackReport[];
  /**
   * Account liquidation results (for all tracks together)
   */
  results: OptimisticResult[];
  /**
   * Account/CM/Token addresses that we do not need to alert about, if they cannot be liquidated
   */
  whitelist?: WhitelistEntry[];
  /**
   * Gearbox SDK state when it was attached
   */
  sdkState: TypedSDKState;
  /**
   * Gas price (wei) at execution block, from sdk.client.getGasPrice()
   */
  gasPrice: bigint;
}
