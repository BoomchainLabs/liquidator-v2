import type {
  LiquidationStrategyKind,
  Numberish,
  OptimisticResult as SharedOptimisticResult,
} from "@gearbox-protocol/liquidator-v2-config";
import type {
  GearboxState,
  NetworkType,
  OnchainSDK,
} from "@gearbox-protocol/sdk";
import type { AccountsPlugin } from "@gearbox-protocol/sdk/plugins/accounts";
import type { Address } from "viem";

export type OptimisticResult<
  K extends LiquidationStrategyKind = LiquidationStrategyKind,
> = SharedOptimisticResult<Numberish, K> & {
  /**
   * track id, added by optimist to result from liquidator
   */
  trackId: string;
};

// liquidators produce files with this schema
export interface OptimisticFile {
  startBlock: number;
  result: OptimisticResult[] | null;
}

export interface TrackResult {
  /**
   * Id to distinguish say full and partial TS liquidators
   */
  id: string;
  /**
   * Human-readable track name
   */
  name: string;
  /**
   * Actually used liquidator image version
   */
  version: string;
  start: Date;
  end: Date;
  /**
   * liquidator failed before producing any output
   */
  error?: string;
  /**
   * might contain results for different credit managers
   */
  results: OptimisticResult[];
}

export interface ITrack {
  id: string;
  status: string;
  completed: boolean;
  run: (blockNumber: bigint) => Promise<TrackResult>;
}

export interface CreditManagerSlice {
  addr: Address;
  name: string;
  underlying: Address;
}

export type TypedSDK = OnchainSDK<{
  readonly accounts: AccountsPlugin;
}>;

export type TypedSDKState = GearboxState<{
  readonly accounts: AccountsPlugin;
}>;

export interface WhitelistEntry {
  address: Address;
  reason?: string;
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

export interface ExecutionSummarySuccess {
  version: string;
  startedAt: string;
  executionId: string;
  network: NetworkType;
  status: "success";
  /**
   * Number of discovered accounts
   */
  discovered: number;
  /**
   * Number of accounts that none of liquidators could liquidate
   */
  failed: number;
}

export interface ExecutionSummaryFailed {
  version: string;
  startedAt: string;
  executionId: string;
  network: NetworkType;
  status: "failed";
}

export type ExecutionSummary = ExecutionSummarySuccess | ExecutionSummaryFailed;

export interface TrackReport {
  id: string;
  name: string;
  start: Date;
  end: Date;
  version: string;
  emergency: boolean;
}
