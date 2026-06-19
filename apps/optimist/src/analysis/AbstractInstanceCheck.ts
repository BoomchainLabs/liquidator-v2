import type { Address } from "viem";
import type { Config } from "../config";
import DI from "../di";
import type { TypedSDK } from "../types";
import type { LiquidatorInstance } from "./types";

export abstract class AbstractInstanceCheck {
  @DI.Inject(DI.Config)
  public readonly config!: Config;

  @DI.Inject(DI.SDK)
  public readonly sdk!: TypedSDK;

  protected readonly instances: LiquidatorInstance[] = [];

  constructor() {
    this.instances = Object.values(this.config.liquidators).flatMap(liq =>
      Object.keys(liq.addresses).map(
        (address): LiquidatorInstance => ({
          id: liq.id,
          name: liq.name,
          address: address as Address,
        }),
      ),
    );
  }
}
