import {
  type Curator,
  findCuratorMarketConfigurator,
  hexEq,
  type MarketSuite,
  type OnchainSDK,
} from "@gearbox-protocol/sdk";

/**
 * Returns all markets for a given curator
 * If curator is not provided, returns all markets
 * If curator is not found on the network, returns undefined
 * @param sdk
 * @param curator
 * @returns
 */
export function marketsForCurator(
  sdk: OnchainSDK,
  curator?: Curator,
): MarketSuite[] | undefined {
  if (!curator) {
    return sdk.marketRegister.markets;
  }
  const marketConfigurator = findCuratorMarketConfigurator(
    curator,
    sdk.networkType,
  );
  if (!marketConfigurator) {
    return undefined;
  }
  return sdk.marketRegister.markets.filter(m =>
    hexEq(m.configurator.address, marketConfigurator),
  );
}
