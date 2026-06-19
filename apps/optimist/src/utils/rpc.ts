import { setTimeout } from "node:timers/promises";

import { createPublicClient, http, type PublicClient } from "viem";

export async function waitForBlockNumber(rpcURL: string): Promise<bigint> {
  const client = createPublicClient({
    transport: http(rpcURL),
  });
  for (let i = 0; i < 60; i++) {
    try {
      const blockNumber = await client.getBlockNumber();
      return blockNumber;
    } catch {
      await setTimeout(500);
    }
  }
  throw new Error("timed out while trying to get block number");
}

export async function waitForChainId(client: PublicClient): Promise<number> {
  for (let i = 0; i < 60; i++) {
    try {
      const chainId = await client.getChainId();
      return chainId;
    } catch {
      await setTimeout(500);
    }
  }
  throw new Error("timed out while trying to get chain id");
}
