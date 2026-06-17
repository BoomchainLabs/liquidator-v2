import { AddressMap, type Curator, formatBN } from "@gearbox-protocol/sdk";
import type { Markdown } from "@vlad-yakovlev/telegram-md";
import { md } from "@vlad-yakovlev/telegram-md";
import { sortBy } from "lodash-es";
import type { Logger as ILogger } from "pino";
import type { Address } from "viem";

import { Logger } from "../logger";
import type { INotification } from "../notifier";
import type { ExecutionReport, OptimisticResult } from "../types";
import { mdList } from "../utils";
import { AbstractInstanceCheck } from "./AbstractInstanceCheck";
import type { ICheck, LiquidatorInstance } from "./types";

interface InsufficientBalance {
  current?: boolean;
  gasPrice: bigint;
  balanceRequired: bigint;
}

interface InstanceCheck extends LiquidatorInstance {
  balance: bigint;
  /**
   * Otherwise it is set to minumum ETH balance that is enough to liquidate any credit account given gasPrice
   * Raw approximation
   */
  insufficientBalance?: InsufficientBalance;
  /**
   * Minimum ETH balance required to perform N least profitable liquidations. Only useful when liquidations with negative profit
   * Undefined if EOA has enough ETH to liquidate these N accounts.
   */
  insufficientConsecutiveBalance?: bigint;
}

export class CheckInstanceBalances
  extends AbstractInstanceCheck
  implements ICheck
{
  public readonly name = "instance-balances";

  @Logger("CheckInstanceBalances")
  public readonly logger!: ILogger;

  #baseFee = 0n;
  #balances = new AddressMap<bigint>();

  async check(
    report: ExecutionReport,
    curator?: Curator,
  ): Promise<INotification | undefined> {
    if (curator) {
      return undefined;
    }

    const { results } = report;
    this.#baseFee = report.gasPrice;
    const checks = await Promise.all(
      this.instances.map(instance => this.#analyzeInstance(instance, results)),
    );
    const failedChecks = checks.filter(
      (c): c is InstanceCheck =>
        !!c?.insufficientBalance || !!c?.insufficientConsecutiveBalance,
    );
    if (failedChecks.length) {
      return new CheckInstanceBalancesFail(failedChecks);
    }
  }

  async #analyzeInstance(
    instance: LiquidatorInstance,
    allResults: OptimisticResult[],
  ): Promise<InstanceCheck | undefined> {
    const results = allResults.filter(r => r.trackId === instance.id);
    if (!results.length) {
      return;
    }
    const result: InstanceCheck = {
      ...instance,
      balance: 0n,
    };
    try {
      this.logger.debug(`Analyzing ${instance.address}`);
      let balance = this.#balances.get(instance.address);
      if (!balance) {
        balance = await this.sdk.client.getBalance({
          address: instance.address,
        });
        this.#balances.upsert(instance.address, balance);
      }
      result.balance = balance;
      result.insufficientBalance = this.#analyzeSingleLiquidation(
        instance.address,
        result.balance,
        results,
      );
      // Some liquidator types do not compute liquidatorProfit
      if (results?.[0]?.liquidatorProfit) {
        const numLiquidations = 10;
        this.logger.debug(
          `Analyzing ${numLiquidations} least profitable liquidations for ${instance.address}`,
        );
        result.insufficientConsecutiveBalance =
          this.#analyzeConsecutiveLiquidations(
            result.balance,
            results,
            this.#baseFee,
            numLiquidations,
          );
      }
      this.logger.debug({ instance }, "analyzed");
    } catch (e) {
      this.logger.error(
        `error analyzing ${instance.id}@${instance.address}: ${e}`,
      );
    }
  }

  /**
   * Checks if this instance has enough balance to permorm most costly (in terms of gas cost) liquidation
   * @param address
   * @param balance,
   * @param tracks
   */
  #analyzeSingleLiquidation(
    address: Address,
    balance: bigint,
    results: OptimisticResult[],
  ): InsufficientBalance | undefined {
    const byGas = sortBy(results, "gasUsed");
    const maxGas = BigInt(byGas[byGas.length - 1].gasUsed);
    const gasPriceSteps = [
      this.#baseFee,
      200n * 10n ** 9n,
      300n * 10n ** 9n,
    ].sort();
    const bal = formatBN(balance, 18);

    for (const gasPrice of gasPriceSteps) {
      const balanceRequired = gasPrice * maxGas;
      const bReq = formatBN(balanceRequired, 18);
      const gp = formatBN(gasPrice, 9);
      if (balanceRequired > balance) {
        this.logger.debug(
          `Liquidator ${address} balance ${bal} < ${bReq} (${maxGas} * ${gp})`,
        );
        return {
          gasPrice,
          balanceRequired,
          current: this.#baseFee === gasPrice,
        };
      } else {
        this.logger.debug(
          `Liquidator ${address} balance ${bal} >= ${bReq} (${maxGas} * ${gp})`,
        );
      }
    }
  }

  /**
   * Checks if balance is sufficent to perform N least profitable liquidations in a row
   * @param balance
   * @param results
   * @param gasPrice
   * @param numLiquidations
   */
  #analyzeConsecutiveLiquidations(
    balance: bigint,
    results: OptimisticResult[],
    gasPrice: bigint,
    numLiquidations: number,
  ): bigint | undefined {
    const byProfit = [...results].sort((a, b) => {
      const aa = BigInt(a.liquidatorProfit || 0);
      const bb = BigInt(b.liquidatorProfit || 0);
      return aa < bb ? -1 : bb < aa ? 1 : 0;
    });
    const leastProfitable = byProfit.splice(
      0,
      Math.min(numLiquidations, byProfit.length - 1),
    );
    const totalProfit = leastProfitable.reduce<bigint>((acc, cur) => {
      return acc + BigInt(cur.liquidatorProfit);
    }, 0n);
    // sort remaining by tx cost
    const mostExpensive = sortBy(byProfit, "gasUsed").pop();
    if (mostExpensive) {
      const balanceAfter = totalProfit + balance;
      const nextTxCost = BigInt(mostExpensive.gasUsed) * gasPrice;
      if (balanceAfter < nextTxCost) {
        return nextTxCost - balanceAfter + balance;
      }
    }
  }
}

export class CheckInstanceBalancesFail implements INotification {
  public readonly severe = true;
  public readonly instances: InstanceCheck[];

  constructor(instances: InstanceCheck[]) {
    this.instances = instances;
  }

  public get md(): Markdown {
    const lines = this.instances
      .map(l => this.#mdForInstance(l))
      .filter((l): l is Markdown => !!l);

    return md.join(["⚠️ Balance warning", mdList(lines)], "\n");
  }

  #mdForInstance(i: InstanceCheck): Markdown | undefined {
    const result: string[] = [];
    if (i.insufficientBalance) {
      const gp = md.bold(`${formatBN(i.insufficientBalance.gasPrice, 9)} gwei`);
      const req = md.bold(
        `${formatBN(i.insufficientBalance.balanceRequired, 18)} ETH`,
      );
      if (i.insufficientBalance.current) {
        result.push(
          `to liquidate some accounts at 🔹 current gasPrice ${gp}, required: ${req}`,
        );
      } else {
        result.push(
          `to liquidate some accounts at 🔺 potential high gasPrice ${gp}, required: ${req}`,
        );
      }
    }
    if (i.insufficientConsecutiveBalance) {
      const conseq = md.bold(formatBN(i.insufficientConsecutiveBalance, 18));
      result.push(`for consecutive liquidations, required: ${conseq}`);
    }

    if (result.length > 0) {
      const balance = md.bold(formatBN(i.balance, 18));
      return md`Liquidator balance ${md.bold(
        i.address,
      )} of ${balance} is insufficient ${md.join(result, " and ")}`;
    }
  }
}
